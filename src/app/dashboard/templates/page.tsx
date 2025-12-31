import { db } from "@/lib/db";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
    const templates = await db.template.findMany({
        include: {
            client: true,
            baseLayout: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return <TemplatesClient initialTemplates={templates} />;
}
