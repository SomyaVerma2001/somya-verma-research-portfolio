window.scrollTo(0, 0);

const html = document.documentElement;
const loader = document.querySelector(".loader");
const menu = document.querySelector(".menu-overlay");
const openMenu = document.querySelector("[data-open-menu]");
const closeMenu = document.querySelector("[data-close-menu]");

let lenis = {
  raf() {},
  start() {},
  stop() {},
};

const shouldUseSmoothScroll =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (shouldUseSmoothScroll) {
  import("https://cdn.jsdelivr.net/npm/lenis@1.1.18/+esm")
    .then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1,
      });
      if (document.body.classList.contains("is-locked")) lenis.stop();
      else lenis.start();
    })
    .catch(() => {});
}

function raf(time) {
  lenis.raf(time);
  window.requestAnimationFrame(raf);
}
window.requestAnimationFrame(raf);
lenis.stop();
document.body.classList.add("is-locked");

function splitWords(element) {
  const text = element.dataset.text || element.textContent.trim();
  element.textContent = "";
  text.split(" ").forEach((word, index) => {
    const clip = document.createElement("span");
    clip.className = "word-clip";
    const inner = document.createElement("span");
    inner.className = "word-inner";
    inner.textContent = word;
    inner.style.transitionDelay = `${index * 140}ms`;
    clip.append(inner);
    element.append(clip, document.createTextNode(" "));
  });
}

function splitLines(element) {
  const lines = (element.dataset.lines || element.textContent.trim()).split("|");
  element.textContent = "";
  lines.forEach((line, index) => {
    const clip = document.createElement("span");
    clip.className = "line-clip";
    const inner = document.createElement("span");
    inner.className = "line-inner";
    inner.innerHTML = line.replace("CO₂", "CO<sub>2</sub>");
    inner.style.transitionDelay = `${index * 120}ms`;
    clip.append(inner);
    element.append(clip);
    if (index < lines.length - 1) element.append(document.createElement("br"));
  });
}

document.querySelectorAll(".split-words").forEach(splitWords);
document.querySelectorAll(".split-lines").forEach(splitLines);

const revealItems = Array.from(document.querySelectorAll(".reveal, .project-row, .feature-card, .stats-grid div"));
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "-8% 0px -8% 0px" },
);
revealItems.forEach((item) => revealObserver.observe(item));

function unlockPage() {
  document.body.classList.remove("is-locked");
  document.body.classList.add("is-ready");
  lenis.start();
  loader?.classList.add("is-hidden");
  window.setTimeout(() => loader?.remove(), 900);
}

const loaderDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 200 : 1400;
if (document.readyState === "complete") window.setTimeout(unlockPage, loaderDelay);
else window.addEventListener("load", () => window.setTimeout(unlockPage, loaderDelay), { once: true });
window.setTimeout(() => {
  if (loader && document.body.classList.contains("is-locked")) unlockPage();
}, 2600);

function setMenu(open) {
  menu?.classList.toggle("is-open", open);
  menu?.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.classList.toggle("is-locked", open);
  if (open) lenis.stop();
  else lenis.start();
}

openMenu?.addEventListener("click", () => setMenu(true));
closeMenu?.addEventListener("click", () => setMenu(false));
menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

let ticking = false;

