"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { PROJECT_TYPE } from "@prisma/client";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";
import ClientFormFields from "@/features/clients/components/ClientFormFields";
import {
  clientSchema,
  toMemberInputs,
  ClientFormValues,
} from "@/features/clients/schema/client.schema";
import { useCreateClient } from "@/features/clients/hooks/use-clients";

const EMPTY_CLIENT: ClientFormValues = {
  title: "",
  // One blank row so the form invites a name without needing a click first.
  members: [{ name: "", contact: "" }],
  school: "",
  course: "",
  projectType: PROJECT_TYPE.SYSTEM,
  systemPrice: undefined,
  docuPrice: undefined,
  systemDueDate: "",
  docuDueDate: "",
  notes: "",
};

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
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: yupResolver(clientSchema),
    defaultValues: EMPTY_CLIENT,
  });

  const handleClose = () => {
    reset(EMPTY_CLIENT);
    createClient.reset();
    onClose();
  };

  const onSubmit = async (values: ClientFormValues) => {
    await createClient.mutateAsync({
      title: values.title,
      members: toMemberInputs(values.members),
      school: values.school || undefined,
      course: values.course || undefined,
      notes: values.notes || undefined,
      projectType: values.projectType,
      systemPrice: values.systemPrice,
      docuPrice: values.docuPrice,
      systemDueDate: values.systemDueDate || undefined,
      docuDueDate: values.docuDueDate || undefined,
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add client" size="lg">
      {createClient.isError && (
        <div className="mb-4">
          <AlertBanner variant="error">
            {(createClient.error as Error).message}
          </AlertBanner>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ClientFormFields
          register={register}
          errors={errors}
          watch={watch}
          control={control}
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
