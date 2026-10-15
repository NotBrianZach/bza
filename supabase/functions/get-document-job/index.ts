/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function signedUrlOrNull(
  serviceClient: ReturnType<typeof createClient>,
  bucket: string,
  path?: string | null,
) {
  if (!path) return null;
  const { data, error } = await serviceClient.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization) return errorResponse("Missing Authorization header", 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return errorResponse("Unauthorized", 401, userError?.message);
    }

    let jobId: string | null = null;
    if (req.method === "GET") {
      jobId = new URL(req.url).searchParams.get("id");
    } else {
      const body = await req.json().catch(() => null);
      jobId = body?.id ?? null;
    }

    if (!jobId) return errorResponse("Missing job id", 400);

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: job, error: jobError } = await serviceClient
      .from("document_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userData.user.id)
      .single();

    if (jobError || !job) {
      return errorResponse("Job not found", 404, jobError?.message);
    }

    const bucket = job.output_bucket ?? job.source_bucket;
    const signed_urls = {
      raw_markdown: await signedUrlOrNull(serviceClient, bucket, job.raw_markdown_path),
      readable_markdown: await signedUrlOrNull(serviceClient, bucket, job.readable_markdown_path),
      chunks_json: await signedUrlOrNull(serviceClient, bucket, job.chunks_json_path),
    };

    // Record billing for Nougat when job first completes
    if (job.status === "done" && job.processing_method === "nougat" && !job.billed_at) {
      const pages = job.page_count ?? 0
      if (pages > 0) {
        const { data: nougPricing } = await serviceClient
          .from("pricing_config").select("markup_multiplier").eq("model", "nougat").eq("active", true).maybeSingle()
        const baseCost = pages * 0.002  // $0.002/page (cheaper than Mathpix)
        await serviceClient.from("api_usage").insert({
          user_id: userData.user.id,
          api_provider: "cloud_run",
          model: "nougat",
          endpoint_type: "document",
          request_type: "pdf_processing",
          input_tokens: pages,
          output_tokens: 0,
          base_cost: baseCost,
          markup_multiplier: (nougPricing?.markup_multiplier ?? 2.0),
          book_id: null,
          request_metadata: { job_id: jobId, processing_method: "nougat", num_pages: pages },
        }).then(({ error }) => {
          if (error) console.error("Failed to record Nougat usage:", error)
          else serviceClient.from("document_jobs").update({ billed_at: new Date().toISOString() }).eq("id", jobId).then(() => {})
        })
      }
    }

    return jsonResponse({ job, signed_urls });
  } catch (error) {
    return errorResponse(
      "Unexpected error",
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
});
