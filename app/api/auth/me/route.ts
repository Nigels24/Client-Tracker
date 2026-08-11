import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Not authenticated.", data: null }, { status: 401 });
    }
    return NextResponse.json({
      message: "OK",
      data: { id: session.userId, email: session.email, name: session.name },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
