//src/components/ui/Avatar.tsx
import React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export default function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  className = "",
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-primary/20 flex items-center justify-center font-medium text-primary-foreground text-text ${sizeClasses[size]} ${className}`}
    >
      {fallback}
    </div>
  );
}