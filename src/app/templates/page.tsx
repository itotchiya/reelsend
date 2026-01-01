import { redirect } from "next/navigation";

// Redirect /templates to /dashboard/templates
export default function TemplatesRedirectPage() {
    redirect("/dashboard/templates");
}
