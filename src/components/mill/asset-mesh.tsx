import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { stageIndex } from "@/lib/factory/spec";
import { isWardrobe, type AssetSpec, type MeshStats, type Stage } from "@/lib/factory/types";
import { Skeleton, TPoseMannequin } from "./wardrobe-rig";

type Props = {
  spec: AssetSpec;
  stage: Stage;
  onStats?: (stats: MeshStats) => void;
};

function useMat(hex: string, metal: number, rough: number, wire: boolean) {
  return useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: hex,
      metalness: metal,
      roughness: rough,
      wireframe: wire,
      envMapIntensity: 0.8,
    });
    return mat;
  }, [hex, metal, rough, wire]);
}

export function AssetMesh({ spec, stage, onStats }: Props) {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const reveal = stageIndex(stage);
  const wire = reveal < 3;
  const showMats = reveal >= 4;
  const wardrobe = isWardrobe(spec.family);
  const m0 = spec.materials[0] ?? { hex: "#7a8088", metal: 0.4, rough: 0.5, name: "A" };
  const m1 = spec.materials[1] ?? m0;
  const body = useMat(showMats ? m0.hex : "#9a9c9f", showMats ? m0.metal : 0.2, showMats ? m0.rough : 0.7, wire);
  const trim = useMat(showMats ? m1.hex : "#6a6c70", showMats ? m1.metal : 0.15, showMats ? m1.rough : 0.75, wire);

  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;
  const statsKey = `${spec.objectName}-${stage}-${spec.seed}`;
  const countedKey = useRef("");

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    clock.current += d;
    const live = wardrobe && reveal >= 5 && spec.bind !== "cache";
    const s = live ? Math.sin(clock.current * 1.6) * 0.55 : 0;
    if (group.current) {
      group.current.rotation.y += d * (wardrobe ? 0.12 : 0.28);
      if (wardrobe) {
        group.current.traverse((c) => {
          if (c.name === "BindArmL" || c.name === "BindSkelArmL") c.rotation.z = s;
          if (c.name === "BindArmR" || c.name === "BindSkelArmR") c.rotation.z = -s;
          if (c.name === "BindLegL" || c.name === "BindSkelLegL") c.rotation.x = s * 0.35;
          if (c.name === "BindLegR" || c.name === "BindSkelLegR") c.rotation.x = -s * 0.35;
        });
      }
    }
    if (!group.current || !onStatsRef.current) return;
    if (countedKey.current === statsKey) return;
    let tris = 0;
    let verts = 0;
    group.current.traverse((c) => {
      if (!(c instanceof THREE.Mesh)) return;
      if (c.name.startsWith("Jig")) return;
      const g = c.geometry;
      const v = g.attributes.position?.count ?? 0;
      verts += v;
      tris += g.index ? g.index.count / 3 : v / 3;
    });
    if (tris <= 0) return;
    countedKey.current = statsKey;
    onStatsRef.current({
      tris: Math.round(tris),
      verts,
      materials: spec.materials.length,
    });
  });

  useLayoutEffect(() => {
    return () => {
      body.dispose();
      trim.dispose();
    };
  }, [body, trim]);

  return (
    <group ref={group}>
      {wardrobe && <TPoseMannequin />}
      {wardrobe && <Skeleton visible={reveal >= 3} />}
      <FamilyMesh family={spec.family} spec={spec} body={body} trim={trim} reveal={reveal} />
    </group>
  );
}

