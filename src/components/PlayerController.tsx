import { useKeyboardControls } from "@react-three/drei";
import type { Camera, Object3D } from "three";
import { Euler, MathUtils, Mesh, Quaternion, Vector3 } from "three";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber/webgpu";
import { Vehicle } from "../Vehicle-truck-yellow";
import {
  releaseVehicleAudio,
  retainVehicleAudio,
  updateVehicleEngine,
  updateVehicleSkid,
} from "../audio/vehicleAudio";
import { usePhysics } from "../physics/context";
import type { PhysicsBody } from "../physics/types";
import { useVFXEmitter } from "r3f-vfx";
import { useControls, folder } from "leva";

type Controls = "forward" | "backward" | "left" | "right";

const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);
const CAMERA_OFFSET = new Vector3(12, 16, 12);
const CAMERA_ROTATION = new Euler(-Math.PI / 4, Math.PI / 4, 0, "YXZ");
const MODEL_OFFSET_Y = -0.65;

const cameraTarget = new Vector3();
const rollAxis = new Vector3();
const fixedCameraQuaternion = new Quaternion().setFromEuler(CAMERA_ROTATION);
const wheelSpinQuaternion = new Quaternion();
const wheelSteerQuaternion = new Quaternion();
const wheelCombinedQuaternion = new Quaternion();
const _wheelWorldPos = new Vector3();

function lerpAngle(current: number, target: number, alpha: number) {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  return current + delta * alpha;
}

