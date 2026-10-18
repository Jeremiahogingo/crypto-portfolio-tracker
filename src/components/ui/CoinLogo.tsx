// src/components/ui/CoinLogo.tsx
//
// Renders a coin logo. Handles two cases:
//
//   1. logoUrl starts with "http" → live data from CoinGecko CDN.
//      Render an <img>. CoinGecko's CDN can 404 occasionally on freshly
//      listed coins — we suppress the broken-image icon via alt="" and
//      a neutral background, so the layout doesn't jump.
//
//   2. Otherwise → fallback data, where logoUrl is a single emoji char.
//      Render it as text inside the same circular container.
//
// The wrapper is always the same circular shape, so table rows and cards
// stay aligned regardless of which data path is active.

interface CoinLogoProps {
  src: string | undefined;
  alt?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-base",
  lg: "w-10 h-10 text-xl",
};

export default function CoinLogo({
  src,
  alt = "",
  size = "md",
}: CoinLogoProps) {
  const isUrl = Boolean(src?.startsWith("http"));
  const dims = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white/5 overflow-hidden ${dims}`}
    >
      {isUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{src || "?"}</span>
      )}
    </span>
  );
}