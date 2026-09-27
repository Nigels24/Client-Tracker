import { NextRequest, NextResponse } from "next/server";
import { PAYMENT_FOR } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { paymentPartFor } from "@/lib/money";
import {
  optionalEnumValue,
  optionalText,
  requiredDate,
  requiredPeso,
  respondToError,
} from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { clientId, amount, paidAt, label, method, appliesTo } = await request.json();

    const parsedClientId = Number(clientId);
    if (!Number.isInteger(parsedClientId)) {
      return NextResponse.json(
        { message: "A valid clientId is required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: { id: parsedClientId, userId: session.userId },
    });
    if (!client) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        clientId: parsedClientId,
        amount: requiredPeso(amount, "Amount"),
        paidAt: requiredDate(paidAt, "Payment date"),
        label: optionalText(label, "Label"),
        method: optionalText(method, "Method"),
        appliesTo: paymentPartFor(
          client.projectType,
          optionalEnumValue(appliesTo, PAYMENT_FOR, "Applies to")
        ),
      },
    });

    return NextResponse.json(
      { message: "Payment recorded.", data: payment },
      { status: 201 }
    );
  } catch (error) {
    return respondToError(error);
  }
}
