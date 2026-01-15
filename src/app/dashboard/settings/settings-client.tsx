"use client";

import React, { useState, useLayoutEffect, useRef } from "react";
import { User } from "@prisma/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User as UserIcon, Shield, Check } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
    EditAvatarDialog,
    EditNameDialog,
    EditEmailDialog,
    EditPasswordDialog,
    EditNotificationsDialog
} from "./edit-settings-dialogs";
import { useI18n } from "@/lib/i18n";

interface SettingsClientProps {
    user: User;
}

export function SettingsClient({ user }: SettingsClientProps) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('profile');
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

    const tabs = [
        { name: (t.settings as any)?.items?.profile || "Profile", value: 'profile', icon: UserIcon },
        { name: (t.settings as any)?.items?.security || "Security", value: 'security', icon: Shield },
        { name: (t.settings as any)?.items?.notifications || "Notifications", value: 'notifications', icon: Bell }
    ];

    // Dialog states
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);
    const [isNameOpen, setIsNameOpen] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    useLayoutEffect(() => {
        const activeIndex = tabs.findIndex(tab => tab.value === activeTab);
        const activeTabElement = tabRefs.current[activeIndex];

        if (activeTabElement) {
            const { offsetLeft, offsetWidth } = activeTabElement;
            setUnderlineStyle({
                left: offsetLeft,
                width: offsetWidth
            });
        }
    }, [activeTab]);

    const userName = user.name || "User";
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="max-w-5xl mx-auto w-full space-y-8 pb-20">
            {/* Animated Underline Tabs */}
            <div className="w-full border-b border-border/50">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="relative bg-transparent h-auto p-0 flex gap-8">
                        {tabs.map((tab, index) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                ref={el => { tabRefs.current[index] = el; }}
                                className={cn(
                                    "bg-transparent relative h-12 px-0 py-2 rounded-none border-0 shadow-none",
                                    "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent",
                                    "transition-colors duration-200"
                                )}
                            >
                                <div className="flex items-center gap-2 font-medium">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.name}
                                </div>
                            </TabsTrigger>
                        ))}

                        <motion.div
                            className="bg-primary absolute bottom-0 h-[2px] z-10"
                            layoutId="underline"
                            animate={{
                                left: underlineStyle.left,
                                width: underlineStyle.width
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 40
                            }}
                        />
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-8">
                {activeTab === 'profile' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <section className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold">{(t.settings as any)?.items?.profile || "Profile"}</h3>
                                <p className="text-sm text-muted-foreground">{(t.settings as any)?.items?.profileDesc || "Manage your public profile."}</p>
                            </div>

                            <div className="divide-y divide-border/50 border-t border-border/50">
                                {/* Photo Preview */}
                                <div className="py-6 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-14 w-14 border shadow-none">
                                            <AvatarImage src={user.image || ""} />
                                            <AvatarFallback className="bg-primary/5 text-sm font-bold">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{(t.settings as any)?.items?.photo || "Photo"}</p>
                                            <p className="text-sm text-muted-foreground">{(t.settings as any)?.items?.photoDesc || "Your profile image."}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-primary font-medium"
                                        onClick={() => setIsAvatarOpen(true)}
                                    >
                                        {(t.common as any)?.edit || "Edit"}
                                    </Button>
                                </div>

                                {/* Full Name Preview */}
                                <div className="py-6 flex items-center justify-between gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] items-center gap-4 w-full">
                                        <p className="text-sm font-medium">{(t.settings as any)?.items?.fullName || "Full Name"}</p>
                                        <p className="text-sm text-foreground/80">{userName}</p>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-primary font-medium shrink-0"
                                        onClick={() => setIsNameOpen(true)}
                                    >
                                        {(t.common as any)?.edit || "Edit"}
                                    </Button>
                                </div>

                                {/* Email Preview */}
                                <div className="py-6 flex items-center justify-between gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] items-center gap-4 w-full">
                                        <p className="text-sm font-medium">{(t.settings as any)?.items?.email || "Email Address"}</p>
                                        <p className="text-sm text-foreground/80">{user.email}</p>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-primary font-medium shrink-0"
                                        onClick={() => setIsEmailOpen(true)}
                                    >
                                        {(t.common as any)?.edit || "Edit"}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}

                {activeTab === 'security' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <section className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold">{(t.settings as any)?.items?.security || "Security"}</h3>
                                <p className="text-sm text-muted-foreground">{(t.settings as any)?.items?.securityDesc || "Manage your account security."}</p>
                            </div>

                            <div className="divide-y divide-border/50 border-t border-border/50">
                                {/* Password Preview */}
                                <div className="py-6 flex items-center justify-between gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] items-center gap-4 w-full">
                                        <p className="text-sm font-medium">{(t.settings as any)?.items?.password || "Password"}</p>
                                        <p className="text-sm text-foreground/80">••••••••••••</p>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-primary font-medium shrink-0"
                                        onClick={() => setIsPasswordOpen(true)}
                                    >
                                        {(t.common as any)?.edit || "Edit"}
                                    </Button>
                                </div>

                                {/* Two-Factor Preview (Placeholder) */}
                                <div className="py-6 flex items-center justify-between gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] items-center gap-4 w-full">
                                        <p className="text-sm font-medium">{(t.settings as any)?.items?.twoFactor || "Two-factor authentication"}</p>
                                        <p className="text-sm text-muted-foreground italic">{(t.settings as any)?.items?.notEnabled || "Not enabled"}</p>
                                    </div>
                                    <Button variant="link" className="text-primary font-medium shrink-0">
                                        {(t.settings as any)?.items?.enable || "Enable"}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}

                {activeTab === 'notifications' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <section className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold">{(t.settings as any)?.items?.notifications || "Notifications"}</h3>
                                <p className="text-sm text-muted-foreground">{(t.settings as any)?.items?.notificationsDesc || "Manage your notifications."}</p>
                            </div>

                            <div className="divide-y divide-border/50 border-t border-border/50">
                                {/* Email Notifications Preview */}
                                <div className="py-6 flex items-center justify-between gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] items-center gap-4 w-full">
                                        <p className="text-sm font-medium">{(t.settings as any)?.notificationsDialog?.sectionEmail || "Email Alerts"}</p>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                                                <Check className="h-4 w-4 text-green-500" />
                                                {(t.settings as any)?.notificationsDialog?.labelCampaign || "Campaign Updates"}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                                                <Check className="h-4 w-4 text-green-500" />
                                                {(t.settings as any)?.notificationsDialog?.labelAudience || "Audience Growth"}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-primary font-medium shrink-0"
                                        onClick={() => setIsNotificationsOpen(true)}
                                    >
                                        {(t.common as any)?.edit || "Edit"}
                                    </Button>
                                </div>

                                {/* App Notifications Preview */}
                                <div className="py-6 flex items-center justify-between gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] items-center gap-4 w-full">
                                        <p className="text-sm font-medium">{(t.settings as any)?.notificationsDialog?.sectionPush || "App Notifications"}</p>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                                                <Check className="h-4 w-4 text-green-500" />
                                                {(t.settings as any)?.notificationsDialog?.labelMentions || "New Mentions"}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                                                <Check className="h-4 w-4 text-green-500" />
                                                {(t.settings as any)?.notificationsDialog?.labelSystem || "System Alerts"}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-primary font-medium shrink-0"
                                        onClick={() => setIsNotificationsOpen(true)}
                                    >
                                        {(t.common as any)?.edit || "Edit"}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}
            </div>

            {/* Dialogs */}
            <EditAvatarDialog
                open={isAvatarOpen}
                onOpenChange={setIsAvatarOpen}
                user={user}
            />
            <EditNameDialog
                open={isNameOpen}
                onOpenChange={setIsNameOpen}
                user={user}
            />
            <EditEmailDialog
                open={isEmailOpen}
                onOpenChange={setIsEmailOpen}
                user={user}
            />
            <EditPasswordDialog
                open={isPasswordOpen}
                onOpenChange={setIsPasswordOpen}
            />
            <EditNotificationsDialog
                open={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
            />
        </div>
    );
}
