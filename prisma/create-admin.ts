import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Get the SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({
        where: { name: "SUPER_ADMIN" },
    });

    if (!superAdminRole) {
        console.error("❌ SUPER_ADMIN role not found. Please run the seed first.");
        process.exit(1);
    }

    // Create a SuperAdmin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const user = await prisma.user.upsert({
        where: { email: "admin@reelsend.com" },
        update: {
            password: hashedPassword,
            roleId: superAdminRole.id,
        },
        create: {
            email: "admin@reelsend.com",
            name: "Super Admin",
            password: hashedPassword,
            roleId: superAdminRole.id,
        },
    });

    console.log("✅ SuperAdmin user created/updated:");
    console.log("   Email: admin@reelsend.com");
    console.log("   Password: admin123");
    console.log("   Role: SUPER_ADMIN");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
