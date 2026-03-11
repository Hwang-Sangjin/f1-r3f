import { useTexture } from "@react-three/drei/webgpu";
import { VFXParticles } from "r3f-vfx";
import { color, mix, texture, uv, vec4 } from "three/tsl";

export const Smoke = () => {
  const text = useTexture("/textures/smoke.png");

  const colorNode = () => {
    const t = texture(text);

    const col = color("#ffffff");

    const fade = uv().y.smoothstep(0.2, 0.6);
    return vec4(col, t.a.mul(fade));
  };
  return (
    <VFXParticles
      name="smoke"
      autoStart={false}
      position={[0, 0, 0]}
      size={[0.43, 0.78]}
      fadeSize={[1, 0]}
      fadeSizeCurve={{
        points: [
          {
            pos: [0, 0],
            handleOut: [0.10091957976483548, 0.31418981272487023],
          },
          {
            pos: [0.5033331298828125, 1],
            handleIn: [-0.36584, 4.480247850000677e-17],
            handleOut: [0.36584, 0],
          },
          {
            pos: [1, 0],
            handleIn: [-0.08189789904528302, 0.31967598303902756],
          },
        ],
      }}
      colorStart={["#ffffff"]}
      fadeOpacity={[1, 0]}
      gravity={[0, 0.2, 0]}
      speed={[0, 0]}
      lifetime={0.5}
      friction={{
        intensity: 0,
        easing: "linear",
      }}
      direction={[
        [-1, 1],
        [0, 1],
        [-1, 1],
      ]}
      startPosition={[
        [0, 0],
        [-0.35, -0.35],
        [0, 0],
      ]}
      rotation={[0, 0]}
      rotationSpeed={[0, 0]}
      appearance="gradient"
      blending={1}
      lighting="standard"
      emitterShape={1}
      emitterRadius={[0, 1]}
      emitterAngle={0.7853981633974483}
      emitterHeight={[0, 1]}
      emitterDirection={[0, 1, 0]}
      colorNode={colorNode}
    />
  );
};
