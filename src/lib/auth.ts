import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await db.user.findUnique({
                    where: { email: credentials.email as string },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                });

                if (!user || !user.password) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role?.name || null,
                    permissions: user.role?.permissions.map(rp => rp.permission.key) || [],
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // On initial sign-in, populate the token
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.permissions = (user as any).permissions;
            }

            // On every request (session update), verify user still exists
            // This handles the case where user was deleted from DB
            if (trigger === "update" || !user) {
                // Check if user exists in database
                const existingUser = await db.user.findUnique({
                    where: { id: token.id as string },
                    select: { id: true, status: true },
                });

                // If user doesn't exist or is disabled, invalidate the session
                if (!existingUser || existingUser.status === "DISABLED") {
                    // Returning an empty object effectively invalidates the token
                    return { ...token, error: "UserNotFound" };
                }
            }

            return token;
        },
        async session({ session, token }) {
            // If token has an error (user deleted), return null session
            if ((token as any).error === "UserNotFound") {
                return { ...session, user: undefined, expires: new Date(0).toISOString() };
            }

            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions;
            }
            return session;
        },
    },
});
