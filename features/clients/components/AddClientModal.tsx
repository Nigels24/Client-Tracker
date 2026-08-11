"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";
import { clientSchema, ClientFormValues } from "@/features/clients/schema/client.schema";
import { useCreateClient } from "@/features/clients/hooks/use-clients";

export default function AddClientModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: yupResolver(clientSchema),
    defaultValues: { name: "", notes: "", dueDate: "" },
  });

  const handleClose = () => {
    reset();
    createClient.reset();
    onClose();
  };

  const onSubmit = async (values: ClientFormValues) => {
    await createClient.mutateAsync({
      name: values.name,
      notes: values.notes || undefined,
      dueDate: values.dueDate || undefined,
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add client">
      {createClient.isError && (
        <div className="mb-4">
          <AlertBanner variant="error">
            {(createClient.error as Error).message}
          </AlertBanner>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Client name"
          required
          placeholder="e.g. Acme Corp"
          registration={register("name")}
          error={errors.name}
        />
        <TextArea
          label="Notes"
          placeholder="Requirements, scope, links…"
          registration={register("notes")}
          error={errors.notes}
        />
        <DateInput
          label="Due date"
          registration={register("dueDate")}
          error={errors.dueDate}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancel" variant="outline" onClick={handleClose} type="button" />
          <Button
            label={isSubmitting ? "Adding..." : "Add client"}
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}
