import { Canvas } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { AssetMesh } from "./asset-mesh";
import type { AssetSpec, MeshStats, Stage } from "@/lib/factory/types";

export function MillViewport({
  spec,
  stage,
  onStats,
}: {
  spec: AssetSpec | null;
  stage: Stage;
  onStats?: (stats: MeshStats) => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-bg">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Mill plate</p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[280px] touch-none bg-bg">
      <Canvas
        camera={{ position: [2.6, 1.7, 2.8], fov: 38, near: 0.05, far: 40 }}
        dpr={[1, 2]}
        shadows="percentage"
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#0b0c0e"]} />
        <ambientLight intensity={0.32} />
        <directionalLight
          position={[4.2, 7.2, 3.4]}
          intensity={1.55}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3.2, 1.6, -2.4]} intensity={0.28} />
        <hemisphereLight args={["#d8dce2", "#1a1c1f", 0.22]} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
          <circleGeometry args={[3.4, 48]} />
          <meshStandardMaterial color="#121316" metalness={0.2} roughness={0.85} />
        </mesh>
        <Grid
          args={[8, 8]}
          cellSize={0.2}
          cellThickness={0.6}
          cellColor="#26282c"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#3a3d42"
          fadeDistance={7}
          fadeStrength={1.2}
          infiniteGrid
          position={[0, 0.002, 0]}
        />

        {spec ? <AssetMesh spec={spec} stage={stage} onStats={onStats} /> : <EmptyGizmo />}

        <ContactShadows position={[0, 0, 0]} opacity={0.42} scale={6} blur={2.2} far={2.5} />
        <OrbitControls
          makeDefault
          enablePan={false}
          minPolarAngle={0.25}
          maxPolarAngle={1.42}
          minDistance={1.4}
          maxDistance={8}
          target={[0, 0.45, 0]}
        />
      </Canvas>
    </div>
  );
}

function EmptyGizmo() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.46, 48]} />
        <meshBasicMaterial color="#3a3d42" />
      </mesh>
      <axesHelper args={[0.6]} />
    </group>
  );
}
