/**
 * Non-interactive restore script for GitHub Actions (CI)
 * Reads BACKUP_INDEX from environment to select which backup to restore.
 */
import { google } from 'googleapis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
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

// Backup selection (1-indexed, from GitHub Actions input)
const BACKUP_INDEX = parseInt(process.env.BACKUP_INDEX || '1', 10);

async function getDriveClient() {
    if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
        console.log('🔐 Authenticating via OAuth 2.0...');
        const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
        oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
        return google.drive({ version: 'v3', auth: oauth2Client });
    }
    throw new Error('❌ Missing OAuth credentials.');
}

if (!DRIVE_FOLDER_ID || !DATABASE_URL) {
    console.error('❌ Missing configuration (DATABASE_URL or GOOGLE_DRIVE_FOLDER_ID).');
    process.exit(1);
}

async function restore() {
    try {
        const drive = await getDriveClient();
        console.log('🔍 Listing backups from Google Drive...');

        const res = await drive.files.list({
            q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)',
            pageSize: 10,
        });

        const files = res.data.files;
        if (!files || files.length === 0) {
            console.log('No backups found.');
            process.exit(0);
        }

        console.log('\nAvailable Backups:');
        files.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name} (Created: ${file.createdTime})`);
        });

        const choice = BACKUP_INDEX - 1;
        if (choice < 0 || choice >= files.length) {
            console.error(`❌ Invalid BACKUP_INDEX: ${BACKUP_INDEX}. Must be between 1 and ${files.length}.`);
            process.exit(1);
        }

        const selectedFile = files[choice];
        console.log(`\n✅ Selected: ${selectedFile.name}`);

        // Download file
        const destPath = path.resolve(process.cwd(), 'temp', selectedFile.name!);
        if (!fs.existsSync(path.dirname(destPath))) {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
        }

        console.log(`⬇️ Downloading ${selectedFile.name}...`);
        const stream = fs.createWriteStream(destPath);

        const downloadRes = await drive.files.get(
            { fileId: selectedFile.id!, alt: 'media' },
            { responseType: 'stream' }
        );

        await new Promise((resolve, reject) => {
            downloadRes.data
                .on('end', resolve)
                .on('error', reject)
                .pipe(stream);
        });

        console.log('✅ Download complete.');
        console.log('🔄 Restoring database...');

        const cmd = `pg_restore --clean --no-owner --no-acl --dbname="${DATABASE_URL}" "${destPath}"`;
        await execAsync(cmd);

        console.log('🎉 Restore completed successfully!');

        // Cleanup
        fs.unlinkSync(destPath);
        console.log('🧹 Cleanup done.');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        process.exit(1);
    }
}

restore();
