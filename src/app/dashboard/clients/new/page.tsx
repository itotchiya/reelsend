import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AddClientClient } from "./add-client-client";

export default async function NewClientPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    // Check if user has permission to create clients
    if (!userPermissions?.includes("clients:create")) {
        redirect("/dashboard/clients");
    }

    return <AddClientClient />;
}
