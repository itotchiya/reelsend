import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

async function main() {
    try {
        console.log('👑 Create Super Admin User');
        console.log('------------------------');

        const email = await question('Enter Email: ');
        if (!email) {
            console.log('Email is required.');
            process.exit(1);
        }

        const password = await question('Enter Password: ');
        if (!password) {
            console.log('Password is required.');
            process.exit(1);
        }

        // 1. Find SUPER_ADMIN role
        const superAdminRole = await prisma.role.findUnique({
            where: { name: 'SUPER_ADMIN' },
        });

        if (!superAdminRole) {
            console.error('❌ Error: SUPER_ADMIN role not found. Did you run "npx prisma migrate reset" or "npx prisma db seed"?');
            process.exit(1);
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create User
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                roleId: superAdminRole.id,
                name: 'Super Admin',
                status: 'ACTIVE',
                emailVerified: new Date(),
            },
        });

        console.log(`\n✅ Super Admin created successfully!`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);

    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint
            console.error('\n❌ Error: A user with that email already exists.');
        } else {
            console.error('\n❌ Error creating user:', error);
        }
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();
