import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { readBlob } from "@/lib/blob";
import { respondToError } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * The only way an agreement reaches the browser. The raw blob URL is never put
 * in the page, so opening a file always goes through this session check first.
 */
export async function GET(_request: NextRequest, ctx: RouteContext) {
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

    const document = await prisma.clientDocument.findFirst({
      where: { id: documentId, client: { userId: session.userId } },
    });
    if (!document) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    // Public blobs are already reachable by URL, so a redirect costs nothing
    // extra; private ones have to be streamed back through this route.
    if (document.access === "public") {
      return NextResponse.redirect(document.url);
    }

    const blob = await readBlob(document.pathname, "private");
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ message: "File is no longer available." }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return respondToError(error);
  }
}
