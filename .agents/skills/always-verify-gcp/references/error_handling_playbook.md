# Google Cloud Error Handling Playbook

This playbook provides actionable diagnosis steps for common Google Cloud CLI errors.

## Common Error Patterns & Solutions

### 1. `PERMISSION_DENIED` / 403 Forbidden
* **Root Cause**: The active service account or user identity lacks the required IAM role.
* **Diagnosis**:
  1. Check active account: `gcloud config get-value account`
  2. Check active project: `gcloud config get-value project`
* **Remediation**:
  - Request the missing IAM role (e.g., `roles/viewer`, `roles/editor`, `roles/storage.objectViewer`).
  - Re-authenticate with `gcloud auth login` or `gcloud auth application-default login`.

### 2. `NOT_FOUND` / 404 Resource Not Found
* **Root Cause**: Target resource does not exist in the specified project, region, or zone.
* **Diagnosis**:
  1. Verify resource spelling and ID.
  2. Check region/zone: `gcloud config get-value compute/region` / `compute/zone`.
* **Remediation**:
  - List existing resources to confirm name: `gcloud <group> list`.
  - Add explicit `--project`, `--region`, or `--location` flag.

### 3. `ALREADY_EXISTS` / 409 Conflict
* **Root Cause**: Resource name is already taken globally or within the project.
* **Diagnosis**:
  - For Cloud Storage buckets, names are globally unique across all Google Cloud customers.
* **Remediation**:
  - Choose a unique suffix (e.g., `-prod-12345`).

### 4. `QUOTA_EXCEEDED` / 429 Too Many Requests
* **Root Cause**: Project has exceeded API rate limits or resource quotas (e.g., CPUs, IP addresses).
* **Remediation**:
  - Apply exponential backoff.
  - Request a quota increase in the Google Cloud Console.

### 5. `UNAUTHENTICATED` / 401
* **Root Cause**: Credentials expired or not configured.
* **Remediation**:
  - Run `gcloud auth login` or export `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.
