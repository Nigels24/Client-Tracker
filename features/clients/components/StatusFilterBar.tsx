import { STATUS_OPTIONS } from "@/lib/status";

export default function StatusFilterBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (status: string) => void;
}) {
  const options = [{ value: "", label: "All" }, ...STATUS_OPTIONS];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              active
                ? "bg-brand text-white"
                : "bg-card-bg text-muted border border-card-border hover:bg-background"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
