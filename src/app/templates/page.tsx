import { redirect } from "next/navigation";

// Redirect /templates to /dashboard/clients (templates are now client-scoped)
export default function TemplatesRedirectPage() {
    redirect("/dashboard/clients");
}
