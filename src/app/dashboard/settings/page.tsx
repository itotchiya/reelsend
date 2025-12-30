import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { db } from "@/lib/db";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <PageHeader title="Settings" />
            <PageContent>
                <SettingsClient user={user} />
            </PageContent>
        </div>
    );
}
