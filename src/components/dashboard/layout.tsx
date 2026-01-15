"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useUserProfile } from "@/hooks/use-user-profile";
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
    Sparkles,
    Server,
    LayoutGrid,
    LayoutTemplate,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import { AccountDeactivatedDialog } from "@/components/dashboard/account-deactivated-dialog";
import { HeaderActions } from "@/components/dashboard/header-actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
            { titleKey: "templates", href: "/dashboard/templates", icon: LayoutTemplate, permission: "templates:view" },
            { titleKey: "library", href: "/dashboard/library", icon: LayoutGrid, permission: "templates:view" },
            { titleKey: "promptBuilder", href: "/dashboard/promptbuilder", icon: Sparkles, permission: "templates:create" },
            { titleKey: "audiences", href: "/dashboard/audiences", icon: Users, permission: "audiences:view" },
        ],
    },
    {
        titleKey: "management",
        items: [
            { titleKey: "clients", href: "/dashboard/clients", icon: Building2, permission: "clients:view" },
            { titleKey: "analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "analytics:view" },
            { titleKey: "postalConfig", href: "/dashboard/postal", icon: Server, permission: "settings:view" },
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
    const { user: userProfile, isDeactivated } = useUserProfile();

    const { isMobile, setOpenMobile } = useSidebar();
    const userPermissions = (session?.user as any)?.permissions as string[] | undefined;
    const userName = userProfile?.name || session?.user?.name || "User";
    const userEmail = userProfile?.email || session?.user?.email || "";
    const userImage = userProfile?.image || null;
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Translation map for navigation labels
    const navLabels: Record<string, string> = {
        overview: t.common.overview,
        dashboard: t.common.dashboard,
        emailMarketing: t.nav?.emailMarketing || "Email Marketing",
        campaigns: t.common.campaigns,
        library: "Library",
        templates: t.common.templates,
        blockLibrary: t.blocks?.title || "Block Library",
        promptBuilder: t.promptBuilder?.title || "Prompt Builder",
        audiences: t.common.audiences,
        management: t.nav?.management || "Management",
        clients: t.common.clients,
        domains: t.common.domains,
        analytics: t.common.analytics,
        settings: t.common.settings,
        postalConfig: "Postal Config",
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
        <>
            <AccountDeactivatedDialog open={!!isDeactivated} />
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
                                                        onClick={() => isMobile && setOpenMobile(false)}
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

                <SidebarFooter className="p-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="w-full flex items-center gap-3 px-3 h-14 hover:bg-background/60 rounded-xl transition-all cursor-pointer"
                            >
                                <Avatar className="h-8 w-8 rounded-full shrink-0">
                                    <AvatarImage src={userImage || ""} className="rounded-full" />
                                    <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start flex-1 min-w-0">
                                    <span className="text-sm font-bold truncate w-full text-foreground tracking-tight">{userName}</span>
                                    <span className="text-[11px] text-muted-foreground truncate w-full">{userEmail}</span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56" side="right" sideOffset={10}>
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
                </SidebarFooter>
            </Sidebar>
        </>
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

    // Handle ellipsis for long paths (> 4 items)
    const MAX_ITEMS = 4;
    const items = displaySegments.map((segment) => ({
        label: getSegmentLabel(segment),
        href: "/" + segments.slice(0, segments.indexOf(segment) + 1).join("/"),
    }));

    let visibleItems = items;
    let hasEllipsis = false;

    if (items.length > MAX_ITEMS) {
        // Keep the first item and the last (MAX_ITEMS - 1) items
        const firstItem = items[0];
        const lastItems = items.slice(-(MAX_ITEMS - 1));
        visibleItems = [firstItem, ...lastItems];
        hasEllipsis = true;
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {visibleItems.map((item, index) => {
                    const isLast = index === visibleItems.length - 1;
                    const isFirst = index === 0;

                    return (
                        <React.Fragment key={item.href}>
                            {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                            {isFirst && hasEllipsis && (
                                <>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href={item.href} className="text-muted-foreground hover:text-foreground transition-colors overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px] inline-block align-bottom">
                                            {item.label}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                                    <BreadcrumbItem>
                                        <span className="text-muted-foreground">...</span>
                                    </BreadcrumbItem>
                                </>
                            )}
                            {(!isFirst || !hasEllipsis) && (
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage className="font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] sm:max-w-[200px]">
                                            {item.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={item.href} className="text-muted-foreground hover:text-foreground transition-colors overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px] sm:max-w-[150px] inline-block align-bottom">
                                            {item.label}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            )}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Check if we are on a template editor or block editor page
    const isEditor = /\/library\/templates\/[^/]+$/.test(pathname) || /\/library\/blocks\/[^/]+$/.test(pathname) || /\/templates\/[^/]+$/.test(pathname) || /\/blocks\/[^/]+$/.test(pathname);

    // Check if we are on a settings page (full-page layout without sidebar)
    const isSettings = pathname.startsWith("/dashboard/settings");

    if (isEditor || isSettings) {
        return (
            <BreadcrumbProvider>
                {children}
            </BreadcrumbProvider>
        );
    }

    return (
        <BreadcrumbProvider>
            <SidebarProvider>
                {/* Outer container with dashboard background */}
                <div className="flex min-h-screen w-full bg-dashboard-bg">
                    <AppSidebar />

                    {/* Main area wrapper */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Top header bar */}
                        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 bg-dashboard-bg px-4">
                            {/* Left side: sidebar toggle + breadcrumbs (hidden on mobile) */}
                            <div className="flex items-center gap-3">
                                <SidebarTrigger className="h-9 w-9" />
                                <Separator orientation="vertical" className="h-5" />
                                <div className="hidden md:block">
                                    <DashboardBreadcrumb />
                                </div>
                            </div>

                            {/* Right side: notifications, language, theme */}
                            <div className="ml-auto">
                                <HeaderActions />
                            </div>
                        </header>

                        {/* Mobile Breadcrumb Sub-header */}
                        <div className="md:hidden px-4 pb-3 flex items-center h-10 -mt-2">
                            <DashboardBreadcrumb />
                        </div>

                        {/* Content area - only top rounded, connects to bottom */}
                        <main className="flex-1 flex flex-col overflow-hidden px-0 md:px-4 pb-0">
                            <div className="bg-dashboard-surface rounded-none md:rounded-t-xl flex-1 flex flex-col overflow-y-auto min-h-0 shadow-none border-t-0 md:border-t md:border-x border-border/50">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </BreadcrumbProvider>
    );
}