function FamilyMesh({
  family,
  spec,
  body,
  trim,
  reveal,
}: {
  family: AssetSpec["family"];
  spec: AssetSpec;
  body: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  reveal: number;
}) {
  const [sx, sy, sz] = spec.scaleMeters;
  const detail = reveal >= 3;
  switch (family) {
    case "crate":
      return (
        <group>
          <mesh material={body} position={[0, sy / 2, 0] as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={[sx, sy, sz]} />
          </mesh>
          {detail && (
            <>
              <mesh material={body} position={[0, sy + 0.03, 0] as [number, number, number]} castShadow>
                <boxGeometry args={[sx + 0.02, 0.06, sz + 0.02]} />
              </mesh>
              <mesh material={trim} position={[0, sy / 2, sz * 0.22] as [number, number, number]} castShadow>
                <boxGeometry args={[sx + 0.04, sy + 0.02, 0.08]} />
              </mesh>
              <mesh material={trim} position={[0, sy / 2, -sz * 0.22] as [number, number, number]} castShadow>
                <boxGeometry args={[sx + 0.04, sy + 0.02, 0.08]} />
              </mesh>
              {(
                [
                  [-1, -1],
                  [1, -1],
                  [-1, 1],
                  [1, 1],
                ] as const
              ).map(([x, z]) => (
                <mesh
                  key={`${x}${z}`}
                  material={trim}
                  position={[x * (sx / 2 - 0.08), 0.04, z * (sz / 2 - 0.08)] as [number, number, number]}
                  castShadow
                >
                  <boxGeometry args={[0.12, 0.08, 0.12]} />
                </mesh>
              ))}
            </>
          )}
        </group>
      );
    case "barrel":
      return (
        <group>
          <mesh material={body} position={[0, sy / 2, 0] as [number, number, number]} castShadow>
            <cylinderGeometry args={[sx / 2, sx / 2, sy, 28]} />
          </mesh>
          {detail &&
            [0.18, 0.5, 0.82].map((t) => (
              <mesh key={t} material={trim} position={[0, sy * t, 0] as [number, number, number]} castShadow>
                <cylinderGeometry args={[sx / 2 + 0.02, sx / 2 + 0.02, 0.05, 28]} />
              </mesh>
            ))}
        </group>
      );
    case "weapon":
      return (
        <group>
          <mesh material={body} position={[0, sy * 0.55, 0] as [number, number, number]} castShadow>
            <boxGeometry args={[sx, sy * 0.75, sz]} />
          </mesh>
          {detail && (
            <>
              <mesh material={trim} position={[0, sy * 0.18, 0] as [number, number, number]} castShadow>
                <boxGeometry args={[sx * 2.6, 0.05, sz * 2.2]} />
              </mesh>
              <mesh material={trim} position={[0, sy * 0.09, 0] as [number, number, number]} castShadow>
                <cylinderGeometry args={[sx * 0.7, sx * 0.7, sy * 0.18, 16]} />
              </mesh>
              <mesh material={body} position={[0, 0.04, 0] as [number, number, number]} castShadow>
                <sphereGeometry args={[sx * 0.85, 16, 12]} />
              </mesh>
            </>
          )}
        </group>
      );
    case "module":
      return (
        <group>
          <mesh material={body} position={[0, sy / 2, 0] as [number, number, number]} castShadow>
            <boxGeometry args={[sx, sy, sz]} />
          </mesh>
          {detail && (
            <>
              <mesh material={trim} position={[-sx / 2 - sz * 0.12, sy * 0.4, 0] as [number, number, number]} castShadow>
                <cylinderGeometry args={[sz * 0.22, sz * 0.22, sy * 0.7, 20]} />
              </mesh>
              <mesh material={trim} position={[sx / 2 + sz * 0.12, sy * 0.4, 0] as [number, number, number]} castShadow>
                <cylinderGeometry args={[sz * 0.22, sz * 0.22, sy * 0.7, 20]} />
              </mesh>
              <mesh material={body} position={[0, sy + sy * 0.18, sz * 0.2] as [number, number, number]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, sy * 0.45, 10]} />
              </mesh>
            </>
          )}
        </group>
      );
    case "furniture":
      return (
        <group>
          <mesh material={body} position={[0, sy * 0.46, 0] as [number, number, number]} castShadow>
            <boxGeometry args={[sx, 0.08, sz]} />
          </mesh>
          {detail && (
            <>
              <mesh material={body} position={[0, sy * 0.74, -sz / 2 + 0.03] as [number, number, number]} castShadow>
                <boxGeometry args={[sx, sy * 0.56, 0.06]} />
              </mesh>
              {(
                [
                  [-1, -1],
                  [1, -1],
                  [-1, 1],
                  [1, 1],
                ] as const
              ).map(([x, z]) => (
                <mesh
                  key={`${x}${z}`}
                  material={trim}
                  position={[x * (sx / 2 - 0.06), sy * 0.23, z * (sz / 2 - 0.06)] as [number, number, number]}
                  castShadow
                >
                  <boxGeometry args={[0.06, sy * 0.46, 0.06]} />
                </mesh>
              ))}
            </>
          )}
        </group>
      );
    case "environment":
      return (
        <group>
          <mesh material={body} position={[0, sy / 2, 0] as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={[sx, sy, sz]} />
          </mesh>
          {detail && (
            <>
              <mesh material={trim} position={[0, sy - 0.04, 0] as [number, number, number]}>
                <boxGeometry args={[sx + 0.06, 0.08, sz + 0.04]} />
              </mesh>
              <mesh material={trim} position={[0, sy * 0.28, 0.01] as [number, number, number]}>
                <boxGeometry args={[sx * 0.88, 0.12, sz + 0.02]} />
              </mesh>
            </>
          )}
        </group>
      );
    case "organic":
      return (
        <group>
          <mesh material={body} position={[0, sy * 0.38, 0] as [number, number, number]} scale={[1, 0.72, 0.88]} castShadow>
            <icosahedronGeometry args={[Math.max(sx, sz) * 0.42, 1]} />
          </mesh>
          {detail && (
            <mesh
              material={trim}
              position={[sx * 0.22, sy * 0.28, -sz * 0.1] as [number, number, number]}
              scale={[0.9, 0.75, 1.05]}
              castShadow
            >
              <icosahedronGeometry args={[Math.max(sx, sz) * 0.3, 1]} />
            </mesh>
          )}
        </group>
      );
    case "machine":
      return (
        <group>
          <mesh material={body} position={[0, sy * 0.28, 0] as [number, number, number]} castShadow>
            <cylinderGeometry args={[sx * 0.22, sx * 0.22, sy * 0.55, 20]} />
          </mesh>
          {detail && (
            <>
              <mesh material={trim} position={[0, 0.04, 0] as [number, number, number]} castShadow>
                <boxGeometry args={[sx * 0.76, 0.08, sx * 0.76]} />
              </mesh>
              <mesh material={body} position={[0, sy * 0.58, 0] as [number, number, number]} castShadow>
                <boxGeometry args={[sx * 0.64, 0.08, sx * 0.64]} />
              </mesh>
              <mesh material={trim} position={[0, sy * 0.72, 0] as [number, number, number]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[sx * 0.28, 0.035, 10, 22]} />
              </mesh>
            </>
          )}
        </group>
      );
    case "shirt":
      return (
        <group>
          <mesh material={body} position={[0, 1.18, 0]} castShadow>
            <boxGeometry args={[sx, sy * 0.76, sz]} />
          </mesh>
          {detail && (
            <>
              <group name="BindArmL" position={[0.18, 1.42, 0]}>
                <mesh material={body} position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[sz * 0.2, sz * 0.18, sy * 0.5, 14]} />
                </mesh>
              </group>
              <group name="BindArmR" position={[-0.18, 1.42, 0]}>
                <mesh material={body} position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[sz * 0.2, sz * 0.18, sy * 0.5, 14]} />
                </mesh>
              </group>
              <mesh material={trim} position={[0, 1.48, 0]} castShadow>
                <cylinderGeometry args={[sz * 0.22, sz * 0.22, 0.05, 16]} />
              </mesh>
            </>
          )}
        </group>
      );
    case "pants":
      return (
        <group>
          <mesh material={body} position={[0, 0.96, 0]} castShadow>
            <boxGeometry args={[sx, 0.16, sz]} />
          </mesh>
          <group name="BindLegL" position={[0.09, 0.94, 0]}>
            <mesh material={body} position={[0, -0.42, 0]} castShadow>
              <cylinderGeometry args={[sx * 0.22, sx * 0.2, sy * 0.72, 16]} />
            </mesh>
          </group>
          <group name="BindLegR" position={[-0.09, 0.94, 0]}>
            <mesh material={body} position={[0, -0.42, 0]} castShadow>
              <cylinderGeometry args={[sx * 0.22, sx * 0.2, sy * 0.72, 16]} />
            </mesh>
          </group>
          {detail && (
            <mesh material={trim} position={[0, 1.02, 0]} castShadow>
              <boxGeometry args={[sx + 0.02, 0.05, sz + 0.02]} />
            </mesh>
          )}
        </group>
      );
    case "cloak":
      return (
        <group>
          <mesh material={body} position={[0, 0.82, -0.16]} rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[sx, sy * 0.84, 0.07]} />
          </mesh>
          {detail && (
            <>
              <mesh material={body} position={[-0.16, 0.86, -0.12]} rotation={[0.1, 0, 0.18]} castShadow>
                <boxGeometry args={[sx * 0.45, sy * 0.72, 0.05]} />
              </mesh>
              <mesh material={body} position={[0.16, 0.86, -0.12]} rotation={[0.1, 0, -0.18]} castShadow>
                <boxGeometry args={[sx * 0.45, sy * 0.72, 0.05]} />
              </mesh>
              <mesh material={body} position={[0, 1.58, -0.04]} scale={[1.05, 0.72, 0.85]} castShadow>
                <sphereGeometry args={[0.14, 14, 10]} />
              </mesh>
              <mesh material={trim} position={[0, 1.46, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[0.07, 0.016, 8, 16]} />
              </mesh>
            </>
          )}
        </group>
      );
    case "armor":
      return (
        <group>
          <mesh material={body} position={[0, 1.22, 0.04]} castShadow>
            <boxGeometry args={[sx, sy * 0.56, sz * 0.55]} />
          </mesh>
          {detail && (
            <>
              <group name="BindArmL" position={[0.22, 1.42, 0.02]}>
                <mesh material={body} castShadow>
                  <sphereGeometry args={[0.11, 14, 12]} />
                </mesh>
              </group>
              <group name="BindArmR" position={[-0.22, 1.42, 0.02]}>
                <mesh material={body} castShadow>
                  <sphereGeometry args={[0.11, 14, 12]} />
                </mesh>
              </group>
              <mesh material={trim} position={[0, 0.98, 0.02]} castShadow>
                <boxGeometry args={[sx + 0.02, 0.06, sz * 0.5]} />
              </mesh>
              <mesh material={body} position={[0, 1.7, 0]} castShadow>
                <sphereGeometry args={[0.13, 16, 12]} />
              </mesh>
              <mesh material={trim} position={[0, 1.66, 0.08]} castShadow>
                <boxGeometry args={[0.16, 0.08, 0.1]} />
              </mesh>
            </>
          )}
        </group>
      );
    case "boots":
      return (
        <group>
          <group name="BindLegL" position={[0.09, 0.94, 0]}>
            <mesh material={body} position={[0, -0.72, 0]} castShadow>
              <cylinderGeometry args={[sx * 0.28, sx * 0.3, sy * 0.72, 16]} />
            </mesh>
            {detail && (
              <>
                <mesh material={trim} position={[0, -0.91, 0.04]} castShadow>
                  <boxGeometry args={[sx * 0.56, 0.06, sz * 0.72]} />
                </mesh>
                <mesh material={body} position={[0, -0.86, 0.08]} castShadow>
                  <boxGeometry args={[sx * 0.48, 0.1, sz * 0.44]} />
                </mesh>
              </>
            )}
          </group>
          <group name="BindLegR" position={[-0.09, 0.94, 0]}>
            <mesh material={body} position={[0, -0.72, 0]} castShadow>
              <cylinderGeometry args={[sx * 0.28, sx * 0.3, sy * 0.72, 16]} />
            </mesh>
            {detail && (
              <>
                <mesh material={trim} position={[0, -0.91, 0.04]} castShadow>
                  <boxGeometry args={[sx * 0.56, 0.06, sz * 0.72]} />
                </mesh>
                <mesh material={body} position={[0, -0.86, 0.08]} castShadow>
                  <boxGeometry args={[sx * 0.48, 0.1, sz * 0.44]} />
                </mesh>
              </>
            )}
          </group>
        </group>
      );
    default:
      return null;
  }
}
