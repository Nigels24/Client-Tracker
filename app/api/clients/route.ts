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
} from "@/lib/validation";
import { PROJECT_TYPE, WORK_STATUS } from "@prisma/client";

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
      include: clientInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ message: "OK", data: clients });
  } catch (error) {
    return respondToError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const partnerName = optionalText(body.partnerName, "Partner name");
    const members = body.members === undefined ? [] : parseMembers(body.members);

    const client = await prisma.client.create({
      data: {
        userId: session.userId,
        title: requiredText(body.title, "Project title"),
        school: optionalText(body.school, "School"),
        course: optionalText(body.course, "Course"),
        notes: optionalText(body.notes, "Notes"),
        projectType:
          body.projectType === undefined
            ? PROJECT_TYPE.SYSTEM
            : enumValue(body.projectType, PROJECT_TYPE, "project type"),
        systemPrice: optionalPeso(body.systemPrice, "System price"),
        docuPrice: optionalPeso(body.docuPrice, "Docu price"),
        partnerName,
        // A percentage without a partner would be a share owed to nobody.
        partnerSharePercent: partnerName
          ? optionalPercent(body.partnerSharePercent, "Partner share")
          : 0,
        systemDueDate: optionalDate(body.systemDueDate, "System deadline"),
        docuDueDate: optionalDate(body.docuDueDate, "Docu deadline"),
        members: { create: members },
      },
      include: clientInclude,
    });

    return NextResponse.json(
      { message: "Client created.", data: client },
      { status: 201 }
    );
  } catch (error) {
    return respondToError(error);
  }
}
