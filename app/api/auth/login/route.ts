import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const invalidCredentials = NextResponse.json(
      { message: "Invalid email or password." },
      { status: 401 }
    );

    if (!user) return invalidCredentials;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return invalidCredentials;

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "Logged in.",
      data: { id: user.id, email: user.email, name: user.name },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
