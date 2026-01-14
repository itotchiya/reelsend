import { google } from 'googleapis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const execAsync = promisify(exec);

// Configuration
const SERVICE_ACCOUNT_KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SERVICE_ACCOUNT_KEY_FILE || !DRIVE_FOLDER_ID || !DATABASE_URL) {
    console.error('❌ Missing configuration (check .env).');
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

async function restore() {
    try {
        console.log('🔍 Listing backups from Google Drive...');

        // List files in the folder
        const res = await drive.files.list({
            q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)',
            pageSize: 10,
        });

        const files = res.data.files;
        if (!files || files.length === 0) {
            console.log('No backups found in the specified folder.');
            process.exit(0);
        }

        console.log('\nAvailable Backups:');
        files.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name} (Created: ${file.createdTime})`);
        });

        const answer = await question('\nEnter the number of the backup to restore (1 for latest): ');
        const choice = parseInt(answer) - 1;

        if (isNaN(choice) || choice < 0 || choice >= files.length) {
            console.log('Invalid choice.');
            process.exit(1);
        }

        const selectedFile = files[choice];
        console.log(`\nSelected: ${selectedFile.name}`);

        const confirm = await question(`⚠️  WARNING: This will DESTROY all current data in the database!\nType "yes" to confirm restore: `);
        if (confirm.toLowerCase() !== 'yes') {
            console.log('Restore cancelled.');
            process.exit(0);
        }

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

        // Restore command
        // Using --clean to drop existing objects
        // Using --no-owner --no-acl for Neon compatibility
        const cmd = `pg_restore --clean --no-owner --no-acl --dbname="${DATABASE_URL}" "${destPath}"`;
        await execAsync(cmd);

        console.log('🎉 Restore completed successfully!');

        // Cleanup
        fs.unlinkSync(destPath);
        console.log('🧹 Cleanup done.');

    } catch (error) {
        console.error('❌ Restore failed:', error);
    } finally {
        rl.close();
    }
}

restore();
