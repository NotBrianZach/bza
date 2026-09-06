import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // The pdf-to-text route uses child_process.spawn which cannot run on
  // Cloudflare Workers. It must be migrated to a Supabase edge function
  // before deploying. See: supabase/functions/pdf-to-text/ (TODO).
});
