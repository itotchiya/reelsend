import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define all permissions with their categories
const permissions = [
    // Clients
    { key: "clients:view", name: "View Clients", category: "Clients", description: "View client list and details" },
    { key: "clients:create", name: "Create Clients", category: "Clients", description: "Add new clients" },
    { key: "clients:edit", name: "Edit Clients", category: "Clients", description: "Edit client information" },
    { key: "clients:delete", name: "Delete Clients", category: "Clients", description: "Delete clients" },

    // Campaigns
    { key: "campaigns:view", name: "View Campaigns", category: "Campaigns", description: "View campaigns" },
    { key: "campaigns:create", name: "Create Campaigns", category: "Campaigns", description: "Create new campaigns" },
    { key: "campaigns:edit", name: "Edit Campaigns", category: "Campaigns", description: "Edit draft campaigns" },
    { key: "campaigns:send", name: "Send Campaigns", category: "Campaigns", description: "Send/schedule campaigns" },
    { key: "campaigns:delete", name: "Delete Campaigns", category: "Campaigns", description: "Delete campaigns" },

    // Templates
    { key: "templates:view", name: "View Templates", category: "Templates", description: "View templates" },
    { key: "templates:create", name: "Create Templates", category: "Templates", description: "Create templates" },
    { key: "templates:edit", name: "Edit Templates", category: "Templates", description: "Edit templates" },
    { key: "templates:delete", name: "Delete Templates", category: "Templates", description: "Delete templates" },

    // Audiences
    { key: "audiences:view", name: "View Audiences", category: "Audiences", description: "View audiences" },
    { key: "audiences:create", name: "Create Audiences", category: "Audiences", description: "Create audiences" },
    { key: "audiences:import", name: "Import Contacts", category: "Audiences", description: "Import contacts" },
    { key: "audiences:edit", name: "Edit Audiences", category: "Audiences", description: "Edit audience settings" },
    { key: "audiences:delete", name: "Delete Audiences", category: "Audiences", description: "Delete audiences" },

    // Domains
    { key: "domains:view", name: "View Domains", category: "Domains", description: "View domains" },
    { key: "domains:create", name: "Add Domains", category: "Domains", description: "Add domains" },
    { key: "domains:verify", name: "Verify Domains", category: "Domains", description: "Verify domains" },
    { key: "domains:delete", name: "Delete Domains", category: "Domains", description: "Remove domains" },

    // Analytics
    { key: "analytics:view", name: "View Analytics", category: "Analytics", description: "View campaign analytics" },
    { key: "analytics:export", name: "Export Analytics", category: "Analytics", description: "Export reports" },

    // Settings
    { key: "settings:view", name: "View Settings", category: "Settings", description: "View settings" },
    { key: "settings:edit", name: "Edit Settings", category: "Settings", description: "Edit system settings" },
    { key: "roles:manage", name: "Manage Roles", category: "Settings", description: "Manage roles and permissions" },
    { key: "users:manage", name: "Manage Users", category: "Settings", description: "Manage team members" },

    // Portal
    { key: "portal:share", name: "Share Portal", category: "Portal", description: "Generate shareable links for clients" },
    { key: "portal:view_own", name: "View Own Portal", category: "Portal", description: "View own campaigns/analytics" },
];

// Define roles with their permissions
const roles = [
    {
        name: "SUPER_ADMIN",
        description: "Full system access, manages roles and permissions",
        isSystem: true,
        permissions: permissions.filter(p => p.key !== "portal:view_own").map(p => p.key),
    },
    {
        name: "ADMIN",
        description: "Manages clients, teams, and campaigns",
        isSystem: true,
        permissions: [
            "clients:view", "clients:create", "clients:edit", "clients:delete",
            "campaigns:view", "campaigns:create", "campaigns:edit", "campaigns:send", "campaigns:delete",
            "templates:view", "templates:create", "templates:edit", "templates:delete",
            "audiences:view", "audiences:create", "audiences:import", "audiences:edit", "audiences:delete",
            "domains:view", "domains:create", "domains:verify", "domains:delete",
            "analytics:view", "analytics:export",
            "settings:view", "portal:share",
        ],
    },
    {
        name: "DESIGNER",
        description: "Creates and edits email templates",
        isSystem: true,
        permissions: [
            "clients:view",
            "campaigns:view",
            "templates:view", "templates:create", "templates:edit", "templates:delete",
        ],
    },
    {
        name: "MARKETER",
        description: "Creates campaigns and shares with clients",
        isSystem: true,
        permissions: [
            "clients:view",
            "campaigns:view", "campaigns:create", "campaigns:edit", "campaigns:send",
            "templates:view",
            "audiences:view", "audiences:create", "audiences:import", "audiences:edit",
            "analytics:view",
            "portal:share",
        ],
    },
    {
        name: "CLIENT",
        description: "External client - views own campaigns and analytics",
        isSystem: true,
        permissions: ["portal:view_own"],
    },
];

async function main() {
    console.log("🌱 Seeding database...");

    // Create all permissions
    console.log("Creating permissions...");
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { key: perm.key },
            update: perm,
            create: perm,
        });
    }
    console.log(`✅ Created ${permissions.length} permissions`);

    // Create roles and assign permissions
    console.log("Creating roles...");
    for (const roleData of roles) {
        const { permissions: permKeys, ...role } = roleData;

        // Create or update the role
        const createdRole = await prisma.role.upsert({
            where: { name: role.name },
            update: { description: role.description, isSystem: role.isSystem },
            create: { name: role.name, description: role.description, isSystem: role.isSystem },
        });

        // Get permission IDs
        const permissionRecords = await prisma.permission.findMany({
            where: { key: { in: permKeys } },
        });

        // Delete existing role permissions and recreate
        await prisma.rolePermission.deleteMany({
            where: { roleId: createdRole.id },
        });

        // Create role permissions
        await prisma.rolePermission.createMany({
            data: permissionRecords.map(p => ({
                roleId: createdRole.id,
                permissionId: p.id,
            })),
        });

        console.log(`  ✅ ${role.name}: ${permissionRecords.length} permissions`);
    }

    console.log("✅ Seeding complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
