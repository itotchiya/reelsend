# 🛡️ Data Backup & Restore Guide

This project includes an automated system to backup the requested Neon PostgreSQL database to a secured Google Drive folder.

## 🚀 Quick Commands

### 1. Manual Backup
To immediately create a database dump and upload it to Google Drive:

```bash
npx tsx scripts/backup-to-drive.ts
```

*   **Output:** Creates a `.dump` file (custom pg_dump format) and uploads it to the configured Drive folder.
*   **Location:** Temporarily saves to `./temp` before uploading.

### 2. Restore Data (Local)
To restore from a previous backup **locally** (requires PostgreSQL installed):

```bash
npx tsx scripts/restore-from-drive.ts
```

### 3. Restore Data (Via GitHub Actions)
If you don't have PostgreSQL installed locally, you can trigger a restore remotely:

1.  Go to your GitHub Repository → **Actions** tab.
2.  Select **"Restore Database from Google Drive"** workflow.
3.  Click **"Run workflow"**.
4.  Enter the backup number (1 = most recent) and type **"RESTORE"** to confirm.
5.  Click **"Run workflow"** and wait for completion.

*   **Interactive Mode:** It will list the 10 most recent backups found in Google Drive.
*   **Selection:** Type the number of the backup you want to restore.
*   **Safety:** You will be asked to type `yes` to confirm destruction of current data.

---

## 🤖 Automated Backups (GitHub Actions)
The system is configured to run automatically via GitHub Actions:
*   **Schedule:** Runs daily at **12:00 UTC**.
*   **Workflow file:** `.github/workflows/backup.yaml`.
*   **Storage:** Backups are stored in the project's effectively "private" Google Drive folder.

---

## ⚙️ Configuration (Local Development)
To run these scripts locally (on your machine), you need a `.env.local` file with the following keys. 
**Note:** Ask the project owner for the specific values; do not commit them to Git.

```dotenv
# Database Connection
DATABASE_URL="..."

# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REFRESH_TOKEN="..."
```

## 🛠️ Utilities (Danger Zone)

### 🧹 Wipe Database
To delete ALL data (users, clients, campaigns) to start fresh or test restoration:
```bash
npx tsx scripts/erase-db.ts
```

### 👑 Create Super Admin
To manually create a Super Admin user (useful after a reset):
```bash
npx tsx scripts/create-admin.ts
```

## 🛠️ Troubleshooting

*   **"File not found" error:**  
    *   Ensure the `GOOGLE_DRIVE_FOLDER_ID` is correct.
    *   Ensure the Google Account associated with the `GOOGLE_REFRESH_TOKEN` has permission to view that folder.
*   **"Quota exceeded":** 
    *   The scripts use the OAuth user's storage quota (likely the project owner's 15GB+ drive), not a Service Account's 0GB quota.
*   **Database connection error:**
    *   Check your `DATABASE_URL` is valid and accessible from your IP.
