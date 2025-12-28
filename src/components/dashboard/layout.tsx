"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    LayoutDashboard,
    Users,
    Building2,
    Mail,
    FileText,
    BarChart3,
    Globe,
    Settings,
    ChevronDown,
    Shield,
    UserCog,
    LogOut,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { hasPermission, Permission } from "@/lib/permissions";

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: Permission;
}

interface NavGroup {
    title: string;
    items: NavItem[];
    permission?: Permission; // Group-level permission
}

const navigation: NavGroup[] = [
    {
        title: "Overview",
        items: [
            { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Email Marketing",
        items: [
            { title: "Campaigns", href: "/dashboard/campaigns", icon: Mail, permission: "campaigns:view" },
            { title: "Templates", href: "/dashboard/templates", icon: FileText, permission: "templates:view" },
            { title: "Audiences", href: "/dashboard/audiences", icon: Users, permission: "audiences:view" },
        ],
    },
    {
        title: "Management",
        items: [
            { title: "Clients", href: "/dashboard/clients", icon: Building2, permission: "clients:view" },
            { title: "Domains", href: "/dashboard/domains", icon: Globe, permission: "domains:view" },
            { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "analytics:view" },
        ],
    },
    {
        title: "Settings",
        permission: "settings:view",
        items: [
            { title: "Roles & Permissions", href: "/dashboard/settings/roles", icon: Shield, permission: "roles:manage" },
            { title: "Team", href: "/dashboard/settings/team", icon: UserCog, permission: "users:manage" },
        ],
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const userPermissions = (session?.user as any)?.permissions as string[] | undefined;
    const userName = session?.user?.name || "User";
    const userEmail = session?.user?.email || "";
    const userRole = (session?.user as any)?.role || "User";

    // Get initials for avatar
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Filter navigation based on permissions
    const filteredNavigation = navigation
        .filter((group) => {
            // If group has permission requirement, check it
            if (group.permission && !hasPermission(userPermissions, group.permission)) {
                return false;
            }
            return true;
        })
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                // If item has permission requirement, check it
                if (item.permission && !hasPermission(userPermissions, item.permission)) {
                    return false;
                }
                return true;
            }),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar>
            <SidebarHeader className="border-b px-6 py-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        R
                    </div>
                    <span className="text-lg font-semibold">Reelsend</span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2">
                {filteredNavigation.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={session?.user?.image || ""} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{userName}</p>
                                <p className="text-xs text-muted-foreground">{userRole}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{userName}</p>
                            <p className="text-xs text-muted-foreground">{userEmail}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar />
                <main className="flex-1">
                    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-6">
                        <SidebarTrigger />
                        <ThemeToggle />
                    </header>
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </SidebarProvider>
    );
}
