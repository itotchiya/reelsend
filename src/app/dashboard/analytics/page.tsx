import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

export default function AnalyticsPage() {
    return (
        <>
            <PageHeader title="Analytics" />
            <PageContent>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                        <p className="text-muted-foreground text-center">
                            Send your first campaign to start seeing analytics data.
                        </p>
                    </CardContent>
                </Card>
            </PageContent>
        </>
    );
}
