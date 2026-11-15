import { ArcRotateCamera, TargetCamera, Vector3 } from '@babylonjs/core';

/** Short editorial camera impulse, not a sound/pressure wave travelling through vacuum. */
export class FailureCameraShake {
  private camera?: TargetCamera;
  private time = 0;
  private position = Vector3.Zero();
  private target = Vector3.Zero();
  private velocity = Vector3.Zero();
  private right = Vector3.Right();
  private up = Vector3.Up();
  private amplitude = 0;

  start(camera: TargetCamera, velocity = Vector3.Zero(), reduced = false): void {
    this.camera = camera; this.time = 0;
    this.position.copyFrom(camera.position); this.target.copyFrom(camera.getTarget());
    this.velocity.copyFrom(velocity);
    const forward = this.target.subtract(this.position).normalize();
    this.right = Vector3.Cross(camera.upVector, forward).normalize();
    this.up = Vector3.Cross(forward, this.right).normalize();
    this.amplitude = reduced ? 0 : Vector3.Distance(this.position, this.target) * .008;
  }

  update(dt: number): void {
    if (!this.camera || dt <= 0) return;
    this.time += dt;
    const t = this.time, u = Math.min(1, t / 1.25);
    const envelope = this.amplitude * Math.min(1, t / .035) * (1 - u) ** 3;
    const x = envelope * (.7 * Math.sin(t * 66) + .3 * Math.sin(t * 107));
    const y = envelope * (.7 * Math.sin(t * 79 + .8) + .3 * Math.sin(t * 123));
    const offset = this.velocity.scale(Math.min(t, 6.5)).add(this.right.scale(x)).add(this.up.scale(y));
    this.camera.setTarget(this.target.add(offset));
    if (this.camera instanceof ArcRotateCamera) this.camera.setPosition(this.position.add(offset));
    else this.camera.position.copyFrom(this.position.add(offset));
  }
  reset(): void { this.camera = undefined; this.time = 0; }
}
