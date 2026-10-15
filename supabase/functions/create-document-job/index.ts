/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

type CreateJobBody = {
  bucket?: string;
  path?: string;
  profile?: "default" | "study" | "mobile" | "dense" | string;
  processingMethod?: "default" | "nougat" | "mathpix" | "jina";
  options?: Record<string, unknown>;
};

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isSafeStoragePath(path: string): boolean {
  if (!path || path.includes("..") || path.startsWith("/") || path.endsWith("/")) {
    return false;
  }
  return true;
}

async function enqueueWorker(jobId: string): Promise<Record<string, unknown>> {
  const workerUrl = trimTrailingSlash(requiredEnv("WORKER_URL"));
  const workerSecret = requiredEnv("WORKER_SECRET");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("worker enqueue timeout"), 15_000);

  try {
    const res = await fetch(`${workerUrl}/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": workerSecret,
      },
      body: JSON.stringify({ job_id: jobId }),
      signal: controller.signal,
    });

    const text = await res.text();
    const parsed = text ? JSON.parse(text) : {};

    if (!res.ok) {
      throw new Error(`Worker enqueue failed: HTTP ${res.status} ${text.slice(0, 800)}`);
    }

    return parsed as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const defaultOutputBucket = Deno.env.get("DEFAULT_OUTPUT_BUCKET") ?? "documents";

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

    const body = (await req.json().catch(() => null)) as CreateJobBody | null;
    if (!body) return errorResponse("Invalid JSON body", 400);

    const bucket = body.bucket ?? "documents";
    const path = body.path ?? "";
    const profile = body.profile ?? "default";
    const options = body.options ?? {};

    if (!isSafeStoragePath(path)) return errorResponse("Invalid storage path", 400);

    const expectedPrefix = `users/${userData.user.id}/`;
    if (!path.startsWith(expectedPrefix)) {
      return errorResponse(
        `Source path must start with ${expectedPrefix}`,
        403,
      );
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Storage quota check ────────────────────────────────────────────────────
    const { data: quotaRows } = await serviceClient.rpc("get_user_quota", {
      user_uuid: userData.user.id,
    });
    const quota = quotaRows?.[0] as {
      storage_bytes_used: number;
      storage_limit_bytes: number;
    } | undefined;

    if (
      quota &&
      quota.storage_limit_bytes > 0 &&
      quota.storage_bytes_used >= quota.storage_limit_bytes
    ) {
      return errorResponse(
        "Storage quota exceeded. Add more storage at aireadalong.com/billing.",
        402,
      );
    }

    const processingMethod = body.processingMethod ?? "default"

    // ── Pro tier check for Nougat ──────────────────────────────────────────────
    if (processingMethod === "nougat") {
      const { data: quotaRows2 } = await serviceClient.rpc("get_user_quota", { user_uuid: userData.user.id })
      const tier = (quotaRows2?.[0] as any)?.tier ?? "free"
      if (tier === "free") {
        return errorResponse("Nougat requires a Pro account", 403)
      }
    }

    // Cheap existence check. This also catches typos before creating a job.
    const { error: signedUrlError } = await serviceClient.storage
      .from(bucket)
      .createSignedUrl(path, 60);

    if (signedUrlError) {
      return errorResponse("Source file not found or not readable", 404, signedUrlError.message);
    }

    const { data: job, error: insertError } = await serviceClient
      .from("document_jobs")
      .insert({
        user_id: userData.user.id,
        source_bucket: bucket,
        source_path: path,
        output_bucket: defaultOutputBucket,
        profile,
        options,
        processing_method: processingMethod,
        status: "queued",
      })
      .select("*")
      .single();

    if (insertError || !job) {
      return errorResponse("Could not create document job", 500, insertError?.message);
    }

    try {
      const enqueue = await enqueueWorker(job.id);
      return jsonResponse({
        job_id: job.id,
        status: "enqueued",
        job: { ...job, status: "enqueued" },
        enqueue,
      }, 202);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await serviceClient
        .from("document_jobs")
        .update({
          status: "failed",
          error: `Cloud Tasks enqueue failed: ${message}`,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return errorResponse("Could not enqueue document job", 502, message);
    }
  } catch (error) {
    return errorResponse(
      "Unexpected error",
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
});
