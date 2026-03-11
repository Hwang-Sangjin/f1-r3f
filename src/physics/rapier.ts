import RAPIER from "@dimforge/rapier3d-compat";
import type * as THREE from "three";
import type { PhysicsBody, PhysicsEngine, PhysicsShape } from "./types";

class RapierBody implements PhysicsBody {
  constructor(
    private world: RAPIER.World,
    public raw: RAPIER.RigidBody,
  ) {}

  getPosition() {
    const t = this.raw.translation();
    return { x: t.x, y: t.y, z: t.z };
  }

  getAngularVelocity() {
    const av = this.raw.angvel();
    return { x: av.x, y: av.y, z: av.z };
  }

  addAngularVelocity(dx: number, dy: number, dz: number) {
    const av = this.raw.angvel();
    this.raw.setAngvel(
      { x: av.x + dx, y: av.y + dy, z: av.z + dz },
      true,
    );
  }

  wakeUp() {
    this.raw.wakeUp();
  }

  commit() {
    // No-op: rapier applies velocity changes immediately
  }
}

export class RapierEngine implements PhysicsEngine {
  private world: RAPIER.World;
  private bodyColliders = new Map<RAPIER.RigidBody, RAPIER.Collider>();

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -15, z: 0 });
  }

  static async init() {
    await RAPIER.init();
  }

  step(delta: number) {
    this.world.timestep = delta;
    this.world.step();
  }

  createSphere(opts: { radius: number }): PhysicsShape {
    return RAPIER.ColliderDesc.ball(opts.radius);
  }

  createBox(opts: {
    width: number;
    height: number;
    depth: number;
  }): PhysicsShape {
    return RAPIER.ColliderDesc.cuboid(
      opts.width / 2,
      opts.height / 2,
      opts.depth / 2,
    );
  }

  createTriangleMeshFromGeometry(
    geometry: THREE.BufferGeometry,
  ): PhysicsShape {
    const positionAttribute = geometry.getAttribute("position");
    if (!positionAttribute || positionAttribute.itemSize < 3) {
      throw new Error("Triangle mesh requires a position attribute with XYZ data.");
    }

    const vertices = new Float32Array(positionAttribute.array);
    const indices = geometry.index
      ? new Uint32Array(geometry.index.array)
      : Uint32Array.from({ length: positionAttribute.count }, (_, i) => i);

    return RAPIER.ColliderDesc.trimesh(vertices, indices);
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
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(opts.position[0], opts.position[1], opts.position[2])
      .setLinearDamping(opts.linearDamping)
      .setAngularDamping(opts.angularDamping);

    const body = this.world.createRigidBody(bodyDesc);

    const colliderDesc = (opts.shape as RAPIER.ColliderDesc)
      .setFriction(opts.friction)
      .setRestitution(opts.restitution)
      .setMass(opts.mass);

    const collider = this.world.createCollider(colliderDesc, body);
    this.bodyColliders.set(body, collider);

    return new RapierBody(this.world, body);
  }

  createStaticBody(opts: {
    shape: PhysicsShape;
    position?: { x: number; y: number; z: number };
    orientation?: { x: number; y: number; z: number; w: number };
    friction?: number;
    restitution?: number;
  }): PhysicsBody {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed();

    if (opts.position) {
      bodyDesc.setTranslation(opts.position.x, opts.position.y, opts.position.z);
    }
    if (opts.orientation) {
      bodyDesc.setRotation(opts.orientation);
    }

    const body = this.world.createRigidBody(bodyDesc);

    let colliderDesc = opts.shape as RAPIER.ColliderDesc;
    if (opts.friction !== undefined) {
      colliderDesc = colliderDesc.setFriction(opts.friction);
    }
    if (opts.restitution !== undefined) {
      colliderDesc = colliderDesc.setRestitution(opts.restitution);
    }

    const collider = this.world.createCollider(colliderDesc, body);
    this.bodyColliders.set(body, collider);

    return new RapierBody(this.world, body);
  }

  destroyBody(body: PhysicsBody) {
    const raw = (body as RapierBody).raw;
    this.bodyColliders.delete(raw);
    this.world.removeRigidBody(raw);
  }

  destroyShape(_shape: PhysicsShape) {
    // Collider descs are plain objects, no cleanup needed
  }

  destroy() {
    this.world.free();
  }
}
