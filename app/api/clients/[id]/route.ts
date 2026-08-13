import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { clientInclude } from "@/lib/client-include";
import {
  enumValue,
  optionalDate,
  optionalPercent,
  optionalPeso,
  optionalText,
  parseMembers,
  requiredText,
  respondToError,
  type ParsedMember,
} from "@/lib/validation";
import { PROJECT_TYPE, WORK_STATUS } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const clientId = Number(id);
    if (!Number.isInteger(clientId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.userId },
      include: clientInclude,
    });

    if (!client) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "OK", data: client });
  } catch (error) {
    return respondToError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const clientId = Number(id);
    if (!Number.isInteger(clientId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const existing = await prisma.client.findFirst({
      where: { id: clientId, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      title?: string;
      school?: string | null;
      course?: string | null;
      notes?: string | null;
      projectType?: PROJECT_TYPE;
      status?: WORK_STATUS;
      systemPrice?: number | null;
      docuPrice?: number | null;
      partnerName?: string | null;
      partnerSharePercent?: number;
      systemDueDate?: Date | null;
      docuDueDate?: Date | null;
    } = {};

    if (body.title !== undefined) {
      data.title = requiredText(body.title, "Project title");
    }
    if (body.school !== undefined) {
      data.school = optionalText(body.school, "School");
    }
    if (body.course !== undefined) {
      data.course = optionalText(body.course, "Course");
    }
    if (body.notes !== undefined) {
      data.notes = optionalText(body.notes, "Notes");
    }
    if (body.projectType !== undefined) {
      data.projectType = enumValue(body.projectType, PROJECT_TYPE, "project type");
    }
    if (body.status !== undefined) {
      data.status = enumValue(body.status, WORK_STATUS, "status");
    }
    if (body.systemPrice !== undefined) {
      data.systemPrice = optionalPeso(body.systemPrice, "System price");
    }
    if (body.docuPrice !== undefined) {
      data.docuPrice = optionalPeso(body.docuPrice, "Docu price");
    }
    if (body.systemDueDate !== undefined) {
      data.systemDueDate = optionalDate(body.systemDueDate, "System deadline");
    }
    if (body.docuDueDate !== undefined) {
      data.docuDueDate = optionalDate(body.docuDueDate, "Docu deadline");
    }
    if (body.partnerName !== undefined) {
      data.partnerName = optionalText(body.partnerName, "Partner name");
    }
    if (body.partnerSharePercent !== undefined) {
      data.partnerSharePercent = optionalPercent(
        body.partnerSharePercent,
        "Partner share"
      );
    }

    // A share owed to nobody is meaningless — clearing the partner clears it.
    const partnerAfterUpdate =
      data.partnerName !== undefined ? data.partnerName : existing.partnerName;
    if (!partnerAfterUpdate) {
      data.partnerSharePercent = 0;
    }

    let members: ParsedMember[] | undefined;
    if (body.members !== undefined) {
      members = parseMembers(body.members);
    }

    // The member list is replaced wholesale rather than diffed; the update and
    // the replacement share a transaction so a failure can't leave a client
    // with no members at all.
    const client = await prisma.$transaction(async (tx) => {
      if (members) {
        await tx.clientMember.deleteMany({ where: { clientId } });
        if (members.length > 0) {
          await tx.clientMember.createMany({
            data: members.map((member) => ({ ...member, clientId })),
          });
        }
      }
      return tx.client.update({
        where: { id: clientId },
        data,
        include: clientInclude,
      });
    });

    return NextResponse.json({ message: "Client updated.", data: client });
  } catch (error) {
    return respondToError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const clientId = Number(id);
    if (!Number.isInteger(clientId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const existing = await prisma.client.findFirst({
      where: { id: clientId, userId: session.userId },
      include: { documents: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    // Rows cascade, but the underlying blobs don't — clean them up first so a
    // deleted client doesn't leave orphaned files in the store.
    if (existing.documents.length > 0) {
      const { deleteBlob } = await import("@/lib/blob");
      await Promise.all(existing.documents.map((doc) => deleteBlob(doc.pathname)));
    }

    await prisma.client.delete({ where: { id: clientId } });

    return NextResponse.json({ message: "Client deleted." });
  } catch (error) {
    return respondToError(error);
  }
}
