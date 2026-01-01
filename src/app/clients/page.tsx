import { redirect } from "next/navigation";

// Redirect /clients to /dashboard/clients
export default function ClientsRedirectPage() {
    redirect("/dashboard/clients");
}
