import { google } from 'googleapis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const execAsync = promisify(exec);

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Auth Config
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Decide Authentication Method
async function getDriveClient() {
    // 1. Prefer OAuth (User impersonation) to avoid Quota limits
    if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
        console.log('🔐 Authenticating via OAuth 2.0 (User Quota)...');
        const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
        oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    // 2. Fallback to Service Account (Only works for Workspace/Shared Drives)
    if (SERVICE_ACCOUNT_KEY) {
        console.log('🤖 Authenticating via Service Account...');
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_KEY,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        return google.drive({ version: 'v3', auth });
    }

    throw new Error('❌ No valid Google credentials found. Set GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN or GOOGLE_APPLICATION_CREDENTIALS.');
}

if (!DRIVE_FOLDER_ID || !DATABASE_URL) {
    console.error('❌ Missing configuration. Please ensure DATABASE_URL and GOOGLE_DRIVE_FOLDER_ID are set.');
    process.exit(1);
}

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reelsend_backup_${timestamp}.dump`;
    const tempFilePath = path.resolve(process.cwd(), 'temp', filename);

    // Ensure temp dir exists
    if (!fs.existsSync(path.dirname(tempFilePath))) {
        fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    }

    console.log(`📦 Starting backup to ${filename}...`);

    try {
        // 1. Dump Database
        const command = `pg_dump "${DATABASE_URL}" -Fc -f "${tempFilePath}"`;
        await execAsync(command);
        console.log('✅ Database dump created locally.');

        // 2. Upload to Google Drive
        const drive = await getDriveClient();
        console.log('☁️ Uploading to Google Drive...');

        const fileMetadata = {
            name: filename,
            parents: [DRIVE_FOLDER_ID as string], // Cast to string to fix TS error
        };

        const media = {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(tempFilePath),
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log(`🎉 Backup uploaded successfully! File ID: ${file.data.id}`);

        // 3. Clean up
        fs.unlinkSync(tempFilePath);
        console.log('🧹 Local temp file cleaned up.');

    } catch (error) {
        console.error('❌ Backup failed:', error);
        if (fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {
                // ignore
            }
        }
        process.exit(1);
    }
}

backup();
