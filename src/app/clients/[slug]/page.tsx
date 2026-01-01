import { redirect } from "next/navigation";

interface Props {
    params: Promise<{ slug: string }>;
}

// Redirect /clients/[slug] to /dashboard/clients/[slug]
export default async function ClientRedirectPage({ params }: Props) {
    const { slug } = await params;
    redirect(`/dashboard/clients/${slug}`);
}
