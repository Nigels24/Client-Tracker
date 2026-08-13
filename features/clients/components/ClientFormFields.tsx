"use client";

import { useEffect } from "react";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { useFieldArray, type Control } from "react-hook-form";
import { Plus, X } from "lucide-react";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import DateInput from "@/components/ui/DateInput";
import SelectField from "@/components/ui/SelectField";
import { PROJECT_TYPE_OPTIONS, hasDocu, hasSystem } from "@/lib/project-type";
import { formatPeso } from "@/lib/money";
import type { ClientFormValues } from "@/features/clients/schema/client.schema";

/** Pre-filled the moment a partner is named, since this is the usual deal. */
const DEFAULT_PARTNER_PERCENT = 25;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

const TWO_COLUMN = "grid grid-cols-1 gap-4 sm:grid-cols-2";

/**
 * Shared by the add and edit modals so the two forms can't drift apart.
 * Price and deadline fields follow the selected project type — a Docu-only job
 * never shows a system price, and lib/money.ts ignores it to match.
 */
export default function ClientFormFields({
  register,
  errors,
  watch,
  control,
  setValue,
}: {
  register: UseFormRegister<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
  watch: UseFormWatch<ClientFormValues>;
  control: Control<ClientFormValues>;
  setValue: UseFormSetValue<ClientFormValues>;
}) {
  const projectType = watch("projectType");
  const partnerName = watch("partnerName");
  const partnerPercent = Number(watch("partnerSharePercent")) || 0;
  const systemPrice = Number(watch("systemPrice")) || 0;

  const { fields, append, remove } = useFieldArray({ control, name: "members" });

  // Naming a partner without a share would silently mean "they get nothing".
  useEffect(() => {
    if (partnerName?.trim() && partnerPercent === 0) {
      setValue("partnerSharePercent", DEFAULT_PARTNER_PERCENT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerName]);

  const hasPartner = Boolean(partnerName?.trim()) && partnerPercent > 0;
  const partnerCut = hasPartner ? Math.round((systemPrice * partnerPercent) / 100) : 0;

  return (
    <div className="space-y-6">
      <Section title="Project">
        <TextInput
          label="Project title"
          required
          placeholder="e.g. OJT Monitoring System for BTVTED"
          registration={register("title")}
          error={errors.title}
        />
        <div className={TWO_COLUMN}>
          <SelectField
            label="What you're building"
            options={PROJECT_TYPE_OPTIONS}
            registration={register("projectType")}
            error={errors.projectType}
          />
          <TextInput
            label="School"
            placeholder="e.g. J.H. Cerilles State College"
            registration={register("school")}
            error={errors.school}
          />
        </div>
        <TextInput
          label="Course"
          placeholder="e.g. BSIT"
          registration={register("course")}
          error={errors.course}
        />
      </Section>

      <Section title="Members">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput
                  placeholder={index === 0 ? "Name (main contact)" : "Name"}
                  registration={register(`members.${index}.name`)}
                  error={errors.members?.[index]?.name}
                />
                <TextInput
                  placeholder="Phone, FB or email (optional)"
                  registration={register(`members.${index}.contact`)}
                  error={errors.members?.[index]?.contact}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove member ${index + 1}`}
                disabled={fields.length === 1}
                className="mt-2.5 rounded-full p-1.5 text-muted hover:bg-background disabled:cursor-default disabled:opacity-30 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => append({ name: "", contact: "" })}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline cursor-pointer"
        >
          <Plus size={14} />
          Add member
        </button>
      </Section>

      <Section title="Price & deadlines">
        {hasSystem(projectType) && (
          <div className={TWO_COLUMN}>
            <TextInput
              label="System price (₱)"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 20000"
              registration={register("systemPrice", { valueAsNumber: true })}
              error={errors.systemPrice}
            />
            <DateInput
              label="System deadline"
              registration={register("systemDueDate")}
              error={errors.systemDueDate}
            />
          </div>
        )}
        {hasDocu(projectType) && (
          <div className={TWO_COLUMN}>
            <TextInput
              label="Docu price (₱)"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 5000"
              registration={register("docuPrice", { valueAsNumber: true })}
              error={errors.docuPrice}
            />
            <DateInput
              label="Docu deadline"
              registration={register("docuDueDate")}
              error={errors.docuDueDate}
            />
          </div>
        )}
      </Section>

      {hasSystem(projectType) && (
        <Section title="Partner share">
          <div className={TWO_COLUMN}>
            <TextInput
              label="Referred by"
              placeholder="Leave empty if nobody referred them"
              registration={register("partnerName")}
              error={errors.partnerName}
            />
            <TextInput
              label="Their share (%)"
              type="number"
              min={0}
              max={100}
              step={1}
              helperText="Of the system price only — docu is always fully yours."
              registration={register("partnerSharePercent", { valueAsNumber: true })}
              error={errors.partnerSharePercent}
            />
          </div>
          {hasPartner && systemPrice > 0 && (
            <div className="rounded-xl border border-card-border bg-background p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">
                  {partnerName?.trim()} gets {partnerPercent}% of the system price
                </span>
                <span className="font-medium text-foreground">
                  {formatPeso(partnerCut)}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted">You keep</span>
                <span className="font-semibold text-pay-paid-text">
                  {formatPeso(systemPrice - partnerCut)}
                </span>
              </div>
            </div>
          )}
        </Section>
      )}

      <Section title="Notes">
        <TextArea
          placeholder="Requirements, scope, chapter breakdown, links…"
          rows={4}
          registration={register("notes")}
          error={errors.notes}
        />
      </Section>
    </div>
  );
}
