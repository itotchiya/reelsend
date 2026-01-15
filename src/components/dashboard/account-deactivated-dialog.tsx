"use client";

import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface AccountDeactivatedDialogProps {
    open: boolean;
}

export function AccountDeactivatedDialog({ open }: AccountDeactivatedDialogProps) {
    const router = useRouter();
    // Prevent hydration mismatch
    const [mounted, setMounted] = useState(false);
    const { t } = useI18n();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t.accountDeactivated.title}</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            {t.accountDeactivated.description}
                        </p>
                        <p>
                            {t.accountDeactivated.instruction}
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col !space-x-0 space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
                    <Button
                        variant="secondary"
                        onClick={() => signOut({ callbackUrl: "/contact" })}
                        className="w-full sm:w-auto"
                    >
                        {t.accountDeactivated.contactSupport}
                    </Button>
                    <AlertDialogAction
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full sm:w-auto"
                    >
                        {t.accountDeactivated.ok}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
