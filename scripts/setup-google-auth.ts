import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import url from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

async function main() {
    console.log('🔐 Google Drive OAuth Setup');
    console.log('---------------------------');
    console.log('We are using a local server to capture the credentials.');
    console.log('PLEASE ENSURE: In Google Cloud Console, your OAuth Client is type "Desktop App".');
    console.log('If asked for "Authorized redirect URIs", add: http://127.0.0.1:3000/oauth2callback\n');

    const clientId = process.env.GOOGLE_CLIENT_ID || await question('Enter your Client ID: ');
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || await question('Enter your Client Secret: ');

    // Configure OAuth2 client with localhost redirect
    const redirectUri = 'http://127.0.0.1:3000/oauth2callback';

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    // We need full 'drive' scope to access folders created by the User in the Web UI.
    // 'drive.file' only allows access to files created by THIS app.
    const scopes = ['https://www.googleapis.com/auth/drive'];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });

    // Start local server to handle the callback
    const server = http.createServer(async (req, res) => {
        if (req.url && req.url.startsWith('/oauth2callback')) {
            const qs = new url.URL(req.url, 'http://127.0.0.1:3000').searchParams;
            const code = qs.get('code');

            if (code) {
                res.end('Authentication successful! You can close this window and return to the terminal.');
                server.close();

                try {
                    const { tokens } = await oauth2Client.getToken(code);

                    console.log('\n✅ Success! Here are your credentials for .env.local / GitHub Secrets:');
                    console.log('------------------------------------------------------------------');
                    console.log(`GOOGLE_CLIENT_ID="${clientId}"`);
                    console.log(`GOOGLE_CLIENT_SECRET="${clientSecret}"`);
                    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
                    console.log('------------------------------------------------------------------');
                    console.log('⚠️  Save these 3 lines in your .env.local file and GitHub Secrets!');

                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error retrieving access token:', error);
                    process.exit(1);
                }
            }
        }
    });

    server.listen(3000, () => {
        console.log('\n👉 Go to this URL to authorize the app:');
        console.log(authUrl);
        console.log('\n(Waiting for you to login...)');
    });
}

main();
