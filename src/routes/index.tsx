import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Dock, IntakePanel, PipelineStrip, QueueRail } from "@/components/mill/panels";
import { ShellHeader } from "@/components/mill/shell";
import { MillViewportHost } from "@/components/mill/viewport-host";
import { grokStatus } from "@/lib/factory/ai";
import { useFactory } from "@/lib/factory/store";
import { isWardrobe } from "@/lib/factory/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const jobs = useFactory((s) => s.jobs);
  const activeId = useFactory((s) => s.activeId);
  const setGrokAvailable = useFactory((s) => s.setGrokAvailable);
  const reportStats = useFactory((s) => s.reportStats);
  const job = jobs.find((j) => j.id === activeId) ?? jobs[0] ?? null;

  useEffect(() => {
    let alive = true;
    void (async () => {
      await useFactory.persist.rehydrate();
      const s = useFactory.getState();
      if (!s.activeId && s.catalog[0]) s.inspectCatalog(s.catalog[0]);
      try {
        const status = await grokStatus();
        if (alive) setGrokAvailable(status.available);
      } catch {
        if (alive) setGrokAvailable(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [setGrokAvailable]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <ShellHeader current="mill" />
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,320px)]">
        <aside className="order-2 border-b border-border lg:order-1 lg:border-b-0 lg:border-r">
          <IntakePanel />
        </aside>

        <section className="order-1 flex min-h-[420px] flex-col border-b border-border lg:order-2 lg:border-b-0 lg:border-r">
          <PipelineStrip job={job} />
          <QueueRail />
          <div className="relative min-h-[380px] flex-1 lg:min-h-[320px]">
            <MillViewportHost
              spec={job?.spec ?? null}
              stage={job?.stage ?? "queued"}
              onStats={(stats) => {
                if (job) reportStats(job.id, stats);
              }}
            />
            <div className="pointer-events-none absolute left-4 top-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {job?.spec && isWardrobe(job.spec.family)
                  ? job.spec.bind === "cache"
                    ? "Wardrobe · MD cache"
                    : `Wardrobe · ${job.spec.rig ?? "mixamo"} bind`
                  : "Mill plate"}
              </p>
              <p className="font-display text-2xl font-semibold tracking-tight">
                {job?.spec?.displayName ?? "Idle"}
              </p>
            </div>
          </div>
        </section>

        <aside className="order-3 min-h-[280px] lg:order-3">
          <Dock job={job} />
        </aside>
      </main>
    </div>
  );
}
