import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "mute",
  className,
}: {
  children: React.ReactNode;
  tone?: "mute" | "pass" | "fail" | "warn" | "hot";
  className?: string;
}) {
  const tones = {
    mute: "text-muted bg-raised",
    pass: "text-pass bg-pass/10",
    fail: "text-fail bg-fail/10",
    warn: "text-warn bg-warn/10",
    hot: "text-fg bg-raised",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
