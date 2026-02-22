import { BLOCKS, BLOCK_SIZE } from './blocks_color.js';
import { input } from './keyboard_input.js';
import { applyPhysics } from './gravity.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
input.init();

const player = {
    x: 100,
    y: 100,
    w: 24,
    h: 24,
    vx: 0,
    vy: 0,
    speed: 1000,
    jump: -250,
    grounded: false
};

const world = [];

function update(dt) {
   if (input.isDown('KeyA') || input.isDown('ArrowLeft')) player.vx = -player.speed * dt;
   if (input.isDown('KeyD') || input.isDown('ArrowRight')) player.vx = player.speed * dt;

   if (input.isDown('Space') && player.grounded) {
       player.vy = player.jump;
   }

   applyPhysics(player, dt, world);
}

function draw() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);

   world.forEach(b => {
       ctx.fillStyle = b.color;
       ctx.fillRect(b.x, b.y, BLOCK_SIZE, BLOCK_SIZE);
       ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
       ctx.strokeRect(b.x, b.y, BLOCK_SIZE, BLOCK_SIZE);
   });

   ctx.fillStyle = "#ff0000";
   ctx.fillRect(player.x, player.y, player.w, player.h);
}

let lastTime = 0;
function loop(timestamp) {
   const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
   lastTime = timestamp;

   update(dt);
   draw();
   requestAnimationFrame(loop);
}

canvas.addEventListener("mousedown", e => {
   const gx = Math.floor(e.clientX / BLOCK_SIZE) * BLOCK_SIZE;
   const gy = Math.floor(e.clientY / BLOCK_SIZE) * BLOCK_SIZE;
   world.push({ x: gx, y: gy, size: BLOCK_SIZE, color: BLOCKS.STONE.color });
});

requestAnimationFrame(loop);