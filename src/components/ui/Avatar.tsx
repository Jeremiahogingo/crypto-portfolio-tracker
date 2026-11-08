//src/components/ui/Avatar.tsx

import Image from "next/image";

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

const sizePixels = {
  sm: 24,
  md: 32,
  lg: 40,
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
      <Image
        src={src}
        alt={alt}
        width={sizePixels[size]}
        height={sizePixels[size]}
        unoptimized
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
