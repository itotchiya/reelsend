import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session;

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/register", "/api/auth"];
    const isPublicRoute = publicRoutes.some(route =>
        nextUrl.pathname.startsWith(route)
    );

    // Portal routes (for external clients)
    const isPortalRoute = nextUrl.pathname.startsWith("/portal");

    // If user is not logged in and trying to access protected route
    if (!isLoggedIn && !isPublicRoute && !isPortalRoute) {
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If user is logged in and trying to access login page, redirect to dashboard
    if (isLoggedIn && nextUrl.pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match all routes except static files and api routes (except auth)
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
