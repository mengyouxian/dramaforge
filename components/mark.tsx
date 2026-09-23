import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.5 23 V10.5 h6.2 a4 4 0 0 1 0 8 H8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 15.2 h4.5 M23.25 13 v4.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
