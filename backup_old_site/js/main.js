/* ============================================================
   main.js — Portfolio JS
   Three.js floating geometry bg + all interactions
============================================================ */

// ─── Loader ──────────────────────────────────────────────────
const loader = document.getElementById('loader');
const loaderPct = document.querySelector('.loader-pct');
let pct = 0;
const ticker = setInterval(() => {
  pct = Math.min(pct + Math.random() * 18, 100);
  if (loaderPct) loaderPct.textContent = Math.floor(pct) + '%';
  if (pct >= 100) {
    clearInterval(ticker);
    setTimeout(() => {
      if (loader) {
        loader.style.transition = 'opacity 0.6s ease';
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 600);
      }
    }, 400);
  }
}, 80);

// ─── Cursor ───────────────────────────────────────────────────
const cursor = document.querySelector('.cursor');
const trail = document.querySelector('.cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;
if (cursor && window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  });
  (function animTrail() {
    tx += (mx - tx) * 0.1; ty += (my - ty) * 0.1;
    if (trail) { trail.style.left = tx + 'px'; trail.style.top = ty + 'px'; }
    requestAnimationFrame(animTrail);
  })();
  document.querySelectorAll('a, button, .exp-nav-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '20px'; cursor.style.height = '20px';
      trail.style.width = '60px'; trail.style.height = '60px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '8px'; cursor.style.height = '8px';
      trail.style.width = '32px'; trail.style.height = '32px';
    });
  });
}

// ─── Three.js Background ─────────────────────────────────────
(function initThree() {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('webgl-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 40);

  // Grid of points
  const geo = new THREE.BufferGeometry();
  const COUNT = 3000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    const t = Math.random();
    if (t < 0.6) {
      colors[i*3] = 0; colors[i*3+1] = 0.6 + Math.random()*0.4; colors[i*3+2] = 1;
    } else if (t < 0.85) {
      colors[i*3] = 0.15; colors[i*3+1] = 1; colors[i*3+2] = 0.5;
    } else {
      colors[i*3] = 1; colors[i*3+1] = 0.3; colors[i*3+2] = 0.43;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.5 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Floating wireframe geometries
  const wireGeos = [
    new THREE.IcosahedronGeometry(5, 1),
    new THREE.TorusGeometry(4, 1.5, 8, 16),
    new THREE.OctahedronGeometry(4, 0),
  ];
  const wireMeshes = wireGeos.map((g, i) => {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: i === 0 ? 0x00e5ff : i === 1 ? 0x39ff88 : 0xff4d6d,
      wireframe: true, transparent: true, opacity: 0.08
    }));
    const r = 14 + i * 8;
    m.position.set(
      Math.cos(i * 2.1) * r,
      Math.sin(i * 1.5) * 6,
      Math.sin(i * 2.1) * r * 0.5
    );
    scene.add(m);
    return m;
  });

  // Connection lines between random points
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.04 });
  for (let i = 0; i < 60; i++) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*70, (Math.random()-0.5)*50),
      new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*70, (Math.random()-0.5)*50),
    ]);
    scene.add(new THREE.Line(g, lineMat));
  }

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.005;
    points.rotation.y = t * 0.04;
    points.rotation.x = t * 0.02;
    wireMeshes.forEach((m, i) => {
      m.rotation.x = t * (0.2 + i * 0.1);
      m.rotation.y = t * (0.15 + i * 0.08);
    });
    camera.position.x += (mouseX * 5 - camera.position.x) * 0.02;
    camera.position.y += (mouseY * 3 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  })();
})();

// ─── Nav scroll effect ────────────────────────────────────────
const nav = document.querySelector('nav');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  // Active section highlight
  document.querySelectorAll('section[id]').forEach(sec => {
    const top = sec.getBoundingClientRect().top;
    if (top < 120 && top > -sec.offsetHeight + 120) {
      navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + sec.id);
      });
    }
  });
});

// ─── Reveal on scroll ─────────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = (e.target.dataset.delay || 0) + 'ms';
      e.target.classList.add('in-view');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
  revealObs.observe(el);
});

// Stagger children of grids
document.querySelectorAll('.skills-hexgrid, .achieve-grid, .cert-row').forEach(grid => {
  [...grid.children].forEach((child, i) => {
    child.classList.add('reveal');
    child.dataset.delay = i * 80;
    revealObs.observe(child);
  });
});

