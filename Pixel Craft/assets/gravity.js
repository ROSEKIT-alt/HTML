import { G_CONSTANT } from './blocks_color.js';

export function applyPhysics(entity, dt, blocks) {
    entity.vy += G_CONSTANT * dt;

    let nextY = entity.y + entity.vy * dt;
    let nextX = entity.x + entity.vx * dt;

    entity.grounded = false;

    for (const block of blocks) {
         if (checkCollision(nextX, nextY, entity.w, entity.h, block)) {
             if (entity.y + entity.h <= block.y) {
                 nextY = block.y - entity.h;
                 entity.vy = 0;
                 entity.grounded = true;
             } else if (entity.y >= block.y + block.size) {
                 nextY = block.y + block.size;
                 entity.vy = 0;
             }
         }
    }

    if (nextY + entity.h > window.innerHeight) {
        nextY = window.innerHeight - entity.h;
        entity.vy = 0;
        entity.grounded = true;
    }

    entity.x = nextX;
    entity.y = nextY;
    entity.vx *= 0.6;
}

function checkCollision(x, y, w, h, block) {
   return x < block.x + block.size &&
          x + w > block.x &&
          y < block.y + block.size &&
          y + h > block.y;
}