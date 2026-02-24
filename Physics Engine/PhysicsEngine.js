class Vector2 {
      constructor(x = 0, y = 0) {
           this.x = x;
           this.y = y;
      }
      set(x, y) {
           this.x = x;
           this.y = y;
           return this;
      }
      clone() {
           return new Vector2(this.x, this.y);
      }
      add(v) {
           this.x += v.x;
           this.y += v.y;
           return this;
      }
      subtract(v) {
           this.x -= v.x;
           this.y -= v.y;
           return this;
      }
      multiply(scalar) {
           this.x *= scalar;
           this.y *= scalar;
           return this;
      }
      divide(scalar) {
           if (scalar === 0) {
               console.warn("Division by 0 in Vector2.divide");
               return this.set(0, 0);
           }
           this.x /= scalar;
           this.y /= scalar;
           return this;
      }
      negate() {
           this.x = -this.x;
           this.y = -this.y;
           return this;
      }
      dot(v) {
           return this.x * v.x + this.y * v.y;
      }
      cross(v) {
           return this.x * v.y - this.y * v.x;
      }
      length() {
           return Math.sqrt(this.x * this.x + this.y * this.y);
      }
      lengthSq() {
           return this.x * this.x + this.y * this.y;
      }
      normalize() {
           const len = this.length();
           if (len > 1e-6) {
               this.divide(len);
           } else {
               this.set(0, 0);
           }
           return this;
      }
      rotate(angle) {
           const cos = Math.cos(angle);
           const sin = Math.sin(angle);
           const x = this.x * cos - this.y * sin;
           const y = this.x * sin + this.y * cos;
           this.x = x;
           this.y = y;
           return this;
      }
      static add(v1, v2) {
           return new Vector2(v1.x + v2.x, v1.y + v2.y);
      }
      static subtract(v1, v2) {
           return new Vector2(v1.x - v2.x, v1.y - v2.y);
      }
      static multiply(v, scalar) {
           return new Vector2(v.x * scalar, v.y * scalar);
      }
      static divide(v, scalar) {
           if (scalar === 0) return new Vector2(0, 0);
           return new Vector2(v.x / scalar, v.y / scalar);
      }
      static dot(v1, v2) {
           return v1.x * v2.x + v1.y * v2.y;
      }
      static cross(v1, v2) {
           return v1.x * v2.x - v1.y * v2.y;
      }
      static distance(v1, v2) {
           return Vector2.subtract(v1, v2).length();
      }
      static negate(v) {
           return new Vector2(-v.x, -v.y);
      }
      static zero() {
           return new Vector2(0, 0);
      }
      static fromAngle(angle, magnitude = 1) {
           return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
      }
}

class Matrix22 {
      constructor(c1x = 1, c1y = 0, c2x = 0, c2y = 1) {
          this.c1 = new Vector2(c1x, c1y);
          this.c2 = new Vector2(c2x, c2y);
      }
      static fromAngle(angle) {
          const c = Math.cos(angle);
          const s = Math.sin(angle);
          return new Matrix22(c, s, -s, c);
      }

      multiplyVector(v) {
          return new Vector2(this.c1.x * v.x + this.c2.x * v.y, this.c1.y * v.x + this.c2.y * v.y);
      }
      transpose() {
          return new Matrix22(this.c1.x, this.c2.x, this.c1.y, this.c2.y);
      }
}

class RigidBody {
      constructor(mass = 1, inertia = 1) {
          this.id = RigidBody.nextId++;
          this.position = new Vector2(0, 0);
          this.velocity = new Vector2(0, 0);
          this.force = new Vector2(0, 0);
          this.angle = 0;
          this.angularVelocity = 0;
          this.torque = 0;
          this.mass = Math.max(0.001, mass);
          this.invMass = 1 / this.mass;
          this.inertia = Math.max(0.001, inertia);
          this.invInertia = 1 / this.inertia;
          this.isStatic = (mass === 0);
          if (this.isStatic) {
              this.invMass = 0;
              this.invInertia = 0;
          }
          this.friction = 0.6;
          this.restitution = 0.2;
          this.linearDamping = 0.98;
          this.angularDamping = 0.98;
          this.awake = true;
      }

