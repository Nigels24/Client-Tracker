import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && (
        <div className="mb-3 p-3 rounded-full bg-card-border/40 text-muted">
          <Icon size={24} />
        </div>
      )}
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
