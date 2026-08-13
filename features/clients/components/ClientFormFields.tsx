"use client";

import type { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import DateInput from "@/components/ui/DateInput";
import SelectField from "@/components/ui/SelectField";
import { PROJECT_TYPE_OPTIONS, hasDocu, hasSystem } from "@/lib/project-type";
import type { ClientFormValues } from "@/features/clients/schema/client.schema";

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
}: {
  register: UseFormRegister<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
  watch: UseFormWatch<ClientFormValues>;
}) {
  const projectType = watch("projectType");

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
          <TextInput
            label="Client name"
            placeholder="e.g. Juan Dela Cruz"
            helperText="The student you're working with"
            registration={register("name")}
            error={errors.name}
          />
          <SelectField
            label="What you're building"
            options={PROJECT_TYPE_OPTIONS}
            registration={register("projectType")}
            error={errors.projectType}
          />
        </div>
        <div className={TWO_COLUMN}>
          <TextInput
            label="School"
            placeholder="e.g. J.H. Cerilles State College"
            registration={register("school")}
            error={errors.school}
          />
          <TextInput
            label="Course"
            placeholder="e.g. BSIT"
            registration={register("course")}
            error={errors.course}
          />
        </div>
      </Section>

      <Section title="Price & deadlines">
        {hasSystem(projectType) && (
          <div className={TWO_COLUMN}>
            <TextInput
              label="System price (₱)"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 8000"
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
