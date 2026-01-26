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
                    roleId: user.roleId,
                    roleUpdatedAt: user.role?.updatedAt?.getTime() || null,
                    permissions: user.role?.permissions.map(rp => rp.permission.key) || [],
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // On initial sign-in, populate the token
            if (user) {
                const u = user as { id?: string; role?: string; roleId?: string; roleUpdatedAt?: number; permissions?: string[] };
                token.id = u.id;
                token.role = u.role;
                token.roleId = u.roleId;
                token.roleUpdatedAt = u.roleUpdatedAt;
                token.permissions = u.permissions;
            }

            // On every request (session update) or periodically, verify user state
            // This handles the case where user was deleted, disabled, or role changed
            if (token.id) {
                // Check if user exists in database and get current role
                const dbUser = await db.user.findUnique({
                    where: { id: token.id as string },
                    select: { 
                        id: true, 
                        status: true, 
                        roleId: true,
                        role: { select: { updatedAt: true } }
                    },
                });

                // 1. If user doesn't exist or is disabled, invalidate immediately
                if (!dbUser || dbUser.status === "DISABLED") {
                    return { ...token, error: "UserNotFound" };
                }

                // 2. Detect Role or Permission Change
                const currentRoleUpdatedAt = dbUser.role?.updatedAt?.getTime() || null;
                
                if (!token.roleId) {
                    token.roleId = dbUser.roleId;
                    token.roleUpdatedAt = currentRoleUpdatedAt;
                } else if (dbUser.roleId !== token.roleId || (token.roleUpdatedAt && currentRoleUpdatedAt && currentRoleUpdatedAt > (token.roleUpdatedAt as number))) {
                    token.requiresLogout = true;
                }
            }

            return token;
        },
        async session({ session, token }) {
            // If token has an error (user deleted), return null session
            if (token.error === "UserNotFound") {
                return { ...session, user: undefined, expires: new Date(0).toISOString() };
            }

            if (token && session.user) {
                const sessUser = session.user as { 
                    id: string; 
                    role?: string; 
                    roleId?: string; 
                    permissions?: string[]; 
                    requiresLogout?: boolean 
                };
                sessUser.id = token.id as string;
                sessUser.role = token.role as string;
                sessUser.roleId = token.roleId as string;
                sessUser.permissions = token.permissions as string[];
                sessUser.requiresLogout = token.requiresLogout as boolean;
            }
            return session;
        },
    },
});
