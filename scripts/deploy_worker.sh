#!/usr/bin/env bash
# Deploy the Marker Cloud Run worker and Cloud Tasks queue for bza.
# Credentials must be exported into the environment before calling this script
# (deploy_bza_web.sh does this via TempleDB secret export).
#
# Usage (standalone):
#   source <(templedb secret export bza --format dotenv)
#   ./scripts/deploy_worker.sh

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
ok()     { echo -e "${GREEN}✓ $*${NC}"; }
info()   { echo -e "${YELLOW}→ $*${NC}"; }
header() { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }
die()    { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID in TempleDB bza secrets}"
: "${GCP_REGION:=us-central1}"
: "${CLOUD_RUN_SERVICE:=marker-readable-worker}"
: "${CLOUD_TASKS_QUEUE:=document-processing}"
: "${SUPABASE_URL:?Set SUPABASE_URL in TempleDB bza secrets}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY in TempleDB bza secrets}"
: "${WORKER_SECRET:?Set WORKER_SECRET in TempleDB bza secrets}"
: "${OUTPUT_BUCKET:=documents}"
: "${WORKER_SERVICE_ACCOUNT_NAME:=marker-readable-worker}"
: "${TASK_INVOKER_SERVICE_ACCOUNT_NAME:=marker-readable-task-invoker}"
: "${CLOUD_TASKS_MAX_ATTEMPTS:=5}"
: "${CLOUD_TASKS_MAX_CONCURRENT_DISPATCHES:=2}"
: "${CLOUD_TASKS_MAX_DISPATCHES_PER_SECOND:=1}"
: "${CLOUD_TASKS_MIN_BACKOFF:=30s}"
: "${CLOUD_TASKS_MAX_BACKOFF:=1800s}"
: "${CLOUD_TASKS_DISPATCH_DEADLINE_SECONDS:=3600}"

command -v gcloud >/dev/null || die "gcloud CLI not found"

gcloud config set project "$GCP_PROJECT_ID"

header "[1/7] Enabling required Google Cloud APIs"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  cloudtasks.googleapis.com \
  iamcredentials.googleapis.com
ok "APIs enabled"

PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
WORKER_SA="${WORKER_SERVICE_ACCOUNT_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
TASK_INVOKER_SA="${TASK_INVOKER_SERVICE_ACCOUNT_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
CLOUD_TASKS_SERVICE_AGENT="service-${PROJECT_NUMBER}@gcp-sa-cloudtasks.iam.gserviceaccount.com"

ensure_service_account() {
  local name="$1" display="$2"
  if ! gcloud iam service-accounts describe "${name}@${GCP_PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$name" --display-name "$display"
    ok "Created service account: $name"
  else
    info "Service account already exists: $name"
  fi
}

header "[2/7] Creating service accounts"
ensure_service_account "$WORKER_SERVICE_ACCOUNT_NAME"       "Marker readable worker"
ensure_service_account "$TASK_INVOKER_SERVICE_ACCOUNT_NAME" "Cloud Tasks invoker for marker readable worker"

header "[3/7] Granting IAM roles"
# Worker SA can enqueue Cloud Tasks
gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
  --member "serviceAccount:${WORKER_SA}" \
  --role roles/cloudtasks.enqueuer \
  --quiet >/dev/null

# Cloud Tasks service agent can generate OIDC tokens for the invoker SA
gcloud iam service-accounts add-iam-policy-binding "$TASK_INVOKER_SA" \
  --member "serviceAccount:${CLOUD_TASKS_SERVICE_AGENT}" \
  --role roles/iam.serviceAccountUser \
  --quiet >/dev/null

# Worker SA can actAs the invoker SA when creating tasks with OIDC tokens
gcloud iam service-accounts add-iam-policy-binding "$TASK_INVOKER_SA" \
  --member "serviceAccount:${WORKER_SA}" \
  --role roles/iam.serviceAccountUser \
  --quiet >/dev/null
ok "IAM roles granted"

header "[4/7] Creating/updating Cloud Tasks queue"
if ! gcloud tasks queues describe "$CLOUD_TASKS_QUEUE" --location "$GCP_REGION" >/dev/null 2>&1; then
  gcloud tasks queues create "$CLOUD_TASKS_QUEUE" --location "$GCP_REGION"
  ok "Queue created: $CLOUD_TASKS_QUEUE"
