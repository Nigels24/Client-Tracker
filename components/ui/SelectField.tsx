import { SelectHTMLAttributes } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  helperText?: string;
  registration?: UseFormRegisterReturn;
  error?: FieldError;
  options: { value: string; label: string }[];
}

export default function SelectField({
  label,
  required = false,
  helperText,
  registration,
  error,
  disabled = false,
  options,
  id,
  ...rest
}: SelectFieldProps) {
  const inputId = id || String(registration?.name ?? rest.name);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium flex items-center gap-2 text-muted tracking-wide"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <select
        id={inputId}
        {...registration}
        {...rest}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-4 py-2.5 rounded-[9px] text-sm
        focus:outline-none focus:ring-2 transition-colors duration-200
        ${
          disabled
            ? "border border-transparent bg-card-border/40 text-muted cursor-default"
            : error
            ? "border border-red-500 focus:ring-red-400 bg-red-50 text-red-900"
            : "border border-card-border focus:ring-brand/[0.2] bg-white text-foreground"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p id={`${inputId}-error`} className="text-red-500 text-xs font-medium">
          {error.message}
        </p>
      ) : helperText ? (
        <p className="text-muted text-xs">{helperText}</p>
      ) : null}
    </div>
  );
}
