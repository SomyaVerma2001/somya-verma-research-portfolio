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
