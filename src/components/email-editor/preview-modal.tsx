"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, Code } from "lucide-react";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    html: string;
}

export function PreviewModal({ isOpen, onClose, html }: PreviewModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex justify-between items-center mr-8">
                        Preview Email
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="desktop" className="flex-1 flex flex-col">
                    <div className="border-b px-4 py-2 flex justify-center">
                        <TabsList>
                            <TabsTrigger value="desktop" className="gap-2">
                                <Monitor className="w-4 h-4" />
                                Desktop
                            </TabsTrigger>
                            <TabsTrigger value="mobile" className="gap-2">
                                <Smartphone className="w-4 h-4" />
                                Mobile
                            </TabsTrigger>
                            <TabsTrigger value="code" className="gap-2">
                                <Code className="w-4 h-4" />
                                HTML Output
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="desktop" className="flex-1 m-0 bg-muted/50 p-4 overflow-auto">
                        <div className="bg-white shadow-lg mx-auto w-full min-h-full">
                            <iframe
                                srcDoc={html}
                                className="w-full h-full min-h-[700px] border-none"
                                title="Desktop Preview"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="mobile" className="flex-1 m-0 bg-muted/50 p-4 overflow-auto">
                        <div className="bg-white shadow-lg mx-auto w-[375px] h-full min-h-[667px] border-[12px] border-slate-800 rounded-[40px] overflow-hidden">
                            <iframe
                                srcDoc={html}
                                className="w-full h-full border-none"
                                title="Mobile Preview"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="code" className="flex-1 m-0 p-4 overflow-auto bg-slate-950">
                        <pre className="text-slate-300 text-xs font-mono">
                            {html}
                        </pre>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
