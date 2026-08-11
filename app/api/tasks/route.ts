import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { clientId, title, notes, dueDate } = await request.json();

    const parsedClientId = Number(clientId);
    if (!Number.isInteger(parsedClientId)) {
      return NextResponse.json(
        { message: "A valid clientId is required." },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { message: "Task title is required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: { id: parsedClientId, userId: session.userId },
    });
    if (!client) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const lastTask = await prisma.task.findFirst({
      where: { clientId: parsedClientId },
      orderBy: { position: "desc" },
    });

    const task = await prisma.task.create({
      data: {
        clientId: parsedClientId,
        title: title.trim(),
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        position: (lastTask?.position ?? -1) + 1,
      },
    });

    return NextResponse.json(
      { message: "Task created.", data: task },
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
