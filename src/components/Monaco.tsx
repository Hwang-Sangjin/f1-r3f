import { useGLTF } from "@react-three/drei";

export function Monaco(props) {
  const { nodes } = useGLTF("/models/Monaco.glb");
  return (
    <group
      position={[0, -10, 0]}
      rotation={[0, Math.PI / 2, 0]}
      scale={[7, 0.91, 7]}
      {...props}
      dispose={null}
    >
      <mesh receiveShadow geometry={nodes.Cube.geometry}>
        <meshStandardMaterial color="#444444" />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/Monaco.glb");
