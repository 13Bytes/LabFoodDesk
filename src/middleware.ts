import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest, event: NextFetchEvent) {
    // Check if the user is authenticated
    const token = await getToken({ req });
    const isAuthenticated = !!token;
    if (isAuthenticated) {
        return NextResponse.next(); // Continue to the next Middleware or route handler
    }
    else {
        return NextResponse.redirect(new URL('/', req.url))
    }
}

export const config = {
    matcher: '/((?!api|_next|public|favicon.ico|robots.txt|images|auth|$).*)',
}