function updateAmbientMotion() {
  const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = window.scrollY / scrollRange;
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

async function initHeroScene() {
  const target = document.querySelector("#heroScene");
  const heroBg = document.querySelector(".hero-bg");
  if (!target || !heroBg) return;

  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce7f4);
    scene.fog = new THREE.Fog(0xdce7f4, 9, 24);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    camera.position.set(0.4, 1.25, 10.5);
    camera.lookAt(0.2, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    target.replaceChildren(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.y = -0.16;
    scene.add(group);

    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xf7fbff,
      metalness: 0,
      roughness: 0.08,
      transmission: 0.45,
      transparent: true,
      opacity: 0.34,
      thickness: 1.4,
      ior: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
    });
    const glassBlue = glass.clone();
    glassBlue.color = new THREE.Color(0xc9d9ed);
    glassBlue.opacity = 0.28;
    const liquid = new THREE.MeshPhysicalMaterial({
      color: 0xcaa86c,
      roughness: 0.24,
      metalness: 0,
      transparent: true,
      opacity: 0.64,
      transmission: 0.12,
    });
    const metal = new THREE.MeshStandardMaterial({ color: 0xbcc7d5, roughness: 0.22, metalness: 0.72 });
    const darkCap = new THREE.MeshStandardMaterial({ color: 0x17243a, roughness: 0.42, metalness: 0.28 });
    const pelletMat = new THREE.MeshStandardMaterial({ color: 0x253147, roughness: 0.68, metalness: 0.18 });
    const whiteAtom = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.28, metalness: 0.08 });
    const blueAtom = new THREE.MeshStandardMaterial({ color: 0x9fc8f4, roughness: 0.24, metalness: 0.08 });
    const oxygenAtom = new THREE.MeshStandardMaterial({ color: 0xc78991, roughness: 0.28, metalness: 0.08 });

    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-3, 8, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xf7fbff, 0x9fb0c8, 2.2));
    const rim = new THREE.PointLight(0x9bc7ff, 5.5, 20);
    rim.position.set(5, 2.5, 3);
    scene.add(rim);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(13, 0.12, 4.6), new THREE.MeshStandardMaterial({ color: 0xeaf0f8, roughness: 0.46 }));
    bench.position.set(0, -1.65, 0.8);
    bench.receiveShadow = true;
    group.add(bench);

    const panelMat = new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.62, transparent: true, opacity: 0.58 });
    for (let i = -2; i <= 2; i += 1) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 7, 0.04), panelMat);
      panel.position.set(i * 2.1, 1.2, -3.6);
      group.add(panel);
    }

    const reactor = new THREE.Group();
    reactor.position.set(4.45, 0.15, -0.65);
    const reactorGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 3.35, 64, 1, true), glass);
    reactorGlass.castShadow = true;
    reactor.add(reactorGlass);
    const reactorLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.65, 64), liquid);
    reactorLiquid.position.y = -0.74;
    reactor.add(reactorLiquid);
    [-1.6, -0.55, 0.55, 1.6].forEach((y) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 12, 72), metal);
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
      reactor.add(band);
    });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.16, 64), metal);
    lid.position.y = 1.78;
    reactor.add(lid);
    const base = lid.clone();
    base.position.y = -1.78;
    reactor.add(base);
    for (let i = 0; i < 78; i += 1) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.025 + Math.random() * 0.035, 12, 12), glassBlue);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.54;
      bubble.position.set(Math.cos(angle) * radius, -1.35 + Math.random() * 2.55, Math.sin(angle) * radius);
      reactor.add(bubble);
    }
    group.add(reactor);

    const makeTube = (x, z, height, radius, fill = 0.45) => {
      const tube = new THREE.Group();
      tube.position.set(x, -0.62, z);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 36, 1, true), glass);
      body.position.y = height / 2;
      tube.add(body);
      const bottom = new THREE.Mesh(new THREE.SphereGeometry(radius, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass);
      bottom.rotation.x = Math.PI;
      tube.add(bottom);
      const fluid = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, height * fill, 36), liquid);
      fluid.position.y = (height * fill) / 2 - 0.02;
      tube.add(fluid);
      tube.traverse((item) => {
        if (item.isMesh) item.castShadow = true;
      });
      group.add(tube);
      return tube;
    };
    [-5.15, -4.7, -4.25].forEach((x, i) => makeTube(x, 0.2 + i * 0.04, 2.1 + i * 0.12, 0.12, 0.38));

    const makeVial = (x, z, fill) => {
      const vial = new THREE.Group();
      vial.position.set(x, -1.12, z);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.31, 1.1, 44), glass);
      body.position.y = 0.55;
      vial.add(body);
      const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.62 * fill, 44), liquid);
      fluid.position.y = 0.18 + 0.31 * fill;
      vial.add(fluid);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.18, 44), darkCap);
      cap.position.y = 1.18;
      vial.add(cap);
      vial.traverse((item) => {
        if (item.isMesh) item.castShadow = true;
      });
      group.add(vial);
    };
    [-2.45, -1.55, -0.65, 0.25].forEach((x, i) => makeVial(x, 0.95 + Math.sin(i) * 0.08, 0.55 + i * 0.12));

    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.16, 64), new THREE.MeshStandardMaterial({ color: 0xd9e0e8, roughness: 0.38, metalness: 0.16 }));
    tray.position.set(1.4, -1.45, 1.25);
    group.add(tray);
    for (let i = 0; i < 120; i += 1) {
      const pellet = new THREE.Mesh(new THREE.SphereGeometry(0.045 + Math.random() * 0.035, 10, 8), pelletMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 0.73;
      pellet.position.set(1.4 + Math.cos(angle) * radius, -1.31 + Math.random() * 0.22, 1.25 + Math.sin(angle) * radius * 0.42);
      pellet.castShadow = true;
      group.add(pellet);
    }

    const cylinderBetween = (start, end, radius, material) => {
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const direction = new THREE.Vector3().subVectors(end, start);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 16), material);
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      return mesh;
    };

    const makeMolecule = (origin, scale = 1) => {
      const molecule = new THREE.Group();
      molecule.position.copy(origin);
      const atoms = [
        { p: [-0.9, 0, 0], m: oxygenAtom, r: 0.16 },
        { p: [-0.25, 0.35, 0.2], m: whiteAtom, r: 0.13 },
        { p: [0.35, -0.05, -0.1], m: blueAtom, r: 0.18 },
        { p: [0.95, 0.36, 0.18], m: whiteAtom, r: 0.13 },
        { p: [1.3, -0.25, -0.18], m: oxygenAtom, r: 0.16 },
      ];
      atoms.forEach(({ p, m, r }) => {
        const atom = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 24, 16), m);
        atom.position.set(p[0] * scale, p[1] * scale, p[2] * scale);
        atom.castShadow = true;
        molecule.add(atom);
      });
      [[0, 1], [1, 2], [2, 3], [2, 4]].forEach(([a, b]) => {
        const start = new THREE.Vector3(...atoms[a].p).multiplyScalar(scale);
        const end = new THREE.Vector3(...atoms[b].p).multiplyScalar(scale);
        molecule.add(cylinderBetween(start, end, 0.035 * scale, glassBlue));
      });
      group.add(molecule);
      return molecule;
    };
    const moleculeA = makeMolecule(new THREE.Vector3(-0.2, 1.35, -0.8), 1.15);
    moleculeA.rotation.set(0.3, -0.2, 0.05);
    const moleculeB = makeMolecule(new THREE.Vector3(2.6, 0.15, 0.15), 0.95);
    moleculeB.rotation.set(-0.2, 0.5, -0.05);

    const aircraft = new THREE.Group();
    aircraft.position.set(-4.75, -0.25, -2.7);
    aircraft.rotation.set(0.02, 0.65, 0);
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.3, 24), new THREE.MeshStandardMaterial({ color: 0xd6dee9, roughness: 0.38, metalness: 0.08 }));
    fuselage.rotation.z = Math.PI / 2;
    aircraft.add(fuselage);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.045, 0.34), fuselage.material);
    aircraft.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.035, 0.28), fuselage.material);
    tail.position.x = -0.88;
    tail.position.y = 0.2;
    aircraft.add(tail);
    group.add(aircraft);

    const pointer = { x: 0, y: 0 };
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.4;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.28;
      },
      { passive: true },
    );

    const resizeHero = () => {
      const { width, height } = target.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resizeHero();
    window.addEventListener("resize", resizeHero);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const render = (time = 0) => {
      const t = time * 0.001;
      group.rotation.y = -0.16 + pointer.x;
      group.rotation.x = -0.03 - pointer.y;
      moleculeA.rotation.y = -0.2 + Math.sin(t * 0.8) * 0.22;
      moleculeB.rotation.y = 0.5 + Math.cos(t * 0.7) * 0.18;
      if (!isTouchDevice) reactor.rotation.y = Math.sin(t * 0.28) * 0.05;
      renderer.render(scene, camera);
      if (!reduceMotion && !isTouchDevice) window.requestAnimationFrame(render);
    };
    render();
    if (!reduceMotion && !isTouchDevice) window.requestAnimationFrame(render);

    heroBg.classList.add("is-3d-ready");
  } catch (error) {
    console.warn("Hero 3D scene unavailable", error);
  }
}

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

