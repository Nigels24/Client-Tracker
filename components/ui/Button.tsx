"use client";

import React from "react";

const sizeStyles = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 font-bold",
} as const;

const variantStyles = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  ghost: "bg-card-border/40 text-foreground hover:bg-card-border/70",
  outline:
    "border border-card-border bg-white text-foreground hover:bg-background",
  danger: "bg-[#c4452e] text-white hover:bg-[#c4452e]/90",
  danger_outline: "text-[#c4452e] bg-[#fbe7e2] hover:bg-[#fbe7e2]/70",
} as const;

const spinnerSizes = {
  sm: "h-3 w-3 border-2",
  md: "h-4 w-4 border-2",
  lg: "h-7 w-7 border-[3px]",
} as const;

type BaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  textClassName?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

type ButtonVariants =
  | {
      variant?: "primary" | "ghost" | "outline" | "danger" | "danger_outline";
      className?: string;
    }
  | { variant: "custom"; className?: string };

export type ButtonProps = BaseProps & ButtonVariants;

export default function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  textClassName = "",
  icon,
  iconPosition = "left",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`
        relative inline-flex items-center justify-center font-semibold rounded-[10px]
        transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer
        ${sizeStyles[size]}
        ${variant !== "custom" ? variantStyles[variant] : ""}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading && (
        <span className="absolute flex items-center justify-center">
          <span
            className={`animate-spin rounded-full border-current border-t-transparent ${spinnerSizes[size]}`}
          />
        </span>
      )}

      <span
        className={`inline-flex items-center gap-1.5 ${
          loading ? "opacity-0" : "opacity-100"
        } ${textClassName}`}
      >
        {icon && iconPosition === "left" && icon}
        {label}
        {icon && iconPosition === "right" && icon}
      </span>
    </button>
  );
}
