import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { deleteBlob } from "@/lib/blob";
import { respondToError } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const documentId = Number(id);
    if (!Number.isInteger(documentId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const existing = await prisma.clientDocument.findFirst({
      where: { id: documentId, client: { userId: session.userId } },
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    await deleteBlob(existing.pathname);
    await prisma.clientDocument.delete({ where: { id: documentId } });

    return NextResponse.json({ message: "File deleted." });
  } catch (error) {
    return respondToError(error);
  }
}
