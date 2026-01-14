import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is missing.');
        process.exit(1);
    }

    const client = new Client({ connectionString: dbUrl });

    try {
        console.log('⚠️  DANGER ZONE ⚠️');
        console.log('This script will DELETE ALL DATA from the database.');
        console.log('Tables will be truncated (emptied), but the schema will remain.');

        const confirm = await question('Are you sure you want to proceed? Type "DELETE" to confirm: ');

        if (confirm !== 'DELETE') {
            console.log('❌ Operation cancelled.');
            process.exit(0);
        }

        await client.connect();

        console.log('�️  Fetching all tables...');
        const res = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);

        if (res.rows.length === 0) {
            console.log('No tables found.');
            process.exit(0);
        }

        const tables = res.rows.map(row => `"${row.tablename}"`).join(', ');

        console.log(`🗑️  Truncating ${res.rows.length} tables...`);
        // TRUNCATE ... CASCADE deletes data from mentioned tables and any tables that reference them
        await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);

        console.log('✅ Database wiped successfully.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
        rl.close();
    }
}

main();
