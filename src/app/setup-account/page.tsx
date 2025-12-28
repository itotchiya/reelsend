import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SetupForm from "./setup-form";

interface SetupAccountPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function SetupAccountPage({ searchParams }: SetupAccountPageProps) {
    const { token } = await searchParams;

    if (!token) {
        redirect("/login");
    }

    // Verify the token exists and is valid
    const user = await db.user.findUnique({
        where: { inviteToken: token },
        include: { role: true },
    });

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                            Invalid Invitation
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            This invitation link is invalid or has already been used.
                        </p>
                        <a
                            href="/login"
                            className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Go to Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Check if token has expired
    if (user.inviteExpires && new Date() > user.inviteExpires) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                            Invitation Expired
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            This invitation link has expired. Please contact your administrator for a new invitation.
                        </p>
                        <a
                            href="/login"
                            className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Go to Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-xl">R</span>
                        </div>
                        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                            Welcome to Reelsend
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            You&apos;ve been invited as{" "}
                            <span className="font-medium text-zinc-900 dark:text-white">
                                {user.role?.name || "Member"}
                            </span>
                        </p>
                    </div>

                    <SetupForm token={token} email={user.email} />
                </div>
            </div>
        </div>
    );
}
