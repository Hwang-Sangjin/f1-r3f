import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { usePhysics } from "../physics/context";

export function Monaco(props) {
  const { nodes } = useGLTF("/models/Monaco.glb");
  const colliderMeshRef = useRef<THREE.Mesh>(null);
  const engine = usePhysics();

  useEffect(() => {
    const colliderMesh = colliderMeshRef.current;
    if (!colliderMesh) return;

    colliderMesh.updateWorldMatrix(true, false);
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
      position={[0, -10, 0]}
      rotation={[0, Math.PI / 2, 0]}
      scale={[7, 0.91, 7]}
      {...props}
      dispose={null}
    >
      <mesh ref={colliderMeshRef} receiveShadow geometry={nodes.Cube.geometry}>
        <meshStandardMaterial color="#444444" />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/Monaco.glb");
