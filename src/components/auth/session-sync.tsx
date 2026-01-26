"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function SessionSync() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const checkSession = async () => {
        if (document.hidden) return;

        try {
            const res = await fetch("/api/auth/sync");
            if (res.ok) {
                const data = await res.json();
                if (data.status === "requires_logout") {
                    setIsOpen(true);
                }
            }
        } catch (error) {
            console.error("[SESSION_SYNC_ERROR]", error);
        }
    };

    // Check on navigation
    useEffect(() => {
        if (session?.user) {
            // Use a microtask to avoid synchronous setState warning during effect body execution
            Promise.resolve().then(() => checkSession());
        }
    }, [pathname, session]);

    useEffect(() => {
        if (!session?.user) return;

        // 1. Check current session state
        // Using a small delay to avoid React's cascading render warning
        if ((session.user as { requiresLogout?: boolean }).requiresLogout) {
            const timeout = setTimeout(() => setIsOpen(true), 0);
            return () => clearTimeout(timeout);
        }

        // 2. Periodic sync (Heartbeat) - every 2 minutes for cost efficiency
        const interval = setInterval(checkSession, 120000); // 2 minutes

        return () => clearInterval(interval);
    }, [session]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await signOut({ callbackUrl: "/login" });
    };

    // Force logout on any attempt to close the dialog
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleLogout();
        }
    };

    const authT = (t as unknown as { [key: string]: any }).auth || {};
    const commonT = t.common || {};

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] border-destructive/20 shadow-2xl shadow-destructive/10">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <DialogTitle className="text-center text-xl">
                        {authT.sessionExpiredTitle || "Session Expired"}
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {authT.reloginRequired || "Your session has expired or your account settings have changed. Please log in again to continue."}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center pt-6">
                    <Button 
                        variant="destructive" 
                        onClick={handleLogout} 
                        disabled={isLoggingOut}
                        className="w-full sm:w-auto gap-2 px-8"
                    >
                        <LogOut className="h-4 w-4" />
                        {isLoggingOut ? (commonT as { [key: string]: any }).signingOut || "Signing out..." : commonT.signOut || "Sign Out Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