function latLonToVector(lat, lon, radius = 1.62, ThreeModule = window.THREE) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new ThreeModule.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
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
    const [{ geoGraticule10, geoInterpolate, geoOrthographic, geoPath }, { feature }, response] = await Promise.all([
      import("https://cdn.jsdelivr.net/npm/d3-geo@3/+esm"),
      import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"),
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    ]);
    const world = await response.json();
    const countries = feature(world, world.objects.countries).features;
    const highlighted = new Set(["356", "840", "702"]);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 620 620");
    svg.setAttribute("role", "img");
    svg.classList.add("projected-globe");
    globeTarget.replaceChildren(svg);

    const projection = geoOrthographic()
      .translate([310, 310])
      .scale(270)
      .rotate([-45, -6])
      .clipAngle(124);
    const path = geoPath(projection);

    const pathItems = [];
    const addPath = (className, datum) => {
      const element = document.createElementNS("http://www.w3.org/2000/svg", "path");
      element.setAttribute("class", className);
      const geometryPath = path(datum);
      if (geometryPath) element.setAttribute("d", geometryPath);
      else element.style.display = "none";
      svg.appendChild(element);
      pathItems.push({ element, datum });
      return element;
    };

    const sphere = { type: "Sphere" };
    addPath("globe-ocean", sphere);
    addPath("globe-graticule", geoGraticule10());
    countries.forEach((country) => {
      addPath(highlighted.has(String(country.id).padStart(3, "0")) ? "globe-country is-highlighted" : "globe-country", country);
    });

    const cityData = {
      chennai: { label: "Chennai", coordinates: [80.2707, 13.0827], selector: ".city-chennai" },
      newyork: { label: "New York", coordinates: [-74.006, 40.7128], selector: ".city-newyork" },
      singaporeCity: { label: "Singapore", coordinates: [103.8198, 1.3521], selector: ".city-singapore" },
      india: { label: "India", coordinates: [78.6569, 22.9734], selector: ".country-india" },
      usa: { label: "United States", coordinates: [-98.5795, 39.8283], selector: ".country-usa" },
      singapore: { label: "Singapore", coordinates: [103.8198, 1.3521], selector: ".country-singapore" },
    };

    const greatCircle = (from, to) => {
      const interpolate = geoInterpolate(from, to);
      return {
        type: "LineString",
        coordinates: Array.from({ length: 80 }, (_, index) => interpolate(index / 79)),
      };
    };
    addPath("globe-route route-one", greatCircle(cityData.chennai.coordinates, cityData.newyork.coordinates));
    addPath("globe-route route-two", greatCircle(cityData.newyork.coordinates, cityData.singaporeCity.coordinates));

    const markers = [cityData.chennai, cityData.newyork, cityData.singaporeCity].map((city) => {
      const [cx, cy] = projection(city.coordinates);
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      marker.setAttribute("class", "globe-marker");
      marker.setAttribute("cx", cx);
      marker.setAttribute("cy", cy);
      marker.setAttribute("r", "5.5");
      svg.appendChild(marker);
      return { marker, city };
    });

    const renderGlobe = () => {
      pathItems.forEach(({ element, datum }) => {
        const geometryPath = path(datum);
        if (!geometryPath) {
          element.style.display = "none";
          return;
        }
        element.style.display = "";
        element.setAttribute("d", geometryPath);
      });
      markers.forEach(({ marker, city }) => {
        const point = projection(city.coordinates);
        if (!point) {
          marker.style.opacity = "0";
          return;
        }
        marker.style.opacity = "1";
        marker.setAttribute("cx", point[0]);
        marker.setAttribute("cy", point[1]);
      });
    };

    const projectLabels = () => {
      const rect = globeTarget.getBoundingClientRect();
      Object.values(cityData).forEach((item) => {
        const label = document.querySelector(item.selector);
        const point = projection(item.coordinates);
        if (!label) return;
        if (!point) {
          label.style.opacity = "0";
          return;
        }
        label.style.left = `${(point[0] / 620) * rect.width}px`;
        label.style.top = `${(point[1] / 620) * rect.height}px`;
        label.style.opacity = "1";
        label.style.transform = "translate(-50%, -50%)";
      });
    };
    renderGlobe();
    projectLabels();

    const renderAll = () => {
      renderGlobe();
      projectLabels();
    };
    window.addEventListener("resize", renderAll);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (!reduceMotion && !isTouchDevice) {
      const baseRotation = [-45, -6];
      const animate = () => {
        const drift = Math.sin(Date.now() * 0.00018) * 9;
        projection.rotate([baseRotation[0] + drift, baseRotation[1]]);
        renderAll();
        window.requestAnimationFrame(animate);
      };
      animate();
    }
  } catch {
    globeTarget.classList.add("is-fallback");
  }
}

initHeroScene();
initJourneyGlobe();
