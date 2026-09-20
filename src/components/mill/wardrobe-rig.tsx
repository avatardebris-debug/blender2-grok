import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { MANNEQUIN } from "@/lib/factory/types";

/** T-pose bone gizmos. After QC, a walk-test swing proves the bind. */
export function Skeleton({ visible }: { visible: boolean }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c4b49a",
        metalness: 0.35,
        roughness: 0.45,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );
  useLayoutEffect(() => () => mat.dispose(), [mat]);
  if (!visible) return null;
  return (
    <group>
      <Bone mat={mat} pos={[0, 1.01, 0]} size={[0.08, 0.16, 0.08]} />
      <Bone mat={mat} pos={[0, 1.22, 0]} size={[0.07, 0.28, 0.07]} />
      <Bone mat={mat} pos={[0, 1.48, 0]} size={[0.05, 0.16, 0.05]} />
      <Bone mat={mat} pos={[0, 1.68, 0]} size={[0.07, 0.16, 0.08]} />
      <group name="BindSkelArmL" position={[0.18, 1.42, 0]}>
        <Bone mat={mat} pos={[0.14, 0, 0]} size={[0.28, 0.045, 0.045]} />
        <Bone mat={mat} pos={[0.4, 0, 0]} size={[0.24, 0.04, 0.04]} />
      </group>
      <group name="BindSkelArmR" position={[-0.18, 1.42, 0]}>
        <Bone mat={mat} pos={[-0.14, 0, 0]} size={[0.28, 0.045, 0.045]} />
        <Bone mat={mat} pos={[-0.4, 0, 0]} size={[0.24, 0.04, 0.04]} />
      </group>
      <group name="BindSkelLegL" position={[0.09, 0.94, 0]}>
        <Bone mat={mat} pos={[0, -0.22, 0]} size={[0.05, 0.44, 0.05]} />
        <Bone mat={mat} pos={[0, -0.58, 0.02]} size={[0.045, 0.28, 0.045]} />
      </group>
      <group name="BindSkelLegR" position={[-0.09, 0.94, 0]}>
        <Bone mat={mat} pos={[0, -0.22, 0]} size={[0.05, 0.44, 0.05]} />
        <Bone mat={mat} pos={[0, -0.58, 0.02]} size={[0.045, 0.28, 0.045]} />
      </group>
    </group>
  );
}

function Bone({
  mat,
  pos,
  size,
}: {
  mat: THREE.MeshStandardMaterial;
  pos: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh name="JigBone" material={mat} position={pos}>
      <boxGeometry args={size} />
    </mesh>
  );
}

export function TPoseMannequin() {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2c30",
        metalness: 0.04,
        roughness: 0.92,
        transparent: true,
        opacity: 0.32,
      }),
    [],
  );
  useLayoutEffect(() => () => mat.dispose(), [mat]);
  const { headY, chestY, hipY, hipX } = MANNEQUIN;
  return (
    <group>
      <mesh name="JigHead" material={mat} position={[0, headY, 0]}>
        <sphereGeometry args={[0.1, 12, 10]} />
      </mesh>
      <mesh name="JigTorso" material={mat} position={[0, chestY, 0]}>
        <boxGeometry args={[0.32, 0.56, 0.2]} />
      </mesh>
      <mesh name="JigPelvis" material={mat} position={[0, hipY, 0]}>
        <boxGeometry args={[0.28, 0.16, 0.18]} />
      </mesh>
      {([-hipX, hipX] as const).map((x) => (
        <mesh key={`leg${x}`} name="JigLeg" material={mat} position={[x, 0.5, 0]}>
          <cylinderGeometry args={[0.055, 0.06, 0.78, 10]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`arm${side}`}
          name="JigArm"
          material={mat}
          position={[side * 0.42, 1.42, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.04, 0.045, 0.52, 8]} />
        </mesh>
      ))}
    </group>
  );
}

