import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Users, Building2, TrendingUp } from "lucide-react";

const stats = [
    {
        title: "Total Campaigns",
        value: "0",
        description: "Active campaigns this month",
        icon: Mail,
    },
    {
        title: "Total Contacts",
        value: "0",
        description: "Across all audiences",
        icon: Users,
    },
    {
        title: "Active Clients",
        value: "0",
        description: "Clients with active campaigns",
        icon: Building2,
    },
    {
        title: "Avg. Open Rate",
        value: "0%",
        description: "Last 30 days",
        icon: TrendingUp,
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome to Reelsend. Manage your email campaigns across all clients.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Get Started</CardTitle>
                        <CardDescription>Set up your first client and campaign</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                1
                            </div>
                            <div>
                                <p className="font-medium">Add a Client</p>
                                <p className="text-sm text-muted-foreground">Create your first client with their branding</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                2
                            </div>
                            <div>
                                <p className="font-medium">Import Contacts</p>
                                <p className="text-sm text-muted-foreground">Upload your contact list</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                3
                            </div>
                            <div>
                                <p className="font-medium">Create a Campaign</p>
                                <p className="text-sm text-muted-foreground">Design and send your first email</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest actions in your workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Email Health</CardTitle>
                        <CardDescription>Domain and sending status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">mail.mbouf.site</span>
                            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                Pending Verification
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Check your SES console for domain verification status.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
