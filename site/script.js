/* ===== Scroll Animations ===== */
const observe = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      }
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
};

/* ===== GitHub Releases ===== */
const GITHUB_REPO = "ZtaMDev/ForgeTerminal";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

const platformMap = [
  { key: "windows", match: /\.msi$|\.exe$/i, label: "Windows", icon: windowsIcon(), available: true },
  { key: "macos", match: /\.dmg$|\.app\.tar\.gz$/i, label: "macOS", icon: macIcon(), available: false },
  { key: "linux-deb", match: /\.deb$/i, label: "Linux (deb)", icon: linuxIcon(), available: false },
  { key: "linux-appimage", match: /\.AppImage$/i, label: "Linux (AppImage)", icon: linuxIcon(), available: false },
];

function windowsIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="#89b4fa" stroke-width="1.5"><path d="M3 3l7 1v7H3V3zm9-1l9 1.5V11h-9V2zM3 13h7v7L3 19v-6zm9 0h9v6.5L12 21v-8z"/></svg>';
}
function macIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="#a6e3a1" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 3v18M3 9h18"/></svg>';
}
function linuxIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="#f9e2af" stroke-width="1.5"><circle cx="12" cy="5" r="2"/><path d="M12 7v10M12 12h-2"/><path d="M6 16c2 2 4 3 6 3s4-1 6-3"/></svg>';
}

async function fetchLatestRelease() {
  const container = document.getElementById("download-grid");
  const btnContainer = document.getElementById("download-buttons");
  const versionEl = document.getElementById("download-version");
  const heroVersionEl = document.getElementById("hero-version");

  try {
    const res = await fetch(GITHUB_API, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

    const data = await res.json();
    const version = data.tag_name || data.name || "0.1.0";
    const assets = data.assets || [];

    if (versionEl) versionEl.textContent = version;
    const cleanVersion = version.replace(/^v/i, "");
    if (heroVersionEl) heroVersionEl.textContent = `v${cleanVersion}`;

    // Build download buttons (primary CTA)
    if (btnContainer) {
      btnContainer.innerHTML = "";
      let matched = false;
      for (const platform of platformMap) {
        if (!platform.available) continue;
        const asset = assets.find((a) => platform.match.test(a.name));
        if (!asset) continue;
        matched = true;
        const btn = document.createElement("a");
        btn.href = asset.browser_download_url;
        btn.className = "btn btn-primary";
        btn.innerHTML = `${platform.icon} Download for ${platform.label}`;
        btn.target = "_blank";
        btn.rel = "noopener";
        btnContainer.appendChild(btn);
      }
      if (!matched) {
        btnContainer.innerHTML = `<a href="https://github.com/${GITHUB_REPO}/releases" target="_blank" rel="noopener" class="btn btn-primary">View Releases on GitHub</a>`;
      }
    }

    // Build detailed download grid
    if (container) {
      container.innerHTML = "";

      // Add actual asset cards
      for (const asset of assets) {
        const card = document.createElement("a");
        card.href = asset.browser_download_url;
        card.className = "download-card";
        card.target = "_blank";
        card.rel = "noopener";

        const icon = document.createElement("div");
        icon.className = "icon";
        const platform = platformMap.find((p) => p.match.test(asset.name));
        icon.innerHTML = platform ? platform.icon : fileIcon();

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = asset.name;

        const size = document.createElement("div");
        size.className = "size";
        size.textContent = formatSize(asset.size);

        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(size);
        container.appendChild(card);
      }

      // Add coming soon cards for unavailable platforms
      for (const platform of platformMap) {
        if (platform.available) continue;
        if (assets.some((a) => platform.match.test(a.name))) continue;
        const card = document.createElement("div");
        card.className = "download-card coming-soon";

        const icon = document.createElement("div");
        icon.className = "icon";
        icon.innerHTML = platform.icon;

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = platform.label;

        const size = document.createElement("div");
        size.className = "size";
        size.textContent = "Coming soon";

        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(size);
        container.appendChild(card);
      }
    }
  } catch (err) {
    const msg = `<p style="color:var(--subtext)">Could not fetch release info. <a href="https://github.com/${GITHUB_REPO}/releases" target="_blank" rel="noopener" style="color:var(--blue)">View on GitHub</a></p>`;
    if (btnContainer) btnContainer.innerHTML = msg;
    if (container) container.innerHTML = msg;
  }
}

function fileIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="#a6adc8" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* ===== Canvas Background Animation ===== */
const PALETTE = [
  "166,227,161",   // green accent
  "137,180,250",   // blue
  "203,166,247",   // mauve
  "148,226,213",   // teal
  "249,226,175",   // yellow
];

function initCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w, h, dots, mouse, animId;

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width * devicePixelRatio;
    h = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    w = rect.width;
    h = rect.height;
    spawnDots();
  };

  const spawnDots = () => {
    const count = Math.min(Math.floor((w * h) / 14000), 120);
    dots = [];
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1.5,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
  };

  mouse = { x: -999, y: -999 };

  const onMouse = (e) => {
    const rect = canvas.parentElement.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  };
  const onLeave = () => { mouse.x = -999; mouse.y = -999; };

  document.addEventListener("mousemove", onMouse);
  canvas.parentElement.addEventListener("mouseleave", onLeave);

  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);

    // Update dots
    for (const d of dots) {
      d.x += d.vx + Math.sin(t * 0.0005 + d.phase) * 0.15;
      d.y += d.vy + Math.cos(t * 0.0006 + d.phase) * 0.15;
      if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
      if (d.y < 0) d.y = h; if (d.y > h) d.y = 0;
    }

    // Draw connections
    const maxDist = Math.min(w, h) * 0.22;
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(166,227,161,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw mouse connection
    if (mouse.x > 0 && mouse.y > 0) {
      const mouseRadius = Math.min(w, h) * 0.25;
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius) {
          const alpha = (1 - dist / mouseRadius) * 0.35;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${d.color},${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${d.color},0.5)`;
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  animId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", resize);
    document.removeEventListener("mousemove", onMouse);
  };
}

/* ===== Smooth nav highlight ===== */
const highlightNav = () => {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a:not(.nav-download)");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          navLinks.forEach((l) => {
            l.style.color = l.getAttribute("href") === `#${entry.target.id}` ? "var(--text)" : "";
          });
        }
      }
    },
    { threshold: 0.3, rootMargin: "-20% 0px -20% 0px" },
  );
  sections.forEach((s) => observer.observe(s));
};

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  observe();
  highlightNav();
  fetchLatestRelease();
  initCanvas();
});
