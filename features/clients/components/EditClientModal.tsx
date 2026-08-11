"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { format } from "date-fns";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";
import { clientSchema, ClientFormValues } from "@/features/clients/schema/client.schema";
import { useUpdateClient } from "@/features/clients/hooks/use-clients";
import type { Client } from "@/features/clients/types";

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
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: yupResolver(clientSchema),
    defaultValues: {
      name: client.name,
      notes: client.notes ?? "",
      dueDate: client.dueDate ? format(new Date(client.dueDate), "yyyy-MM-dd") : "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: client.name,
        notes: client.notes ?? "",
        dueDate: client.dueDate ? format(new Date(client.dueDate), "yyyy-MM-dd") : "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client.id]);

  const handleClose = () => {
    updateClient.reset();
    onClose();
  };

  const onSubmit = async (values: ClientFormValues) => {
    await updateClient.mutateAsync({
      name: values.name,
      notes: values.notes || null,
      dueDate: values.dueDate || null,
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Edit client">
      {updateClient.isError && (
        <div className="mb-4">
          <AlertBanner variant="error">
            {(updateClient.error as Error).message}
          </AlertBanner>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Client name"
          required
          registration={register("name")}
          error={errors.name}
        />
        <TextArea label="Notes" registration={register("notes")} error={errors.notes} />
        <DateInput label="Due date" registration={register("dueDate")} error={errors.dueDate} />
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