      static nextId = 0;
      applyForce(f) {
          if (this.isStatic) return;
          this.force.add(f);
          this.awake = true;
      }
      applyForceAtPoint(f, point) {
          if (this.isStatic) return;
          this.force.add(f);
          const r = Vector2.subtract(point, this.position);
          this.torque += r.cross(f);
          this.awake = true;
      }
      applyImpulse(impulse) {
          if (this.isStatic) return;
          this.velocity.add(Vector2.multiply(impulse, this.invMass));
          this.awake = true;
      }
      applyImpulseAtPoint(impulse, point) {
          if (this.isStatic) return;
          this.velocity.add(Vector2.multiply(impulse, this.invMass));
          const r = Vector2.subtract(point, this.position);
          this.angularVelocity += r.cross(impulse) * this.invInertia;
          this.awake = true;
      }
      integrate(deltaTime) {
          if (this.isStatic || !this.awake) {
              this.velocity.set(0, 0);
              this.angularVelocity = 0;
              this.force.set(0, 0);
              this.torque = 0;
              return;
          }
          const linearAcceleration = Vector2.multiply(this.force, this.invMass);
          this.velocity.add(Vector2.multiply(linearAcceleration, deltaTime));
          this.velocity.multiply(this.linearDamping);
          this.position.add(Vector2.multiply(this.velocity, deltaTime));
          this.force.set(0, 0);
          const angularAcceleration = this.torque * this.invInertia;
          this.angularVelocity += angularAcceleration * deltaTime;
          this.angularVelocity *= this.angularDamping;
          this.angle += this.angularVelocity * deltaTime;
          this.torque = 0;
      }
}

class CollisionInfo {
      constructor() {
          this.bodyA = null;
          this.bodyB = null;
          this.normal = Vector2.zero();
          this.depth = 0;
          this.contacts = [];
          this.restitution = 0;
          this.friction = 0;
          this.invMassSum = 0;
      }
      flip() {
          [this.bodyA, this.bodyB] = [this.bodyB, this.bodyA];
          this.normal.negate();
      }
      prepare() {
          this.restitution = Math.min(this.bodyA.restitution, this.bodyB.restitution);
          this.friction = Math.sqrt(this.bodyA.friction * this.bodyB.friction);
          this.invMassSum = this.bodyA.invMass + this.bodyB.invMass;
      }
}

class MathUtils {
      static clamp(value, min, max) {
           return Math.max(min, Math.min(value, max));
      }
      static map(value, inMin, inMax, outMin, outMax) {
           return (value - inMin) * (outMax - outMin) / (inMax - inMin);
      }
      static project(vertices, axis) {
           let min = Vector2.dot(vertices[0], axis);
           let max = min;
           for (let i = 1; i < vertices.length; i++) {
                const p = Vector2.dot(vertices[i], axis);
                if (p < min) {
                    min = p;
                } else if (p > max) {
                    max = p;
                }
           }
           return { min, max };
      }
      static overlap(min1, max1, min2, max2) {
           const overlap = Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
           if (overlap > 0) {
               const center1 = (min1 + max1) / 2;
               const center2 = (min2 + max2) / 2;
               const sign = (center1 < center2) ? 1 : -1;
               return { overlap, sign };
           }
           return { overlap: 0, sign: 0 };
      }
      static closestPointOnSegment(p, a, b) {
           const ab = Vector2.subtract(b, a);
           const t = Vector2.dot(Vector2.subtract(p, a), ab) / ab.lengthSq();
           const clampedT = MathUtils.clamp(t, 0, 1);
           return Vector2.add(a, Vector2.multiply(ab, clampedT));
      }
}