import {
  registerAll,
  createWorldSettings,
  createWorld,
  addBroadphaseLayer,
  addObjectLayer,
  enableCollision,
  updateWorld,
  sphere,
  box,
  triangleMesh,
  rigidBody,
  MotionType,
} from "crashcat";
import type { World, RigidBody } from "crashcat";
import type * as THREE from "three";
import type { PhysicsBody, PhysicsEngine, PhysicsShape } from "./types";

class CrashcatBody implements PhysicsBody {
  constructor(
    private world: World,
    public raw: RigidBody,
  ) {}

  getPosition() {
    const p = this.raw.position;
    return { x: p[0], y: p[1], z: p[2] };
  }

  getAngularVelocity() {
    const av = this.raw.motionProperties.angularVelocity;
    return { x: av[0], y: av[1], z: av[2] };
  }

  addAngularVelocity(dx: number, dy: number, dz: number) {
    rigidBody.addAngularVelocity(this.world, this.raw, [dx, dy, dz]);
  }

  wakeUp() {
    rigidBody.wake(this.world, this.raw);
  }

  commit() {
    // No-op: crashcat applies velocity changes immediately
  }
}

let registered = false;

export class CrashcatEngine implements PhysicsEngine {
  private world: World;
  private layerMoving: number;
  private layerStatic: number;

  constructor() {
    if (!registered) {
      registerAll();
      registered = true;
    }

    const settings = createWorldSettings();
    settings.gravity = [0, -15, 0];

    const bpMoving = addBroadphaseLayer(settings);
    const bpStatic = addBroadphaseLayer(settings);

    this.layerMoving = addObjectLayer(settings, bpMoving);
    this.layerStatic = addObjectLayer(settings, bpStatic);

    enableCollision(settings, this.layerMoving, this.layerStatic);
    enableCollision(settings, this.layerMoving, this.layerMoving);

    this.world = createWorld(settings);
  }

  step(delta: number) {
    updateWorld(this.world, undefined, delta);
  }

  createSphere(opts: { radius: number }): PhysicsShape {
    return sphere.create({ radius: opts.radius });
  }

  createBox(opts: {
    width: number;
    height: number;
    depth: number;
  }): PhysicsShape {
    return box.create({
      halfExtents: [opts.width / 2, opts.height / 2, opts.depth / 2],
    });
  }

  createTriangleMeshFromGeometry(
    geometry: THREE.BufferGeometry,
  ): PhysicsShape {
    const positionAttribute = geometry.getAttribute("position");
    if (!positionAttribute || positionAttribute.itemSize < 3) {
      throw new Error("Triangle mesh requires a position attribute with XYZ data.");
    }

    const positions = Array.from(positionAttribute.array);
    const indices = geometry.index
      ? Array.from(geometry.index.array)
      : Array.from({ length: positionAttribute.count }, (_, i) => i);

    return triangleMesh.create({ positions, indices });
  }

  createDynamicBody(opts: {
    shape: PhysicsShape;
    position: [number, number, number];
    friction: number;
    restitution: number;
    mass: number;
    linearDamping: number;
    angularDamping: number;
  }): PhysicsBody {
    const body = rigidBody.create(this.world, {
      shape: opts.shape as any,
      motionType: MotionType.DYNAMIC,
      objectLayer: this.layerMoving,
      position: opts.position,
      friction: opts.friction,
      restitution: opts.restitution,
      mass: opts.mass,
      linearDamping: opts.linearDamping,
      angularDamping: opts.angularDamping,
    });
    return new CrashcatBody(this.world, body);
  }

  createStaticBody(opts: {
    shape: PhysicsShape;
    position?: { x: number; y: number; z: number };
    orientation?: { x: number; y: number; z: number; w: number };
    friction?: number;
    restitution?: number;
  }): PhysicsBody {
    const body = rigidBody.create(this.world, {
      shape: opts.shape as any,
      motionType: MotionType.STATIC,
      objectLayer: this.layerStatic,
      position: opts.position
        ? [opts.position.x, opts.position.y, opts.position.z]
        : undefined,
      quaternion: opts.orientation
        ? [
            opts.orientation.x,
            opts.orientation.y,
            opts.orientation.z,
            opts.orientation.w,
          ]
        : undefined,
      friction: opts.friction,
      restitution: opts.restitution,
    });
    return new CrashcatBody(this.world, body);
  }

  destroyBody(body: PhysicsBody) {
    rigidBody.remove(this.world, (body as CrashcatBody).raw);
  }

  destroyShape(_shape: PhysicsShape) {
    // Crashcat shapes are plain objects, no explicit cleanup needed
  }

  destroy() {
    // World will be GC'd
  }
}
