import { Howl, Howler } from "howler";
import { MathUtils } from "three";

let started = false;
let users = 0;

const engine = new Howl({
  src: ["/audio/engine.ogg"],
  loop: true,
  volume: 0,
  preload: true,
});

const skid = new Howl({
  src: ["/audio/skid.ogg"],
  loop: true,
  volume: 0,
  preload: true,
});

export async function activateVehicleAudio() {
  Howler.autoUnlock = true;
  Howler.autoSuspend = false;

  if (Howler.ctx && Howler.ctx.state !== "running") {
    await Howler.ctx.resume();
  }

  if (started || (Howler.ctx && Howler.ctx.state !== "running")) {
    return;
  }

  engine.play();
  skid.play();
  started = true;
}

export function retainVehicleAudio() {
  users += 1;
}

export function releaseVehicleAudio() {
  users = Math.max(0, users - 1);

  if (users === 0) {
    engine.stop();
    skid.stop();
    started = false;
  }
}

export function isVehicleAudioActive() {
  return Howler.ctx?.state === "running" && started;
}

export function updateVehicleEngine(
  speedFactor: number,
  throttleFactor: number,
  delta: number,
) {
  if (!started) {
    return;
  }

  const targetVolume = MathUtils.mapLinear(
    MathUtils.clamp(speedFactor + throttleFactor * 0.5, 0, 1.5),
    0,
    1.5,
    0.08,
    0.45,
  );

  engine.volume(MathUtils.lerp(engine.volume(), targetVolume, delta * 5));

  let targetRate = MathUtils.mapLinear(speedFactor, 0, 1, 0.65, 1.6);
  if (throttleFactor > 0.1) {
    targetRate += 0.1;
  }

  engine.rate(MathUtils.lerp(engine.rate(), targetRate, delta * 2));
}

export function updateVehicleSkid(
  driftIntensity: number,
  linearSpeed: number,
  delta: number,
) {
  if (!started) {
    return;
  }

  const shouldEmit = driftIntensity > 0.25;
  const targetVolume = shouldEmit
    ? MathUtils.mapLinear(
        MathUtils.clamp(driftIntensity, 0.25, 2),
        0.25,
        2,
        0.08,
        0.8,
      )
    : 0;

  skid.volume(MathUtils.lerp(skid.volume(), targetVolume, delta * 10));
  skid.rate(
    MathUtils.lerp(
      skid.rate(),
      MathUtils.clamp(Math.abs(linearSpeed), 1, 3),
      delta * 10,
    ),
  );
}
