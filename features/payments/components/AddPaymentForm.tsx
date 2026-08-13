"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import TextInput from "@/components/ui/TextInput";
import DateInput from "@/components/ui/DateInput";
import SelectField from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";
import {
  PAYMENT_METHOD_OPTIONS,
  paymentSchema,
  PaymentFormValues,
} from "@/features/payments/schema/payment.schema";
import { useCreatePayment } from "@/features/payments/hooks/use-payments";

export default function AddPaymentForm({
  clientId,
  isFirstPayment,
}: {
  clientId: number;
  isFirstPayment: boolean;
}) {
  const createPayment = useCreatePayment(clientId);

  const defaults = (): PaymentFormValues => ({
    amount: undefined as unknown as number,
    paidAt: format(new Date(), "yyyy-MM-dd"),
    label: isFirstPayment ? "Downpayment" : "",
    method: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: yupResolver(paymentSchema),
    defaultValues: defaults(),
  });

  const onSubmit = async (values: PaymentFormValues) => {
    await createPayment.mutateAsync({
      amount: values.amount,
      paidAt: values.paidAt,
      label: values.label || undefined,
      method: values.method || undefined,
    });
    reset(defaults());
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {createPayment.isError && (
        <AlertBanner variant="error">
          {(createPayment.error as Error).message}
        </AlertBanner>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <TextInput
          label="Amount (₱)"
          type="number"
          min={0}
          step={1}
          placeholder="e.g. 2500"
          registration={register("amount", { valueAsNumber: true })}
          error={errors.amount}
        />
        <DateInput
          label="Date paid"
          registration={register("paidAt")}
          error={errors.paidAt}
        />
        <TextInput
          label="For"
          placeholder="e.g. Downpayment"
          registration={register("label")}
          error={errors.label}
        />
        <SelectField
          label="Method"
          options={PAYMENT_METHOD_OPTIONS}
          registration={register("method")}
          error={errors.method}
        />
      </div>
      <div className="flex justify-end">
        <Button
          label={isSubmitting ? "Saving..." : "Record payment"}
          type="submit"
          size="sm"
          icon={<Plus size={16} />}
          loading={isSubmitting}
        />
      </div>
    </form>
  );
}
