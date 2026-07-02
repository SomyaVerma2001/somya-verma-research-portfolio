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

import("https://cdn.jsdelivr.net/npm/lenis@1.1.18/+esm")
  .then(({ default: Lenis }) => {
    lenis = new Lenis({ smoothWheel: true });
    if (document.body.classList.contains("is-locked")) lenis.stop();
    else lenis.start();
  })
  .catch(() => {});

function raf(time) {
  lenis.raf(time);
  window.requestAnimationFrame(raf);
}
window.requestAnimationFrame(raf);
lenis.stop();
document.body.classList.add("is-locked");

function updateRootScale() {
  const FONT_BASE = 16;
  const BASE_W = 1920;
  const COEF = 0.6666;
  const reduction = ((BASE_W - window.innerWidth) / BASE_W) * 100 * COEF;
  const size = FONT_BASE - (FONT_BASE * reduction) / 100;
  if (size > FONT_BASE) html.style.fontSize = `${size}px`;
  else html.style.removeProperty("font-size");
}
window.addEventListener("resize", updateRootScale);
updateRootScale();

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
    if (!reduceMotion) {
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

initJourneyGlobe();