export const PlayerController = () => {
  const {
    playerRadius,
    driveTorque,
    steeringRate,
    bodySettleY,
    mass,
    friction,
    restitution,
    linearDamping,
    angularDamping,
    steeringLerp,
  } = useControls("Vehicle Physics", {
    Drive: folder({
      playerRadius: { value: 0.5, min: 0.1, max: 2, step: 0.05 },
      driveTorque: { value: 150, min: 10, max: 500, step: 5 },
      steeringRate: { value: 3, min: 0.5, max: 10, step: 0.1 },
      steeringLerp: { value: 4, min: 1, max: 20, step: 0.5 },
    }),
    Body: folder({
      bodySettleY: { value: 0.4, min: -1, max: 2, step: 0.05 },
      mass: { value: 1000, min: 100, max: 5000, step: 50 },
      friction: { value: 1, min: 0, max: 3, step: 0.1 },
      restitution: { value: 0, min: 0, max: 1, step: 0.05 },
      linearDamping: { value: 0.1, min: 0, max: 5, step: 0.05 },
      angularDamping: { value: 4, min: 0, max: 20, step: 0.5 },
    }),
  });

  const playerRef = useRef<Object3D>(null!);
  const vehicleAlignRef = useRef<Object3D>(null!);
  const vehicleYawRef = useRef<Object3D>(null!);
  const vehicleBodyRef = useRef<Mesh>(null!);
  const wheelFrontLeftRef = useRef<Mesh>(null!);
  const wheelFrontRightRef = useRef<Mesh>(null!);
  const wheelBackLeftRef = useRef<Mesh>(null!);
  const wheelBackRightRef = useRef<Mesh>(null!);
  const cameraTargetRef = useRef<Object3D>(null!);
  const bodyRef = useRef<PhysicsBody | null>(null);
  const shapeRef = useRef<unknown>(null);

  const inputRef = useRef(new Vector3());
  const accelerationRef = useRef(0);
  const angularSpeedRef = useRef(0);
  const linearSpeedRef = useRef(0);
  const yawRef = useRef(0);
  const wheelSpinRef = useRef(0);
  const wheelSteerRef = useRef(0);
  const [, getKeys] = useKeyboardControls<Controls>();
  const { emit } = useVFXEmitter("smoke");
  const engine = usePhysics();

  useEffect(() => {
    retainVehicleAudio();

    const sphereShape = engine.createSphere({ radius: playerRadius });
    shapeRef.current = sphereShape;
    const sphere = engine.createDynamicBody({
      shape: sphereShape,
      position: [0, -9, 0], // ← 트랙 Y(-11) 기준 위로 조정
      friction,
      restitution,
      mass,
      linearDamping,
      angularDamping,
    });

    bodyRef.current = sphere;

    return () => {
      bodyRef.current = null;
      shapeRef.current = null;
      releaseVehicleAudio();
      engine.destroyBody(sphere);
      engine.destroyShape(sphereShape);
    };
  }, [
    engine,
    playerRadius,
    mass,
    friction,
    restitution,
    linearDamping,
    angularDamping,
  ]);

  const handleInput = (delta: number) => {
    const body = bodyRef.current;
    const yawGroup = vehicleYawRef.current;

    if (!body || !yawGroup) {
      return;
    }

    const { forward, backward, left, right } = getKeys();
    inputRef.current.x = Number(right) - Number(left);
    inputRef.current.z = Number(forward) - Number(backward);

    yawGroup.getWorldQuaternion(wheelCombinedQuaternion);
    rollAxis.copy(RIGHT).applyQuaternion(wheelCombinedQuaternion).normalize();

    body.addAngularVelocity(
      rollAxis.x * linearSpeedRef.current * driveTorque * delta,
      rollAxis.y * linearSpeedRef.current * driveTorque * delta,
      rollAxis.z * linearSpeedRef.current * driveTorque * delta,
    );
  };

  const effectBody = (delta: number) => {
    const bodyMesh = vehicleBodyRef.current;

    if (!bodyMesh) {
      return;
    }

    bodyMesh.rotation.x = lerpAngle(
      bodyMesh.rotation.x,
      -(linearSpeedRef.current - accelerationRef.current) / 6,
      delta * 10,
    );
    bodyMesh.rotation.z = lerpAngle(
      bodyMesh.rotation.z,
      -(inputRef.current.x / 5) * linearSpeedRef.current,
      delta * 5,
    );
    bodyMesh.position.y = MathUtils.lerp(
      bodyMesh.position.y,
      bodySettleY,
      delta * 5,
    );
  };

  const effectWheels = (delta: number) => {
    wheelSpinRef.current -= accelerationRef.current;
    wheelSteerRef.current = lerpAngle(
      wheelSteerRef.current,
      -inputRef.current.x / 1.5,
      delta * 10,
    );

    wheelSpinQuaternion.setFromAxisAngle(RIGHT, wheelSpinRef.current);

    for (const wheel of [wheelBackLeftRef.current, wheelBackRightRef.current]) {
      if (wheel) {
        wheel.quaternion.copy(wheelSpinQuaternion);
      }
    }

    wheelSteerQuaternion.setFromAxisAngle(UP, wheelSteerRef.current);
    wheelCombinedQuaternion
      .copy(wheelSteerQuaternion)
      .multiply(wheelSpinQuaternion);

    for (const wheel of [
      wheelFrontLeftRef.current,
      wheelFrontRightRef.current,
    ]) {
      if (wheel) {
        wheel.quaternion.copy(wheelCombinedQuaternion);
      }
    }
  };

  const updateSteering = (delta: number, vehicleYaw: Object3D) => {
    const direction =
      Math.sign(linearSpeedRef.current) ||
      (Math.abs(inputRef.current.z) > 0.1 ? Math.sign(inputRef.current.z) : 1);
    const steeringGrip = MathUtils.clamp(
      Math.abs(linearSpeedRef.current),
      0.2,
      1,
    );
    const targetAngular =
      -inputRef.current.x * steeringGrip * steeringRate * direction;

    angularSpeedRef.current = MathUtils.lerp(
      angularSpeedRef.current,
      targetAngular,
      delta * steeringLerp,
    );
    yawRef.current += angularSpeedRef.current * delta;
    vehicleYaw.rotation.y = yawRef.current;
  };

  const updateSpeed = (delta: number, body: PhysicsBody) => {
    const targetSpeed = inputRef.current.z;
    if (targetSpeed < 0 && linearSpeedRef.current > 0.01) {
      linearSpeedRef.current = MathUtils.lerp(
        linearSpeedRef.current,
        0,
        delta * 8,
      );
    } else if (targetSpeed < 0) {
      linearSpeedRef.current = MathUtils.lerp(
        linearSpeedRef.current,
        targetSpeed / 2,
        delta * 2,
      );
    } else {
      linearSpeedRef.current = MathUtils.lerp(
        linearSpeedRef.current,
        targetSpeed,
        delta * 6,
      );
    }

    const av = body.getAngularVelocity();
    const angularVelocityMagnitude = Math.sqrt(
      av.x * av.x + av.y * av.y + av.z * av.z,
    );

    accelerationRef.current = MathUtils.lerp(
      accelerationRef.current,
      linearSpeedRef.current +
        Math.abs(angularVelocityMagnitude * linearSpeedRef.current) / 100,
      delta,
    );

    if (
      Math.abs(inputRef.current.z) > 0.05 ||
      Math.abs(inputRef.current.x) > 0.05
    ) {
      body.wakeUp();
    }

    body.commit();
  };

  const getDriftIntensity = () =>
    Math.abs(linearSpeedRef.current - accelerationRef.current) +
    Math.abs(vehicleBodyRef.current?.rotation.z ?? 0) * 2;

  const effectAudio = (delta: number, driftIntensity: number) => {
    const speedFactor = MathUtils.clamp(Math.abs(linearSpeedRef.current), 0, 1);
    const throttleFactor = MathUtils.clamp(Math.abs(inputRef.current.z), 0, 1);

    updateVehicleEngine(speedFactor, throttleFactor, delta);
    updateVehicleSkid(driftIntensity, linearSpeedRef.current, delta);
  };

  const effectTrails = (driftIntensity: number) => {
    if (driftIntensity > 0.25) {
      for (const wheel of [
        wheelBackLeftRef.current,
        wheelBackRightRef.current,
      ]) {
        if (wheel) {
          wheel.getWorldPosition(_wheelWorldPos);
          emit([_wheelWorldPos.x, _wheelWorldPos.y, _wheelWorldPos.z], 1);
        }
      }
    }
  };

  const updateCamera = (camera: Camera, delta: number) => {
    cameraTargetRef.current.getWorldPosition(cameraTarget);
    camera.position.lerp(cameraTarget, delta * 4);
    camera.quaternion.copy(fixedCameraQuaternion);
  };

  useFrame(({ camera }, delta) => {
    const body = bodyRef.current;
    const player = playerRef.current;
    const vehicleYaw = vehicleYawRef.current;

    if (!body || !player || !vehicleYaw) {
      return;
    }

    handleInput(delta);
    updateSteering(delta, vehicleYaw);
    updateSpeed(delta, body);

    const pos = body.getPosition();
    player.position.set(pos.x, pos.y, pos.z);
    updateCamera(camera, delta);

    effectBody(delta);
    effectWheels(delta);

    const driftIntensity = getDriftIntensity();
    effectAudio(delta, driftIntensity);
    effectTrails(driftIntensity);
  });

  return (
    <group ref={playerRef}>
      <group ref={cameraTargetRef} position={CAMERA_OFFSET} />
      <group ref={vehicleAlignRef} position={[0, MODEL_OFFSET_Y, 0]}>
        <group ref={vehicleYawRef}>
          <Vehicle
            meshRefs={{
              body: vehicleBodyRef,
              wheelFrontLeft: wheelFrontLeftRef,
              wheelFrontRight: wheelFrontRightRef,
              wheelBackLeft: wheelBackLeftRef,
              wheelBackRight: wheelBackRightRef,
            }}
          />
        </group>
      </group>
    </group>
  );
};
