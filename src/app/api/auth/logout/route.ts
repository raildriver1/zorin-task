
import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const cookie = serialize('employee_auth_sim', '', {
        path: '/',
        // httpOnly: true, // This was the problem. Removing it.
        expires: new Date(0), // Expire the cookie immediately
    });

    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.headers.set('Set-Cookie', cookie);
    return response;
}
