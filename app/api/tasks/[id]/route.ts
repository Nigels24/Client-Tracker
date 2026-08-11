import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { WORK_STATUS } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const taskId = Number(id);
    if (!Number.isInteger(taskId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const existing = await prisma.task.findFirst({
      where: { id: taskId, client: { userId: session.userId } },
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      title?: string;
      notes?: string | null;
      status?: WORK_STATUS;
      dueDate?: Date | null;
    } = {};

    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (body.notes !== undefined) {
      data.notes = body.notes || null;
    }
    if (body.status !== undefined) {
      if (!(body.status in WORK_STATUS)) {
        return NextResponse.json(
          { message: "Invalid status." },
          { status: 400 }
        );
      }
      data.status = body.status as WORK_STATUS;
    }
    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    return NextResponse.json({ message: "Task updated.", data: task });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const taskId = Number(id);
    if (!Number.isInteger(taskId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const existing = await prisma.task.findFirst({
      where: { id: taskId, client: { userId: session.userId } },
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ message: "Task deleted." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
