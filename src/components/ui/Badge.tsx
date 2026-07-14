//src/components/ui/Badge.tsx
import React from "react";

type BadgeVariant = "success" | "danger" | "warning" | "primary" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  primary: "bg-primary/10 text-primary border-primary/20",
  neutral: "bg-white/5 text-secondary border-white/10",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${
        variantStyles[variant]
      } ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${className}`}
    >
      {children}
    </span>
  );
}