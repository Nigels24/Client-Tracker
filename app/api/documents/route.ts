import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  isBlobConfigured,
  uploadBlob,
} from "@/lib/blob";
import { documentSelect } from "@/lib/client-include";
import { respondToError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (!isBlobConfigured()) {
      return NextResponse.json(
        {
          message:
            "File storage isn't set up yet. Add a Blob store in Vercel and set BLOB_READ_WRITE_TOKEN.",
        },
        { status: 503 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const clientId = Number(form.get("clientId"));
    const label = String(form.get("label") || "Agreement").trim() || "Agreement";

    if (!Number.isInteger(clientId)) {
      return NextResponse.json(
        { message: "A valid clientId is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "Choose a file to upload." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          message: `That file is ${formatMb(file.size)} — the limit is ${formatMb(
            MAX_UPLOAD_BYTES
          )}.`,
        },
        { status: 400 }
      );
    }

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { message: `Only ${ALLOWED_EXTENSIONS} files can be uploaded.` },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.userId },
    });
    if (!client) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const uploaded = await uploadBlob(
      `agreements/${session.userId}/${clientId}/${file.name}`,
      file
    );

    const document = await prisma.clientDocument.create({
      data: {
        clientId,
        label,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        url: uploaded.url,
        pathname: uploaded.pathname,
        access: uploaded.access,
      },
      select: documentSelect,
    });

    return NextResponse.json(
      { message: "File uploaded.", data: document },
      { status: 201 }
    );
  } catch (error) {
    return respondToError(error);
  }
}

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
