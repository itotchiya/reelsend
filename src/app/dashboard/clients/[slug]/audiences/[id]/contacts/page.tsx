import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactsClient } from "./contacts-client";

interface ContactsPageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        search?: string;
        status?: string;
    }>;
}

export default async function ContactsPage({ params, searchParams }: ContactsPageProps) {
    const session = await auth();
    const { slug, id } = await params;
    const { page = "1", pageSize: pageSizeParam, search = "", status = "all" } = await searchParams;

    if (!session?.user?.id) {
        redirect("/login");
    }

    const audience = await db.audience.findUnique({
        where: { id },
        include: {
            client: true,
        }
    });

    if (!audience || audience.client.slug !== slug) {
        redirect(`/dashboard/clients/${slug}`);
    }

    const pageSize = parseInt(pageSizeParam || "20", 10);
    const currentPage = parseInt(page, 10) || 1;

    const where: any = { audienceId: id };
    if (search) {
        where.OR = [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
        ];
    }
    if (status !== "all") {
        where.status = status.toUpperCase();
    }

    const [contacts, totalCount] = await Promise.all([
        db.contact.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        }),
        db.contact.count({ where }),
    ]);

    return (
        <ContactsClient
            audience={JSON.parse(JSON.stringify(audience))}
            contacts={JSON.parse(JSON.stringify(contacts))}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            searchValue={search}
            statusFilter={status}
        />
    );
}
