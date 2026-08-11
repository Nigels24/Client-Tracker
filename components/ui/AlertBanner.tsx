const variantStyles = {
  error: "bg-red-50 text-red-700 border border-red-200",
  success: "bg-status-done-bg text-status-done-text border border-status-done-text/20",
  info: "bg-status-in-progress-bg text-status-in-progress-text border border-status-in-progress-text/20",
} as const;

interface AlertBannerProps {
  variant?: keyof typeof variantStyles;
  children: React.ReactNode;
}

export default function AlertBanner({
  variant = "info",
  children,
}: AlertBannerProps) {
  return (
    <div
      role="alert"
      className={`rounded-[9px] px-4 py-2.5 text-sm ${variantStyles[variant]}`}
    >
      {children}
    </div>
  );
}
