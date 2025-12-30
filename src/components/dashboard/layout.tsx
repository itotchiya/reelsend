"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n";
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
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { hasPermission, Permission } from "@/lib/permissions";
import { BreadcrumbProvider, useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";

interface NavItem {
    titleKey: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: Permission;
}

interface NavGroup {
    titleKey: string;
    items: NavItem[];
    permission?: Permission;
}

const navigation: NavGroup[] = [
    {
        titleKey: "overview",
        items: [
            { titleKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        titleKey: "emailMarketing",
        items: [
            { titleKey: "campaigns", href: "/dashboard/campaigns", icon: Mail, permission: "campaigns:view" },
            { titleKey: "templates", href: "/dashboard/templates", icon: FileText, permission: "templates:view" },
            { titleKey: "audiences", href: "/dashboard/audiences", icon: Users, permission: "audiences:view" },
        ],
    },
    {
        titleKey: "management",
        items: [
            { titleKey: "clients", href: "/dashboard/clients", icon: Building2, permission: "clients:view" },
            { titleKey: "domains", href: "/dashboard/domains", icon: Globe, permission: "domains:view" },
            { titleKey: "analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "analytics:view" },
        ],
    },
    {
        titleKey: "settings",
        permission: "settings:view",
        items: [
            { titleKey: "rolesPermissions", href: "/dashboard/settings/roles", icon: Shield, permission: "roles:manage" },
            { titleKey: "team", href: "/dashboard/settings/team", icon: UserCog, permission: "users:manage" },
        ],
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t } = useI18n();

    const userPermissions = (session?.user as any)?.permissions as string[] | undefined;

    // Translation map for navigation labels
    const navLabels: Record<string, string> = {
        overview: t.common.overview,
        dashboard: t.common.dashboard,
        emailMarketing: t.nav?.emailMarketing || "Email Marketing",
        campaigns: t.common.campaigns,
        templates: t.common.templates,
        audiences: t.common.audiences,
        management: t.nav?.management || "Management",
        clients: t.common.clients,
        domains: t.common.domains,
        analytics: t.common.analytics,
        settings: t.common.settings,
        rolesPermissions: t.common.rolesPermissions,
        team: t.common.team,
    };

    // Filter navigation based on permissions
    const filteredNavigation = navigation
        .filter((group) => {
            if (group.permission && !hasPermission(userPermissions, group.permission)) {
                return false;
            }
            return true;
        })
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                if (item.permission && !hasPermission(userPermissions, item.permission)) {
                    return false;
                }
                return true;
            }),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar className="border-r-0 bg-transparent">
            {/* Logo - left aligned, just text */}
            <SidebarHeader className="h-16 flex items-center justify-start px-6">
                <Link href="/dashboard" className="flex items-center">
                    <span className="text-xl font-bold tracking-tight">Reelsend</span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-4 py-2">
                {filteredNavigation.map((group) => (
                    <SidebarGroup key={group.titleKey} className="py-3">
                        <SidebarGroupLabel className="px-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">
                            {navLabels[group.titleKey] || group.titleKey}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="space-y-1">
                                {group.items.map((item) => {
                                    // For dashboard, only exact match. For others, allow prefix match
                                    const isActive = item.href === "/dashboard"
                                        ? pathname === item.href
                                        : pathname === item.href || pathname.startsWith(item.href + "/");
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                            >
                                                <Link
                                                    href={item.href}
                                                    className={`
                                                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                                                        transition-all duration-150 ease-in-out
                                                        ${isActive
                                                            ? "bg-background text-foreground font-medium"
                                                            : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                                                        }
                                                    `}
                                                >
                                                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-foreground" : ""}`} />
                                                    <span className="truncate text-sm">{navLabels[item.titleKey] || item.titleKey}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    );
}

// Breadcrumb component that generates crumbs from pathname
function DashboardBreadcrumb() {
    const pathname = usePathname();
    const { t } = useI18n();

    const segments = pathname.split("/").filter(Boolean);

    // Map segments to readable names
    const getSegmentLabel = (segment: string): string => {
        // Check for overrides first
        const { overrides } = useBreadcrumbs();
        if (overrides[segment]) return overrides[segment];

        const labelMap: Record<string, string> = {
            dashboard: t.common.dashboard,
            clients: t.common.clients,
            campaigns: t.common.campaigns,
            templates: t.common.templates,
            audiences: t.common.audiences,
            domains: t.common.domains,
            analytics: t.common.analytics,
            settings: t.common.settings,
            roles: t.common.rolesPermissions,
            team: t.common.team,
        };
        return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    // Filter out UUID-like segments for display but keep paths correct
    const displaySegments = segments.filter(s => !s.match(/^[a-z0-9]{20,}$/i));

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {displaySegments.map((segment, index) => {
                    const href = "/" + segments.slice(0, segments.indexOf(segment) + 1).join("/");
                    const isLast = index === displaySegments.length - 1;
                    const label = getSegmentLabel(segment);

                    return (
                        <React.Fragment key={href}>
                            {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                                        {label}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

// Header user dropdown component
function HeaderUserDropdown() {
    const { data: session } = useSession();
    const { t } = useI18n();

    const userName = session?.user?.name || "User";
    const userEmail = session?.user?.email || "";

    // Get initials for avatar
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 hover:bg-background/80 transition-colors outline-none border border-border/50">
                <Avatar className="h-7 w-7">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">{userName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        {t.common.settings}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.common.signOut}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <BreadcrumbProvider>
            <SidebarProvider>
                {/* Outer container with dashboard background */}
                <div className="flex min-h-screen w-full bg-dashboard-bg">
                    <AppSidebar />

                    {/* Main area wrapper */}
                    <div className="flex-1 flex flex-col">
                        {/* Top header bar */}
                        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-dashboard-bg px-4">
                            {/* Left side: sidebar toggle + breadcrumbs */}
                            <div className="flex items-center gap-3">
                                <SidebarTrigger className="h-9 w-9 shrink-0 bg-interactive hover:bg-interactive-hover transition-colors rounded-lg" />
                                <Separator orientation="vertical" className="h-5" />
                                <DashboardBreadcrumb />
                            </div>

                            {/* Right side: language, theme, user profile */}
                            <div className="ml-auto flex items-center gap-2">
                                <LanguageToggle />
                                <ThemeToggle />
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <HeaderUserDropdown />
                            </div>
                        </header>

                        {/* Content area - only top rounded, connects to bottom */}
                        <main className="flex-1 flex flex-col overflow-hidden px-4 pb-0">
                            <div className="bg-dashboard-surface rounded-t-xl flex-1 flex flex-col overflow-y-auto min-h-0">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </BreadcrumbProvider>
    );
}
