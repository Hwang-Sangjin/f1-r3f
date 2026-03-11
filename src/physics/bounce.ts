import { World } from "@perplexdotgg/bounce";
import type {
  Body,
  DynamicShape,
  Shape,
  StaticShape,
} from "@perplexdotgg/bounce";
import type * as THREE from "three";
import type { PhysicsBody, PhysicsEngine, PhysicsShape } from "./types";

class BounceBody implements PhysicsBody {
  public raw: Body;

  constructor(raw: Body) {
    this.raw = raw;
  }

  getPosition() {
    return this.raw.position;
  }

  getAngularVelocity() {
    return this.raw.angularVelocity;
  }

  addAngularVelocity(dx: number, dy: number, dz: number) {
    this.raw.angularVelocity.x += dx;
    this.raw.angularVelocity.y += dy;
    this.raw.angularVelocity.z += dz;
  }

  wakeUp() {
    this.raw.wakeUp();
  }

  commit() {
    this.raw.commitChanges();
  }
}

export class BounceEngine implements PhysicsEngine {
  private world: World;

  constructor() {
    this.world = new World({ gravity: { x: 0, y: -15, z: 0 } });
  }

  step(delta: number) {
    this.world.takeOneStep(delta);
  }

  createSphere(opts: { radius: number }): PhysicsShape {
    return this.world.createSphere(opts);
  }

  createBox(opts: {
    width: number;
    height: number;
    depth: number;
  }): PhysicsShape {
    return this.world.createBox(opts);
  }

  createTriangleMeshFromGeometry(geometry: THREE.BufferGeometry): PhysicsShape {
    const positionAttribute = geometry.getAttribute("position");
    if (!positionAttribute || positionAttribute.itemSize < 3) {
      throw new Error(
        "Triangle mesh requires a position attribute with XYZ data.",
      );
    }

    const vertexPositions = new Float32Array(positionAttribute.array);
    const faceIndices = geometry.index
      ? Uint32Array.from(geometry.index.array, Number)
      : Uint32Array.from({ length: positionAttribute.count }, (_, i) => i);

    return this.world.createTriangleMesh({ vertexPositions, faceIndices });
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
    const body = this.world.createDynamicBody({
      shape: opts.shape as DynamicShape,
      position: opts.position,
      friction: opts.friction,
      restitution: opts.restitution,
      mass: opts.mass,
      linearDamping: opts.linearDamping,
      angularDamping: opts.angularDamping,
    });
    return new BounceBody(body);
  }

  createStaticBody(opts: {
    shape: PhysicsShape;
    position?: { x: number; y: number; z: number };
    orientation?: { x: number; y: number; z: number; w: number };
    friction?: number;
    restitution?: number;
  }): PhysicsBody {
    const body = this.world.createStaticBody({
      shape: opts.shape as StaticShape,
      position: opts.position,
      orientation: opts.orientation,
      friction: opts.friction,
      restitution: opts.restitution,
    });
    return new BounceBody(body);
  }

  destroyBody(_body: PhysicsBody) {
    // Bounce doesn't have explicit body removal, shapes handle cleanup
  }

  destroyShape(shape: PhysicsShape) {
    this.world.destroyShape(shape as Shape);
  }

  destroy() {
    // World will be GC'd
  }
}
