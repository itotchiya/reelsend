"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SetupFormProps {
    token: string;
    email: string;
}

export default function SetupForm({ token, email }: SetupFormProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!firstName.trim() || !lastName.trim()) {
            setError("Please enter your full name");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        try {
            const res = await fetch("/api/auth/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, name: fullName, password }),
            });

            if (!res.ok) {
                const message = await res.text();
                throw new Error(message || "Failed to set up account");
            }

            router.push("/login?setup=success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">
                    {t.auth.email}
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    autoComplete="email"
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-zinc-700 dark:text-zinc-300">
                        {t.setup.firstName}
                    </Label>
                    <Input
                        id="firstName"
                        name="given-name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoComplete="given-name"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-zinc-700 dark:text-zinc-300">
                        {t.setup.lastName}
                    </Label>
                    <Input
                        id="lastName"
                        name="family-name"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        autoComplete="family-name"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">
                    {t.auth.password}
                </Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300">
                    {t.setup.confirmPassword}
                </Label>
                <Input
                    id="confirmPassword"
                    name="new-password-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                />
            </div>

            {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={loading}
                className="w-full"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.setup.settingUp}
                    </>
                ) : (
                    t.setup.completeSetup
                )}
            </Button>

            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                {t.setup.termsAgreement}
            </p>
        </form>
    );
}
