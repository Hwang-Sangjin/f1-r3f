import { createContext, useContext, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber/webgpu";
import type { PhysicsBackend, PhysicsEngine } from "./types";
import { BounceEngine } from "./bounce";
import { CrashcatEngine } from "./crashcat";
import { RapierEngine } from "./rapier";

const PhysicsContext = createContext<PhysicsEngine>(null!);

export function usePhysics(): PhysicsEngine {
  return useContext(PhysicsContext);
}

function PhysicsStepper() {
  const engine = usePhysics();
  useFrame((_, delta) => {
    engine.step(delta);
  });
  return null;
}

function createSyncEngine(backend: PhysicsBackend): PhysicsEngine | null {
  if (backend === "crashcat") return new CrashcatEngine();
  if (backend === "bounce") return new BounceEngine();
  return null;
}

export function PhysicsProvider({
  backend,
  children,
}: {
  backend: PhysicsBackend;
  children: React.ReactNode;
}) {
  const [engine, setEngine] = useState<PhysicsEngine | null>(() =>
    createSyncEngine(backend),
  );

  useEffect(() => {
    if (backend !== "rapier") {
      setEngine(createSyncEngine(backend));
      return;
    }

    let cancelled = false;

    RapierEngine.init().then(() => {
      if (!cancelled) {
        setEngine(new RapierEngine());
      }
    });

    return () => {
      cancelled = true;
    };
  }, [backend]);

  if (!engine) return null;

  return (
    <PhysicsContext.Provider value={engine}>
      <PhysicsStepper />
      {children}
    </PhysicsContext.Provider>
  );
}
