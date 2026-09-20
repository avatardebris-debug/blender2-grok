import { useEffect, useState, type ReactElement } from "react";
import type { AssetSpec, MeshStats, Stage } from "@/lib/factory/types";

type Props = {
  spec: AssetSpec | null;
  stage: Stage;
  onStats?: (stats: MeshStats) => void;
};

export function MillViewportHost(props: Props) {
  const [Comp, setComp] = useState<null | ((p: Props) => ReactElement | null)>(null);

  useEffect(() => {
    let alive = true;
    void import("./viewport").then((m) => {
      if (alive) setComp(() => m.MillViewport);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!Comp) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-bg">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Mill plate</p>
      </div>
    );
  }

  return <Comp {...props} />;
}
