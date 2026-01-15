"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Twitter, Instagram, Facebook, Linkedin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ContactPage() {
    const { t } = useI18n();
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans">
            {/* Header/Nav */}
            <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    {/* Logo placeholder */}
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">R</div>
                    <span className="text-xl font-bold">Reelsend</span>
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#" className="hover:text-slate-900">Home</a>
                    <a href="#" className="hover:text-slate-900">Services</a>
                    <a href="#" className="hover:text-slate-900">{t.contact.about}</a>
                    <a href="#" className="hover:text-slate-900">More Links</a>
                </nav>
                <div className="flex items-center gap-4">
                    <a href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        {t.auth?.login || "Login"}
                    </a>
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6">
                        {t.dashboard?.getStarted || "Get Started"}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                {/* Left Column: Contact Info */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">{t.contact.title}</h1>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">{t.contact.email}:</h3>
                                <div className="flex items-center gap-2 text-lg font-medium">
                                    <Mail className="w-5 h-5" />
                                    <span>support@reelsend.com</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">{t.contact.phone}:</h3>
                                <div className="flex items-center gap-2 text-lg font-medium">
                                    <Phone className="w-5 h-5" />
                                    <span>(123) 1221 2323</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">{t.contact.address}:</h3>
                                <div className="flex items-start gap-2 text-lg font-medium max-w-xs">
                                    <MapPin className="w-5 h-5 mt-1 shrink-0" />
                                    <span>123 Innovation Avenue, Suite 456<br />Tech District, San Francisco, CA 94107<br />United States</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <h3 className="text-sm font-medium text-slate-500 mb-4">{t.contact.followUs}</h3>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="bg-white p-8 rounded-2xl shadow-none border border-slate-100">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t.contact.yourName}</Label>
                                <Input id="name" placeholder={t.contact.placeholderName} className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t.contact.yourEmail}</Label>
                                <Input id="email" type="email" placeholder={t.contact.placeholderEmail} className="bg-slate-50 border-slate-200" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">{t.contact.message}</Label>
                            <Textarea id="message" placeholder={t.contact.placeholderMessage} className="min-h-[200px] bg-slate-50 border-slate-200 resize-none" />
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-base font-semibold">
                            {t.contact.sendMessage}
                        </Button>
                    </form>
                </div>

            </main>

            {/* Footer */}
            <footer className="bg-[#0B1120] text-slate-400 py-16 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t.contact.company}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">{t.contact.about}</a></li>
                            <li><a href="#" className="hover:text-white">{t.contact.press}</a></li>
                            <li><a href="#" className="hover:text-white">{t.contact.careers}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t.contact.support}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">{t.contact.helpCenter}</a></li>
                            <li><a href="#" className="hover:text-white">{t.contact.terms}</a></li>
                            <li><a href="#" className="hover:text-white">{t.contact.privacy}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t.contact.developers}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">{t.contact.documentation}</a></li>
                            <li><a href="#" className="hover:text-white">{t.contact.status}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t.contact.newsletter}</h4>
                        <div className="flex gap-2">
                            <Input placeholder={t.contact.placeholderSubscribe} className="bg-slate-800 border-slate-700 text-white" />
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t.contact.subscribe}</Button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex justify-between items-center text-xs">
                    <p>{t.contact.rights}</p>
                </div>
            </footer>
        </div>
    );
}
