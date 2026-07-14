import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 px-4 py-5">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
        CT
      </div>
      <span className="text-xl font-bold text-text hidden lg:block">
        CryptoTracker
      </span>
    </Link>
  );
}