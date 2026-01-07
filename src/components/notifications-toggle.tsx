"use client";

import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    isRead: boolean;
}

const placeholderNotifications: NotificationItem[] = [
    {
        id: "1",
        title: "New message",
        description: "You have a new message from Jese Leos",
        time: "a few moments ago",
        isRead: false,
    },
    {
        id: "2",
        title: "New follower",
        description: "Joseph Mcfall started following you",
        time: "10 minutes ago",
        isRead: false,
    },
    {
        id: "3",
        title: "Campaign completed",
        description: "Your email campaign has finished sending",
        time: "1 hour ago",
        isRead: true,
    },
];

export function NotificationsToggle() {
    const unreadCount = placeholderNotifications.filter(n => !n.isRead).length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-9 w-9 relative cursor-pointer">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {placeholderNotifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{notification.title}</span>
                            {!notification.isRead && (
                                <span className="w-2 h-2 bg-primary rounded-full" />
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">{notification.description}</span>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="justify-center">
                    <Link href="/dashboard/notifications" className="w-full text-center text-sm font-medium">
                        View all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
