import type * as THREE from "three";

export interface PhysicsBody {
  getPosition(): { x: number; y: number; z: number };
  getAngularVelocity(): { x: number; y: number; z: number };
  addAngularVelocity(dx: number, dy: number, dz: number): void;
  wakeUp(): void;
  commit(): void;
}

export type PhysicsShape = unknown;

export interface PhysicsEngine {
  step(delta: number): void;
  createSphere(opts: { radius: number }): PhysicsShape;
  createBox(opts: {
    width: number;
    height: number;
    depth: number;
  }): PhysicsShape;
  createTriangleMeshFromGeometry(geometry: THREE.BufferGeometry): PhysicsShape;
  createDynamicBody(opts: {
    shape: PhysicsShape;
    position: [number, number, number];
    friction: number;
    restitution: number;
    mass: number;
    linearDamping: number;
    angularDamping: number;
  }): PhysicsBody;
  createStaticBody(opts: {
    shape: PhysicsShape;
    position?: { x: number; y: number; z: number };
    orientation?: { x: number; y: number; z: number; w: number };
    friction?: number;
    restitution?: number;
  }): PhysicsBody;
  destroyBody(body: PhysicsBody): void;
  destroyShape(shape: PhysicsShape): void;
  destroy(): void;
}

export type PhysicsBackend = "bounce" | "crashcat" | "rapier";
