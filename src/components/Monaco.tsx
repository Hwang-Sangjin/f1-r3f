import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { usePhysics } from "../physics/context";

export function Monaco(props) {
  const { nodes: collisionNodes } = useGLTF(
    "/models/Monaco_Height1.glb",
  ) as any;
  const colliderMeshRef = useRef<THREE.Mesh>(null);
  const engine = usePhysics();

  useEffect(() => {
    const colliderMesh = colliderMeshRef.current;
    if (!colliderMesh) return;

    colliderMesh.parent?.updateWorldMatrix(true, true);
    colliderMesh.updateWorldMatrix(true, true);

    const colliderGeometry = colliderMesh.geometry.clone();
    colliderGeometry.applyMatrix4(colliderMesh.matrixWorld);

    const shape = engine.createTriangleMeshFromGeometry(colliderGeometry);
    colliderGeometry.dispose();

    const body = engine.createStaticBody({ shape });

    return () => {
      engine.destroyBody(body);
      engine.destroyShape(shape);
    };
  }, [engine]);

  return (
    <group
      position={[0, -11, 0]}
      rotation={[0, Math.PI / 2, 0]}
      scale={[7, 0.91, 7]}
      {...props}
      dispose={null}
    >
      <mesh
        ref={colliderMeshRef}
        geometry={collisionNodes.Cube011.geometry}
        visible={false}
      />
    </group>
  );
}

useGLTF.preload("/models/Monaco_Height1.glb");
