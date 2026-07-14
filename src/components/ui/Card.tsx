//src/components/ui/Card.tsx
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradientBorder?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = false,
  gradientBorder = false,
}: CardProps) {
  return (
    <div
      className={`relative bg-surface rounded-xl border ${
        gradientBorder
          ? "border-transparent bg-clip-padding"
          : "border-white/5"
      } p-5 transition-all duration-300 ${
        hover ? "hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5" : ""
      } ${className}`}
    >
      {gradientBorder && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 via-transparent to-purple-500/40 p-[1px] -z-10">
          <div className="w-full h-full bg-surface rounded-xl" />
        </div>
      )}
      {children}
    </div>
  );
}