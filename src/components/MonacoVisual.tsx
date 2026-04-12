import { useGLTF } from "@react-three/drei";

export function MonacoVisual(props) {
  const { nodes, materials } = useGLTF("/models/road_visual.glb") as any;

  return (
    <group
      position={[0, -11, 0]}
      rotation={[0, Math.PI / 2, 0]}
      scale={[7, 7, 7]}
      {...props}
      dispose={null}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube005.geometry}
        material={nodes.Cube005.material}
        scale={[1, 0.1, 1]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane007.geometry}
        material={nodes.Plane007.material}
        position={[2.585, 0.247, 1.074]}
        rotation={[Math.PI, 0, Math.PI]}
        scale={[1.23, 0.675, 1]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane008.geometry}
        material={nodes.Plane008.material}
        position={[1.08, 0.264, -1.103]}
        scale={[1.23, 0.675, 1]}
      />
    </group>
  );
}

useGLTF.preload("/models/road_visual.glb");
