import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { WORK_STATUS } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get("status");
    const validStatus =
      status && status in WORK_STATUS ? (status as WORK_STATUS) : undefined;

    const clients = await prisma.client.findMany({
      where: {
        userId: session.userId,
        ...(validStatus ? { status: validStatus } : {}),
      },
      include: { tasks: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ message: "OK", data: clients });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { name, notes, dueDate } = await request.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "Client name is required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { tasks: true },
    });

    return NextResponse.json(
      { message: "Client created.", data: client },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
