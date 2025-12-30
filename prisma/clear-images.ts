import { db } from "../src/lib/db";

async function clearUserImages() {
    console.log("Clearing all user images...");

    const result = await db.user.updateMany({
        data: {
            image: null,
        },
    });

    console.log(`Cleared images for ${result.count} users.`);
    process.exit(0);
}

clearUserImages().catch(console.error);
