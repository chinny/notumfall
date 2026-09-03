import * as THREE from 'three';
import { Capsule, clamp } from '../core/math';
import { PhysicsWorld } from '../physics/collider';

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  crouch: boolean;
  jump: boolean;
  deltaPitch: number;
  deltaYaw: number;
}

export class PlayerController {
  public position: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public yaw: number = 0;
  public pitch: number = 0;

  public isGrounded: boolean = false;
  public isCrouching: boolean = false;
  public isSprinting: boolean = false;

  public walkSpeed: number = 5.0;
  public sprintSpeed: number = 8.5;
  public crouchSpeed: number = 2.5;
  public jumpSpeed: number = 6.0;
  public gravity: number = 18.0;

  public standingHeight: number = 1.8;
  public crouchingHeight: number = 1.1;
  public radius: number = 0.35;
  public eyeOffsetStanding: number = 1.65;
  public eyeOffsetCrouching: number = 0.95;

  public mouseSensitivity: number = 0.0022;

  public capsule: Capsule = {
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
    radius: 0.35
  };

  constructor(public physics: PhysicsWorld, spawnPosition?: THREE.Vector3) {
    if (spawnPosition) {
      this.position.copy(spawnPosition);
    }
    this.updateCapsule();
  }

  public updateCapsule() {
    const h = this.isCrouching ? this.crouchingHeight : this.standingHeight;
    this.capsule.radius = this.radius;
    this.capsule.start.set(this.position.x, this.position.y + this.radius, this.position.z);
    this.capsule.end.set(this.position.x, this.position.y + h - this.radius, this.position.z);
  }

  public getCameraPosition(out?: THREE.Vector3): THREE.Vector3 {
    const target = out || new THREE.Vector3();
    const eyeH = this.isCrouching ? this.eyeOffsetCrouching : this.eyeOffsetStanding;
    return target.set(this.position.x, this.position.y + eyeH, this.position.z);
  }

  public getLookDirection(out?: THREE.Vector3): THREE.Vector3 {
    const target = out || new THREE.Vector3();
    const cosPitch = Math.cos(this.pitch);
    target.set(
      -Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosPitch
    ).normalize();
    return target;
  }

  public update(dt: number, input: PlayerInput) {
    if (dt <= 0) return;
    dt = Math.min(dt, 0.1); // Clamp large delta time

    // Look rotation
    this.yaw -= input.deltaYaw * this.mouseSensitivity;
    this.pitch -= input.deltaPitch * this.mouseSensitivity;
    this.pitch = clamp(this.pitch, -THREE.MathUtils.degToRad(85), THREE.MathUtils.degToRad(85));

    // Stance
    this.isCrouching = input.crouch;
    this.isSprinting = input.sprint && !this.isCrouching && (input.forward || input.left || input.right);

    // Speed calculation
    let currentSpeed = this.walkSpeed;
    if (this.isCrouching) {
      currentSpeed = this.crouchSpeed;
    } else if (this.isSprinting) {
      currentSpeed = this.sprintSpeed;
    }

    // Input movement vector in local space
    const moveZ = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
    const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    const wishDir = new THREE.Vector3();
    if (moveX !== 0 || moveZ !== 0) {
      const sinY = Math.sin(this.yaw);
      const cosY = Math.cos(this.yaw);
      // Forward direction: (-sinY, 0, -cosY)
      // Right direction: (cosY, 0, -sinY)
      wishDir.x = -sinY * moveZ + cosY * moveX;
      wishDir.z = -cosY * moveZ - sinY * moveX;
      wishDir.normalize();
    }

    // Accelerate horizontal velocity
    const targetVx = wishDir.x * currentSpeed;
    const targetVz = wishDir.z * currentSpeed;
    const accelRate = this.isGrounded ? 15.0 : 4.0;
    this.velocity.x += (targetVx - this.velocity.x) * Math.min(1, accelRate * dt);
    this.velocity.z += (targetVz - this.velocity.z) * Math.min(1, accelRate * dt);

    // Jump
    if (input.jump && this.isGrounded && !this.isCrouching) {
      this.velocity.y = this.jumpSpeed;
      this.isGrounded = false;
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // Substepping for rock-solid collision
    const subSteps = 3;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.position.x += this.velocity.x * subDt;
      this.position.y += this.velocity.y * subDt;
      this.position.z += this.velocity.z * subDt;

      this.updateCapsule();

      const res = this.physics.resolveCapsule(this.capsule, this.velocity, true);
      this.isGrounded = res.grounded;

      // Extract new foot position from resolved capsule
      this.position.x = this.capsule.start.x;
      this.position.y = this.capsule.start.y - this.radius;
      this.position.z = this.capsule.start.z;
    }
  }
}
