import { Environment } from "@react-three/drei";
import { useRef } from "react";
import { DirectionalLight } from "three";
import { useFrame } from "@react-three/fiber/webgpu";

const SUN_DIR = [60, 80, 40] as const;
const SHADOW_AREA = 60;

export const Lights = () => {
  const sunRef = useRef<DirectionalLight>(null!);

  useFrame(({ camera }) => {
    const sun = sunRef.current;
    if (!sun) return;

    sun.position.set(
      camera.position.x + SUN_DIR[0],
      SUN_DIR[1],
      camera.position.z + SUN_DIR[2],
    );
    sun.target.position.set(camera.position.x, 0, camera.position.z);
    sun.target.updateMatrixWorld();
  });

  return (
    <>
      {/* Sun */}
      <directionalLight
        ref={sunRef}
        castShadow
        position={SUN_DIR}
        intensity={1.5}
        color="#fff5e6"
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-SHADOW_AREA}
        shadow-camera-right={SHADOW_AREA}
        shadow-camera-top={SHADOW_AREA}
        shadow-camera-bottom={-SHADOW_AREA}
        shadow-bias={-0.0005}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-40, 30, -20]}
        intensity={0.3}
        color="#b0d0ff"
      />

      {/* Hemisphere for sky/ground bounce */}
      <hemisphereLight args={["#87ceeb", "#8b7355", 0.2]} />

      {/* Environment for reflections and background */}
      <Environment
        preset="sunset"
        background
        backgroundBlurriness={0.8}
        environmentIntensity={0.3}
      />
    </>
  );
};