// ─── Terminal typewriter ──────────────────────────────────────
(function initTerminal() {
  const lines = [
    { type: 'cmd', text: 'whoami' },
    { type: 'out', text: 'aditya_kumar  //  DevOps Architect', cls: 'hi' },
    { type: 'cmd', text: 'cat experience.yaml' },
    { type: 'out', text: 'years: 9+', cls: '' },
    { type: 'out', text: 'current: GE Healthcare', cls: 'hi2' },
    { type: 'out', text: 'teams_enabled: 10+', cls: '' },
    { type: 'cmd', text: 'kubectl get certifications' },
    { type: 'out', text: 'AWS  CKA  Terraform  Jenkins', cls: 'hi3' },
    { type: 'cmd', text: 'git log --impact', cls: '' },
    { type: 'out', text: '~30% faster deployments 🚀', cls: 'hi2' },
  ];

  const body = document.querySelector('.terminal-body');
  if (!body) return;
  body.innerHTML = '';

  let lineIndex = 0, charIndex = 0;
  let currentEl = null;

  function nextLine() {
    if (lineIndex >= lines.length) {
      // Add blinking cursor at end
      const cur = document.createElement('span');
      cur.className = 't-cursor'; body.appendChild(cur);
      return;
    }
    const line = lines[lineIndex];
    const div = document.createElement('div');
    div.className = 't-line';

    if (line.type === 'cmd') {
      const prompt = document.createElement('span');
      prompt.className = 't-prompt'; prompt.textContent = '›';
      div.appendChild(prompt);
    }
    currentEl = document.createElement('span');
    currentEl.className = line.type === 'cmd' ? 't-cmd' : ('t-out ' + (line.cls || ''));
    div.appendChild(currentEl);
    body.appendChild(div);
    charIndex = 0;
    typeChar(line.text, line.type === 'cmd' ? 55 : 30);
  }

  function typeChar(text, speed) {
    if (charIndex < text.length) {
      currentEl.textContent += text[charIndex++];
      body.scrollTop = body.scrollHeight;
      setTimeout(() => typeChar(text, speed), speed + Math.random() * 30);
    } else {
      lineIndex++;
      const pause = lines[lineIndex - 1].type === 'cmd' ? 300 : 80;
      setTimeout(nextLine, pause);
    }
  }

  // Start after loader
  setTimeout(nextLine, 1800);
})();

// ─── Experience tabs ──────────────────────────────────────────
document.querySelectorAll('.exp-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.target;
    document.querySelectorAll('.exp-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.exp-panel').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(target)?.classList.add('active');
  });
});

// ─── 3D tilt on cards ─────────────────────────────────────────
document.querySelectorAll('.achieve-card, .hex-cell, .stat-chip').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ─── Orbit labels ─────────────────────────────────────────────
(function placeOrbitLabels() {
  const data = [
    { ring: 1, angle: 0,   icon: '☁️', label: 'Cloud',     pos: { ml: '28px', mt: '-10px' } },
    { ring: 1, angle: 180, icon: '⎈',  label: 'Kubernetes', pos: { ml: '28px', mt: '-10px' } },
    { ring: 2, angle: 60,  icon: '🔄', label: 'CI/CD',     pos: { ml: '28px', mt: '-10px' } },
    { ring: 2, angle: 200, icon: '🏗️', label: 'IaC',       pos: { ml: '28px', mt: '-10px' } },
    { ring: 3, angle: 30,  icon: '📊', label: 'Monitoring', pos: { ml: '28px', mt: '-10px' } },
    { ring: 3, angle: 160, icon: '🔀', label: 'GitOps',    pos: { ml: '28px', mt: '-10px' } },
    { ring: 3, angle: 280, icon: '🚀', label: 'Platform',  pos: { ml: '28px', mt: '-10px' } },
  ];
  // Orbit nodes are placed via CSS animation transforms — labels handled in CSS orbit-node class
})();

// ─── Scroll-triggered counter animation ───────────────────────
function animateCount(el, target, duration = 1500) {
  const start = Date.now();
  const isFloat = String(target).includes('.');
  function tick() {
    const progress = Math.min((Date.now() - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = target * ease;
    el.textContent = isFloat ? val.toFixed(1) : Math.floor(val);
    if (progress < 1) requestAnimationFrame(tick);
  }
  tick();
}
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseFloat(e.target.dataset.count);
      if (!isNaN(target)) { animateCount(e.target, target); counterObs.unobserve(e.target); }
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

// ─── Smooth anchor scroll ─────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Form submit (demo) ───────────────────────────────────────
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit span');
    const original = btn.textContent;
    btn.textContent = 'Message sent ✓';
    form.reset();
    setTimeout(() => btn.textContent = original, 3000);
  });
}
