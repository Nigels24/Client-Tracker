import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  optionalText,
  requiredDate,
  requiredPeso,
  respondToError,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const paymentId = Number(id);
    if (!Number.isInteger(paymentId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, client: { userId: session.userId } },
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      amount?: number;
      paidAt?: Date;
      label?: string | null;
      method?: string | null;
    } = {};

    if (body.amount !== undefined) {
      data.amount = requiredPeso(body.amount, "Amount");
    }
    if (body.paidAt !== undefined) {
      data.paidAt = requiredDate(body.paidAt, "Payment date");
    }
    if (body.label !== undefined) {
      data.label = optionalText(body.label, "Label");
    }
    if (body.method !== undefined) {
      data.method = optionalText(body.method, "Method");
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data,
    });

    return NextResponse.json({ message: "Payment updated.", data: payment });
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
    const paymentId = Number(id);
    if (!Number.isInteger(paymentId)) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, client: { userId: session.userId } },
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    await prisma.payment.delete({ where: { id: paymentId } });

    return NextResponse.json({ message: "Payment deleted." });
  } catch (error) {
    return respondToError(error);
  }
}
