"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, Users } from "lucide-react";
import { SelectableCard, SelectableCardHeader } from "./selectable-card";
import { useI18n } from "@/lib/i18n";

export interface Client {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
}

interface ClientSelectorDialogProps {
    clients: Client[];
    selectedClientId: string | null;
    onClientSelect: (clientId: string | null) => void;
    loading?: boolean;
    className?: string;
}

export function ClientSelectorDialog({
    clients,
    selectedClientId,
    onClientSelect,
    loading = false,
    className,
}: ClientSelectorDialogProps) {
    const { t } = useI18n();
    const [open, setOpen] = React.useState(false);

    const handleSelect = (clientId: string | null) => {
        onClientSelect(clientId);
        setOpen(false);
    };

    const selectedClient = clients.find(c => c.id === selectedClientId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    disabled={loading}
                    className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                        "h-9 whitespace-nowrap transition-[color,box-shadow] outline-none",
                        "border-input bg-transparent",
                        "hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "dark:bg-input/30 dark:hover:bg-input/50",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedClient ? (
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 overflow-hidden">
                                {selectedClient.logo ? (
                                    <img src={selectedClient.logo} alt={selectedClient.name} className="h-full w-full object-cover" />
                                ) : (
                                    selectedClient.name.charAt(0).toUpperCase()
                                )}
                            </div>
                        ) : (
                            <Users className="h-4 w-4 opacity-50 shrink-0" />
                        )}
                        <span className="font-medium truncate">
                            {loading ? "Loading..." : (selectedClient?.name || t.promptBuilder?.noClient || "No client")}
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20">
                    <DialogTitle className="text-xl">
                        {t.promptBuilder?.selectClient || "Select Client"}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Generic / No Client Option - Always on top, full width */}
                    <div className="mb-8">
                        <SelectableCard
                            isSelected={selectedClientId === null}
                            onClick={() => handleSelect(null)}
                            className="bg-muted/30"
                        >
                            <SelectableCardHeader
                                icon={<Users className="h-5 w-5" />}
                                title={t.promptBuilder?.noClientBrand || "Generic / No Client"}
                                subtitle={t.promptBuilder?.noClientDesc || "Global settings"}
                            />
                        </SelectableCard>
                    </div>

                    {/* Subtitle */}
                    {clients.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground/70">
                                {t.promptBuilder?.clientListSubtitle || "List of clients"}
                            </h4>
                        </div>
                    )}

                    {/* Client List Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {clients.map((client) => (
                            <SelectableCard
                                key={client.id}
                                isSelected={selectedClientId === client.id}
                                onClick={() => handleSelect(client.id)}
                            >
                                <SelectableCardHeader
                                    icon={
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
                                            {client.logo ? (
                                                <img src={client.logo} alt={client.name} className="h-full w-full object-cover" />
                                            ) : (
                                                client.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    }
                                    title={client.name}
                                    subtitle={client.slug}
                                />
                            </SelectableCard>
                        ))}
                    </div>

                    {clients.length === 0 && !loading && (
                        <div className="py-12 text-center text-muted-foreground italic text-sm">
                            {t.promptBuilder?.noClientsFound || "No clients found."}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
