import { usePostProcessing } from "@react-three/fiber/webgpu";
import { clamp, float, mrt, output, pow, screenUV, velocity } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";

const CONTRAST = 2;
const MIDPOINT = 0.8;

export const PostProcessing = () => {
  usePostProcessing(
    ({ postProcessing, passes }) => {
      const beauty = passes.scenePass.getTextureNode();
      const vel = passes.scenePass.getTextureNode("velocity");

      const bloomPass = bloom(beauty, 0.25, 0, 0);

      const a = float(2.51);
      const b = float(0.03);
      const c = float(2.43);
      const d = float(0.59);
      const e = float(0.14);
      const acesFilmic = clamp(
        beauty
          .mul(beauty.mul(a).add(b))
          .div(beauty.mul(beauty.mul(c).add(d)).add(e)),
        0.0,
        1.0,
      );
      let color = acesFilmic;
      // S-curve contrast: pow((x / midpoint), contrast) * midpoint  for x < midpoint, mirrored above
      const mid = float(MIDPOINT);
      const exp = float(CONTRAST);
      const normalized = color.div(mid);
      color = pow(normalized, exp).mul(mid);

      // Vignette
      const vignette = screenUV
        .distance(0.5)
        .remap(0.5, 1)
        .mul(2.5)
        .clamp()
        .oneMinus();

      postProcessing.outputNode = color.clamp(0, 0.9);

      return { beauty, velocity: vel };
    },
    ({ passes }) => {
      passes.scenePass.setMRT(
        mrt({
          output,
          velocity,
        }),
      );
    },
  );

  return null;
};
