(() => {
  "use strict";

  const canvas = document.getElementById("hearts-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const COLORS = [
    "#ff2e63",
    "#ff4d8d",
    "#ff7eb3",
    "#ffb3c7",
    "#ffd1dc",
    "#ffffff"
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let hearts = [];
  let lastTime = 0;
  let rafId = null;
  let resizeTimer = null;

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function drawHeart(x, y, size) {
    const topCurveHeight = size * 0.3;

    ctx.beginPath();
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(
      x,
      y,
      x - size / 2,
      y,
      x - size / 2,
      y + topCurveHeight
    );
    ctx.bezierCurveTo(
      x - size / 2,
      y + (size + topCurveHeight) / 2,
      x,
      y + (size + topCurveHeight) / 2,
      x,
      y + size
    );
    ctx.bezierCurveTo(
      x,
      y + (size + topCurveHeight) / 2,
      x + size / 2,
      y + (size + topCurveHeight) / 2,
      x + size / 2,
      y + topCurveHeight
    );
    ctx.bezierCurveTo(
      x + size / 2,
      y,
      x,
      y,
      x,
      y + topCurveHeight
    );
    ctx.closePath();
    ctx.fill();
  }

  class Heart {
    constructor(initial = false) {
      this.reset(initial);
    }

    reset(initial = false) {
      this.x = rand(0, width);
      this.y = initial ? rand(0, height) : height + rand(10, 140);
      this.size = rand(7, 26);
      this.speed = rand(18, 70);
      this.sway = rand(0.5, 1.8);
      this.phase = rand(0, Math.PI * 2);
      this.alpha = rand(0.18, 0.78);
      this.color = pick(COLORS);
      this.rotation = rand(-0.35, 0.35);
      this.spin = rand(-0.25, 0.25);
    }

    update(dt) {
      this.y -= this.speed * dt;
      this.phase += this.sway * dt;
      this.x += Math.sin(this.phase) * 18 * dt;
      this.rotation += this.spin * dt;

      if (
        this.y < -this.size * 2 ||
        this.x < -80 ||
        this.x > width + 80
      ) {
        this.reset(false);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      drawHeart(0, 0, this.size);
      ctx.restore();
    }
  }

  function getTargetCount() {
    const area = width * height;
    return Math.round(Math.min(240, Math.max(80, area / 9000)));
  }

  function initHearts() {
    hearts = Array.from({ length: getTargetCount() }, () => new Heart(true));
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    hearts.forEach((heart) => heart.draw());
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initHearts();

    if (reduceMotion.matches) {
      drawStatic();
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);

    for (const heart of hearts) {
      heart.update(dt);
      heart.draw();
    }

    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function start() {
    if (reduceMotion.matches) {
      drawStatic();
      return;
    }

    stop();
    lastTime = 0;
    rafId = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      start();
    }, 150);
  });

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", () => {
      stop();
      resize();
      start();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  resize();
  start();
})();