fi

gcloud tasks queues update "$CLOUD_TASKS_QUEUE" \
  --location "$GCP_REGION" \
  --max-dispatches-per-second "$CLOUD_TASKS_MAX_DISPATCHES_PER_SECOND" \
  --max-concurrent-dispatches "$CLOUD_TASKS_MAX_CONCURRENT_DISPATCHES" \
  --max-attempts "$CLOUD_TASKS_MAX_ATTEMPTS" \
  --min-backoff "$CLOUD_TASKS_MIN_BACKOFF" \
  --max-backoff "$CLOUD_TASKS_MAX_BACKOFF"
ok "Queue configured: $CLOUD_TASKS_QUEUE"

header "[4b/7] Granting Cloud Build permissions to default compute service account"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
  --member "serviceAccount:${COMPUTE_SA}" \
  --role roles/cloudbuild.builds.builder \
  --quiet >/dev/null
ok "Cloud Build builder role granted to $COMPUTE_SA"

header "[5/7] Deploying Cloud Run worker"
gcloud run deploy "$CLOUD_RUN_SERVICE" \
  --source cloud-run-worker \
  --region "$GCP_REGION" \
  --allow-unauthenticated \
  --service-account "$WORKER_SA" \
  --memory 32Gi \
  --cpu 8 \
  --timeout 3600 \
  --concurrency 1 \
  --min-instances 0 \
  --set-env-vars "SUPABASE_URL=$SUPABASE_URL,OUTPUT_BUCKET=$OUTPUT_BUCKET,MAX_FILE_MB=250,MARKER_TIMEOUT_SECONDS=1800,MARKER_DISABLE_IMAGE_EXTRACTION=true,MARKER_USE_LLM=false,USE_NOUGAT=false,NOUGAT_CHECKPOINT=facebook/nougat-base,NOUGAT_TIMEOUT_SECONDS=3600,NOUGAT_BATCHSIZE=1" \
  --set-env-vars "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,WORKER_SECRET=$WORKER_SECRET" \
  --set-env-vars "CLOUD_TASKS_PROJECT_ID=$GCP_PROJECT_ID,CLOUD_TASKS_LOCATION=$GCP_REGION,CLOUD_TASKS_QUEUE=$CLOUD_TASKS_QUEUE,CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT=$TASK_INVOKER_SA,CLOUD_TASKS_MAX_ATTEMPTS=$CLOUD_TASKS_MAX_ATTEMPTS,CLOUD_TASKS_DISPATCH_DEADLINE_SECONDS=$CLOUD_TASKS_DISPATCH_DEADLINE_SECONDS"

WORKER_URL="$(gcloud run services describe "$CLOUD_RUN_SERVICE" --region "$GCP_REGION" --format='value(status.url)')"
PROCESS_TASK_URL="${WORKER_URL}/process-task"

header "[6/7] Updating Cloud Run env with final service URL"
# --update-env-vars patches only these keys; --set-env-vars would wipe everything else
gcloud run services update "$CLOUD_RUN_SERVICE" \
  --region "$GCP_REGION" \
  --update-env-vars "WORKER_URL=$WORKER_URL,CLOUD_TASKS_TARGET_URL=$PROCESS_TASK_URL,CLOUD_TASKS_OIDC_AUDIENCE=$PROCESS_TASK_URL"
ok "WORKER_URL set in Cloud Run env"

header "[7/7] Granting Cloud Run Invoker to the task OIDC service account"
gcloud run services add-iam-policy-binding "$CLOUD_RUN_SERVICE" \
  --region "$GCP_REGION" \
  --member "serviceAccount:${TASK_INVOKER_SA}" \
  --role roles/run.invoker \
  --quiet >/dev/null
ok "Invoker permission granted"

# Persist the worker URL back into TempleDB so subsequent deploys can read it
if command -v templedb >/dev/null; then
  templedb var set bza WORKER_URL "$WORKER_URL"
  ok "WORKER_URL saved to TempleDB bza vars: $WORKER_URL"
fi

echo
echo "━━━ Cloud Run worker deployed ━━━"
echo "  WORKER_URL=$WORKER_URL"
echo "  CLOUD_TASKS_TARGET_URL=$PROCESS_TASK_URL"
echo "  Task invoker SA: $TASK_INVOKER_SA"
echo
