"use client";

import React, { useState } from "react";
import { User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Lock, Globe, Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { SettingsSection } from "@/components/ui-kit/settings-section";
import { SettingsActionItem } from "@/components/ui-kit/settings-action-item";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import { useI18n } from "@/lib/i18n";
import {
    EditAvatarDialog,
    EditNameDialog,
    EditEmailDialog,
    EditPasswordDialog,
} from "./edit-settings-dialogs";

interface GeneralSettingsClientProps {
    user: User;
}

export function GeneralSettingsClient({ user }: GeneralSettingsClientProps) {
    const { theme, setTheme } = useTheme();
    const { locale, t } = useI18n();
    const settings = (t as any)?.settings;
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);
    const [isNameOpen, setIsNameOpen] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);

    const userName = user.name || "User";
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const isDarkMode = theme === "dark";

    const currentLanguage = locale === "fr" ? "Français" : "English";

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold">{(t.common as any)?.settings || "Settings"}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {settings?.description || "Manage your account settings and preferences."}
                </p>
            </div>

            {/* Settings Sections - max width for better readability */}
            <div className="max-w-[720px] space-y-8">
                {/* Account Section */}
                <SettingsSection label={settings?.categories?.account || "Account"}>
                    <SettingsActionItem
                        icon={
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.image || ""} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                        }
                        title={settings?.items?.avatar || "Profile Photo"}
                        subtitle={settings?.items?.avatarDesc || "Your profile image"}
                        action="change"
                        actionLabel={(t.common as any)?.change || "Change"}
                        onClick={() => setIsAvatarOpen(true)}
                    />
                    <SettingsActionItem
                        icon={<UserIcon className="h-5 w-5" />}
                        title={settings?.items?.fullName || "Full Name"}
                        subtitle={userName}
                        action="change"
                        actionLabel={(t.common as any)?.change || "Change"}
                        onClick={() => setIsNameOpen(true)}
                    />
                    <SettingsActionItem
                        icon={<Mail className="h-5 w-5" />}
                        title={settings?.items?.email || "Email Address"}
                        subtitle={user.email}
                        action="change"
                        actionLabel={(t.common as any)?.change || "Change"}
                        onClick={() => setIsEmailOpen(true)}
                    />
                    <SettingsActionItem
                        icon={<Lock className="h-5 w-5" />}
                        title={settings?.items?.password || "Password"}
                        subtitle="••••••••••••"
                        action="chevron"
                        onClick={() => setIsPasswordOpen(true)}
                    />
                </SettingsSection>

                {/* Preferences Section */}
                <SettingsSection label={settings?.categories?.preferences || "Preferences"}>
                    <SettingsActionItem
                        icon={<Globe className="h-5 w-5" />}
                        title={settings?.items?.language || "Language"}
                        subtitle={currentLanguage}
                        action="chevron"
                        onClick={() => setIsLanguageOpen(true)}
                    />
                    <SettingsActionItem
                        icon={<Moon className="h-5 w-5" />}
                        title={settings?.items?.darkMode || "Dark Mode"}
                        subtitle={settings?.items?.darkModeDesc || "Switch between light and dark theme"}
                        action="toggle"
                        toggled={isDarkMode}
                        onToggle={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                </SettingsSection>

                {/* Language Picker Dialog */}
                <LanguagePickerDialog open={isLanguageOpen} onOpenChange={setIsLanguageOpen} />

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
            </div>
        </div>
    );
}
