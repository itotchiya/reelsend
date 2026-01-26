
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateCampaignClient } from "./create-campaign-client";

export default async function NewCampaignPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return <CreateCampaignClient />;
}
