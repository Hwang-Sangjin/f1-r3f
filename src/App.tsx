import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Lights } from "./components/lights";
import { KeyboardControls, OrbitControls } from "@react-three/drei";
import { PlayerController } from "./components/PlayerController";
import {
  activateVehicleAudio,
  isVehicleAudioActive,
} from "./audio/vehicleAudio";
import { Floor } from "./components/floor";
import { Smoke } from "./components/dust";
import { PostProcessing } from "./components/postprocessing";
import { PhysicsProvider } from "./physics/context";
import type { PhysicsBackend } from "./physics/types";
import { Monaco } from "./components/Monaco";

function AudioUnlockButton() {
  const [enabled, setEnabled] = useState(() => isVehicleAudioActive());

  useEffect(() => {
    const syncState = () => {
      setEnabled(isVehicleAudioActive());
    };

    syncState();
    document.addEventListener("pointerdown", syncState);
    document.addEventListener("keydown", syncState);

    return () => {
      document.removeEventListener("pointerdown", syncState);
      document.removeEventListener("keydown", syncState);
    };
  }, []);

  const activateAudio = async () => {
    await activateVehicleAudio();
    setEnabled(isVehicleAudioActive());
  };

  if (enabled) {
    return null;
  }

  return (
    <button
      onClick={() => void activateAudio()}
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 10,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 10,
        background: "rgba(18,18,22,0.88)",
        color: "#fff",
        font: "600 14px/1 sans-serif",
        cursor: "pointer",
      }}
    >
      Activate Audio
    </button>
  );
}

const buttonStyle = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  border: active ? "1px solid #fff" : "1px solid rgba(255,255,255,0.2)",
  borderRadius: 8,
  background: active ? "rgba(255,255,255,0.15)" : "rgba(18,18,22,0.88)",
  color: "#fff",
  font: "600 13px/1 sans-serif",
  cursor: "pointer",
  opacity: active ? 1 : 0.7,
});

function PhysicsToggle({
  backend,
  onChange,
}: {
  backend: PhysicsBackend;
  onChange: (b: PhysicsBackend) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        gap: 6,
      }}
    >
      <button
        style={buttonStyle(backend === "bounce")}
        onClick={() => onChange("bounce")}
      >
        Bounce
      </button>
      <button
        style={buttonStyle(backend === "crashcat")}
        onClick={() => onChange("crashcat")}
      >
        Crashcat
      </button>
      <button
        style={buttonStyle(backend === "rapier")}
        onClick={() => onChange("rapier")}
      >
        Rapier
      </button>
    </div>
  );
}

function App() {
  const [backend, setBackend] = useState<PhysicsBackend>(
    () =>
      (localStorage.getItem("physics-backend") as PhysicsBackend) || "crashcat",
  );

  const handleBackendChange = (b: PhysicsBackend) => {
    localStorage.setItem("physics-backend", b);
    setBackend(b);
  };

  const controls = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "left", keys: ["ArrowLeft", "KeyA"] },
    { name: "right", keys: ["ArrowRight", "KeyD"] },
  ];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <AudioUnlockButton />
      <PhysicsToggle backend={backend} onChange={handleBackendChange} />
      <Canvas
        key={backend}
        flat
        shadows
        renderer={{ forceWebGL: false }}
        hmr={true}
      >
        <Lights />
        <PhysicsProvider backend={backend}>
          <Monaco />
          <Floor />
          <Smoke />
          <KeyboardControls map={controls}>
            <PlayerController />
          </KeyboardControls>
        </PhysicsProvider>
        <PostProcessing />
      </Canvas>
    </div>
  );
}

export default App;
