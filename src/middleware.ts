import { auth } from "@/lib/auth";

export default auth;

export const config = {
    // Matcher excluding public files and setup-account
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|setup-account).*)"],
};
