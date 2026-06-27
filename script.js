const revealItems = Array.from(
  document.querySelectorAll(".project, .lab-grid article, .timeline article, .publication-card, .team-card"),
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
  },
  {
    threshold: 0.18,
    rootMargin: "-8% 0px -8% 0px",
  },
);

revealItems.forEach((item) => revealObserver.observe(item));

let ticking = false;

function updateAmbientMotion() {
  const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = window.scrollY / scrollRange;
  const hero = document.querySelector(".hero");

  if (hero) {
    const heroStart = hero.offsetTop;
    const heroRange = Math.max(1, hero.offsetHeight * 0.82);
    const heroProgress = Math.min(1, Math.max(0, (window.scrollY - heroStart) / heroRange));
    document.documentElement.style.setProperty("--hero-progress", heroProgress.toFixed(4));
  }

  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  ticking = false;
}

function requestAmbientMotion() {
  if (!ticking) {
    window.requestAnimationFrame(updateAmbientMotion);
    ticking = true;
  }
}

window.addEventListener("scroll", requestAmbientMotion, { passive: true });
window.addEventListener("resize", requestAmbientMotion);
updateAmbientMotion();

function drawRoughCountries(ctx, project) {
  const polygon = (points, fill, stroke = "rgba(59, 86, 88, 0.35)", width = 2) => {
    ctx.beginPath();
    points.forEach(([lon, lat], index) => {
      const [x, y] = project(lon, lat);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  const land = "rgba(210, 190, 143, 0.72)";
  const highlight = "rgba(184, 137, 58, 0.72)";
  const tealLand = "rgba(88, 167, 159, 0.48)";

  polygon([[-168, 72], [-138, 70], [-122, 55], [-126, 36], [-112, 26], [-94, 18], [-80, 25], [-70, 44], [-52, 54], [-68, 66], [-100, 72]], land);
  polygon([[-124, 49], [-67, 47], [-66, 28], [-82, 25], [-98, 25], [-106, 31], [-117, 33], [-124, 41]], highlight, "rgba(184, 137, 58, 0.62)", 3);
  polygon([[-82, 12], [-72, 8], [-64, -8], [-70, -28], [-62, -42], [-74, -54], [-82, -38], [-76, -16]], land);
  polygon([[-18, 36], [10, 36], [28, 32], [34, 10], [46, -20], [28, -35], [10, -34], [-6, -12], [-14, 12]], land);
  polygon([[-10, 58], [20, 60], [42, 48], [32, 38], [12, 42], [-4, 44]], land);
  polygon([[38, 58], [82, 58], [118, 50], [138, 34], [134, 18], [106, 8], [86, 20], [66, 24], [52, 36]], land);
  polygon([[68, 31], [78, 31], [88, 22], [82, 8], [74, 12], [70, 22]], highlight, "rgba(184, 137, 58, 0.68)", 3);
  polygon([[95, 22], [110, 18], [122, 8], [118, -6], [104, -2], [96, 10]], tealLand);
  polygon([[101.1, 1.8], [104.6, 1.8], [104.6, 0.2], [101.1, 0.2]], highlight, "rgba(184, 137, 58, 0.8)", 4);
  polygon([[112, -10], [154, -18], [150, -36], [128, -42], [112, -30]], land);
  polygon([[-48, 62], [-24, 72], [-18, 62], [-34, 56]], land);
}

function drawCountryGeometry(ctx, geometry, project, fill, stroke, width) {
  const drawRing = (ring) => {
    ctx.beginPath();
    ring.forEach(([lon, lat], index) => {
      const [x, y] = project(lon, lat);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  if (geometry.type === "Polygon") geometry.coordinates.forEach(drawRing);
  if (geometry.type === "MultiPolygon") geometry.coordinates.forEach((polygon) => polygon.forEach(drawRing));
}

async function buildWorldTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const project = (lon, lat) => [((lon + 180) / 360) * canvas.width, ((90 - lat) / 180) * canvas.height];

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f9fbf7");
  gradient.addColorStop(0.46, "#dff3f1");
  gradient.addColorStop(1, "#f6efe0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(14, 143, 139, 0.14)";
  ctx.lineWidth = 1;
  for (let lon = -150; lon <= 180; lon += 30) {
    const [x] = project(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  try {
    const [{ feature }, response] = await Promise.all([
      import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"),
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    ]);
    const world = await response.json();
    const countries = feature(world, world.objects.countries).features;
    const highlighted = new Set(["356", "840", "702"]);
    countries.forEach((country) => {
      const id = String(country.id).padStart(3, "0");
      const isHighlighted = highlighted.has(id);
      drawCountryGeometry(
        ctx,
        country.geometry,
        project,
        isHighlighted ? "rgba(184, 137, 58, 0.78)" : "rgba(210, 190, 143, 0.68)",
        isHighlighted ? "rgba(122, 85, 32, 0.72)" : "rgba(59, 86, 88, 0.28)",
        isHighlighted ? 2.4 : 0.9,
      );
    });
  } catch {
    drawRoughCountries(ctx, project);
  }

  return canvas;
}

async function initJourneyGlobe() {
  const globeTarget = document.querySelector("#journeyGlobe");
  if (!globeTarget) return;

  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 4.1);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    globeTarget.appendChild(renderer.domElement);

    const texture = new THREE.CanvasTexture(await buildWorldTexture());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1.52, 96, 96),
      new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.78,
        metalness: 0.02,
        clearcoat: 0.22,
        clearcoatRoughness: 0.45,
      }),
    );
    globe.rotation.set(-0.12, 1.16, 0.05);
    scene.add(globe);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.57, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x8fd4cf,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      }),
    );
    scene.add(atmosphere);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd6c08e, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-2.5, 2.2, 3.8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8bd5d0, 1.2);
    rim.position.set(2.8, -1.4, 2.2);
    scene.add(rim);

    const resize = () => {
      const size = Math.max(240, globeTarget.clientWidth);
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = () => {
      if (!reduceMotion) globe.rotation.y += 0.0018;
      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    };
    animate();
  } catch {
    globeTarget.classList.add("is-fallback");
  }
}

initJourneyGlobe();
