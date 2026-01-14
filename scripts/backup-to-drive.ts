import { google } from 'googleapis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env depending on your setup
// You might want to point this to .env.local if that's where your secrets are
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const execAsync = promisify(exec);

// Configuration
const SERVICE_ACCOUNT_KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SERVICE_ACCOUNT_KEY_FILE || !DRIVE_FOLDER_ID || !DATABASE_URL) {
    console.error('❌ Missing configuration. Please ensure the following environment variables are set:');
    console.error('   - GOOGLE_APPLICATION_CREDENTIALS (path to service-account.json)');
    console.error('   - GOOGLE_DRIVE_FOLDER_ID (ID of the folder to upload to)');
    console.error('   - DATABASE_URL (Neon PostgreSQL connection string)');
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

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
        // Note: This requires pg_dump to be installed and in the PATH
        const command = `pg_dump "${DATABASE_URL}" -Fc -f "${tempFilePath}"`;
        await execAsync(command);
        console.log('✅ Database dump created locally.');

        // 2. Upload to Google Drive
        console.log('☁️ Uploading to Google Drive...');
        const fileMetadata = {
            name: filename,
            parents: [DRIVE_FOLDER_ID as string],
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
