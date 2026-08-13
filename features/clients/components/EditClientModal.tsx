"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { format } from "date-fns";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";
import ClientFormFields from "@/features/clients/components/ClientFormFields";
import {
  clientSchema,
  toMemberInputs,
  ClientFormValues,
} from "@/features/clients/schema/client.schema";
import { useUpdateClient } from "@/features/clients/hooks/use-clients";
import type { Client } from "@/features/clients/types";

const toDateInput = (value: string | null) =>
  value ? format(new Date(value), "yyyy-MM-dd") : "";

function toFormValues(client: Client): ClientFormValues {
  return {
    title: client.title,
    // Always leave one row so there's somewhere to type.
    members:
      client.members.length > 0
        ? client.members.map((member) => ({
            name: member.name,
            contact: member.contact ?? "",
          }))
        : [{ name: "", contact: "" }],
    school: client.school ?? "",
    course: client.course ?? "",
    projectType: client.projectType,
    systemPrice: client.systemPrice ?? undefined,
    docuPrice: client.docuPrice ?? undefined,
    partnerName: client.partnerName ?? "",
    partnerSharePercent: client.partnerSharePercent,
    systemDueDate: toDateInput(client.systemDueDate),
    docuDueDate: toDateInput(client.docuDueDate),
    notes: client.notes ?? "",
  };
}

export default function EditClientModal({
  client,
  open,
  onClose,
}: {
  client: Client;
  open: boolean;
  onClose: () => void;
}) {
  const updateClient = useUpdateClient(client.id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: yupResolver(clientSchema),
    defaultValues: toFormValues(client),
  });

  useEffect(() => {
    if (open) {
      reset(toFormValues(client));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client.id]);

  const handleClose = () => {
    updateClient.reset();
    onClose();
  };

  const onSubmit = async (values: ClientFormValues) => {
    await updateClient.mutateAsync({
      title: values.title,
      members: toMemberInputs(values.members),
      school: values.school || null,
      course: values.course || null,
      notes: values.notes || null,
      projectType: values.projectType,
      systemPrice: values.systemPrice ?? null,
      docuPrice: values.docuPrice ?? null,
      partnerName: values.partnerName || null,
      partnerSharePercent: values.partnerSharePercent,
      systemDueDate: values.systemDueDate || null,
      docuDueDate: values.docuDueDate || null,
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Edit client" size="lg">
      {updateClient.isError && (
        <div className="mb-4">
          <AlertBanner variant="error">
            {(updateClient.error as Error).message}
          </AlertBanner>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ClientFormFields
          register={register}
          errors={errors}
          watch={watch}
          control={control}
          setValue={setValue}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancel" variant="outline" onClick={handleClose} type="button" />
          <Button
            label={isSubmitting ? "Saving..." : "Save changes"}
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}
