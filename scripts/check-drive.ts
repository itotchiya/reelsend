import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

async function check() {
    console.log('🔍 Google Drive Diagnostic Tool');
    console.log('-------------------------------');

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        console.error('❌ Missing OAuth credentials in .env.local');
        return;
    }

    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Check the specific folder
    if (DRIVE_FOLDER_ID) {
        console.log(`\n1. Checking configured folder ID: ${DRIVE_FOLDER_ID}`);
        try {
            const res = await drive.files.get({
                fileId: DRIVE_FOLDER_ID,
                fields: 'id, name, webViewLink, capabilities',
            });
            console.log('✅ Folder FOUND!');
            console.log(`   Name: ${res.data.name}`);
            console.log(`   Link: ${res.data.webViewLink}`);
            console.log(`   Can Add Children: ${res.data.capabilities?.canAddChildren}`);
        } catch (error: any) {
            console.log('❌ Folder NOT FOUND or NO ACCESS.');
            console.log(`   Error: ${error.message}`);
        }
    } else {
        console.log('\n1. No GOOGLE_DRIVE_FOLDER_ID configured.');
    }

    // 2. List recent folders
    console.log('\n2. Listing your recent folders (Root level):');
    try {
        const list = await drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false",
            pageSize: 10,
            fields: 'files(id, name)',
        });

        if (list.data.files && list.data.files.length > 0) {
            list.data.files.forEach((f) => {
                console.log(`   📁 ${f.name} (ID: ${f.id})`);
            });
            console.log('\n--> Please copy the correct ID to your GOOGLE_DRIVE_FOLDER_ID variable.');
        } else {
            console.log('   (No folders found in root)');
        }
    } catch (error: any) {
        console.error('❌ Error listing files:', error.message);
    }
}

check();
