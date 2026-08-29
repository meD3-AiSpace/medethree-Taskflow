# Google Cloud CLI Tool Selection Guide

Use this guide to choose the correct command-line interface tool for Google Cloud operations.

## Tool Summary Table

| Service / Resource Category | Preferred CLI Tool | Alternative / Modern Equivalent | Examples |
| :--- | :--- | :--- | :--- |
| **Compute Engine (VMs, Disks, Networks)** | `gcloud compute` | - | `gcloud compute instances list` |
| **Google Kubernetes Engine (GKE)** | `gcloud container` | `kubectl` | `gcloud container clusters get-credentials` |
| **Cloud Storage (Buckets, Objects)** | `gcloud storage` or `gsutil` | `gcloud storage` (recommended) | `gcloud storage cp`, `gsutil mb` |
| **BigQuery (Datasets, Tables, Queries)** | `bq` | `gcloud alpha bq` | `bq query --use_legacy_sql=false` |
| **Cloud Functions / Cloud Run** | `gcloud functions`, `gcloud run` | - | `gcloud run deploy` |
| **IAM, Policies & Projects** | `gcloud projects`, `gcloud iam` | - | `gcloud projects add-iam-policy-binding` |
| **Artifact Registry / Container Registry** | `gcloud artifacts` | - | `gcloud artifacts docker images list` |
| **Cloud SQL** | `gcloud sql` | - | `gcloud sql instances describe` |

## Decision Rules
1. **BigQuery Operations**: Always default to `bq` unless a pure gcloud wrapper is requested.
2. **Cloud Storage Operations**: Prefer `gcloud storage` for new scripts, fallback to `gsutil` if explicitly specified.
3. **General GCP Resource Management**: Use `gcloud <group> <command>`.
