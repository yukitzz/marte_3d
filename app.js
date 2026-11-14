(function () {
  const $ = id => document.getElementById(id), R = THREE.MathUtils;
  const canvas = $('c'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(0x020308, 1);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 5000);
  camera.position.set(0, 1.5, 14); scene.add(camera);
  const LD = new THREE.Vector3(-10, 1.5, 3).normalize(); // Sol vindo da esquerda

  // ---------- Estrelas pontuais ----------
  function stars(n, size) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const r = 2800 + Math.random() * 400, th = Math.random() * 6.2832, ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
      c.setHSL(Math.random() < 0.7 ? 0.6 : 0.08, 0.35 * Math.random(), 0.75 + 0.25 * Math.random()); col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size, vertexColors: true, sizeAttenuation: false }));
  }
  const sky = new THREE.Group(); sky.add(stars(6000, 1.4), stars(600, 2.4)); scene.add(sky);

  function glowTex(rgb) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.3, `rgba(${rgb},.5)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  }

  // ---------- Sol e planetas em segundo plano ----------
  const SUN = new THREE.Vector3(-1000, 160, -1800);
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 24), new THREE.MeshBasicMaterial({ color: 0xfff1c8 })); sunCore.position.copy(SUN); scene.add(sunCore);
  [['255,200,120', 900], ['255,248,225', 300]].forEach(([rgb, s]) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(rgb), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); sp.scale.set(s, s, 1); sp.position.copy(SUN); scene.add(sp);
  });
  const rnd = Math.random;
  const paint = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  const blobs = (g, n, col, wMin, wMax, hMin, hMax, w, h, y0, y1) => { g.fillStyle = col; for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(rnd() * w, y0 + rnd() * (y1 - y0), wMin + rnd() * (wMax - wMin), hMin + rnd() * (hMax - hMin), rnd() * 3, 0, 6.3); g.fill(); } };
  const bandTex = cols => paint(256, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 2) { g.fillStyle = cols[Math.abs(Math.floor(y / 8 + Math.sin(y * 0.3) * 0.7)) % cols.length]; g.fillRect(0, y, w, 2); }
    g.fillStyle = 'rgba(255,255,255,.1)'; for (let i = 0; i < 70; i++) g.fillRect(rnd() * w, rnd() * h, 20 + rnd() * 40, 2);
  });
  const jupTex = bandTex(['#d9b48a', '#a9744a', '#e8d2b0', '#b98a5e', '#caa27a', '#8f5f3c']);
  { const c = jupTex.image.getContext('2d'); c.fillStyle = '#b5472f'; c.beginPath(); c.ellipse(170, 84, 14, 8, 0, 0, 6.3); c.fill(); }
  const satTex = bandTex(['#e3cf9f', '#d2b988', '#efe0b8', '#c9ad7c']);
  const earthTex = paint(256, 128, (g, w, h) => {
    g.fillStyle = '#1d5aa8'; g.fillRect(0, 0, w, h); blobs(g, 26, '#3f7d3a', 8, 28, 5, 14, w, h, 22, 106); blobs(g, 8, '#8a7a45', 6, 16, 4, 9, w, h, 30, 98);
    blobs(g, 40, 'rgba(255,255,255,.5)', 10, 30, 2, 5, w, h, 0, h); g.fillStyle = '#fff'; g.fillRect(0, 0, w, 7); g.fillRect(0, 121, w, 7);
  });
  const venusTex = paint(256, 128, (g, w, h) => { g.fillStyle = '#d8b878'; g.fillRect(0, 0, w, h); blobs(g, 40, 'rgba(255,240,200,.35)', 20, 50, 2, 5, w, h, 0, h); });
  const mercTex = paint(256, 128, (g, w, h) => { g.fillStyle = '#8d8984'; g.fillRect(0, 0, w, h); blobs(g, 120, 'rgba(60,58,56,.5)', 1.5, 6, 1.5, 6, w, h, 0, h); });
  const ringTex = paint(512, 512, g => {
    for (let rr = 0.56; rr < 1; rr += 0.004) { const gap = rr > 0.78 && rr < 0.8 ? 0 : 1, a = gap * (0.3 + 0.45 * Math.pow(Math.sin(rr * 95), 2)); g.strokeStyle = `rgba(222,202,162,${a})`; g.lineWidth = 2.6; g.beginPath(); g.arc(256, 256, rr * 256, 0, 6.2832); g.stroke(); }
  });
  const planets = [];
  function addPlanet(rad, tex, r, a0, amp, w, y0, spin, tilt, rings) {
    const g = new THREE.Group(), m = new THREE.Mesh(new THREE.SphereGeometry(rad, 48, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 })); g.add(m);
    if (rings) { const rg = new THREE.Mesh(new THREE.RingGeometry(rad * 1.27, rad * 2.3, 96), new THREE.MeshBasicMaterial({ map: rings, transparent: true, side: THREE.DoubleSide, depthWrite: false })); rg.rotation.x = Math.PI / 2; g.add(rg); }
    g.rotation.set(tilt[0], 0, tilt[1]); scene.add(g); planets.push({ g, m, r, a0, amp, w, y0, spin, ph: rnd() * 6 });
  }
  addPlanet(12, mercTex, 330, 0.15, 0.08, 0.09, 90, 0.003, [0, 0]);
  addPlanet(28, venusTex, 620, 0.1, 0.08, 0.07, -60, 0.001, [0, 0]);
  addPlanet(32, earthTex, 1250, 0.05, 0.07, 0.05, 200, 0.004, [0, 0.4]);
  addPlanet(110, jupTex, 1750, 0.02, 0.05, 0.04, -100, 0.006, [0, 0.05]);
  addPlanet(88, satTex, 2100, -0.03, 0.04, 0.03, -250, 0.005, [0.5, 0.25], ringTex);

  // ---------- Textura equiretangular procedural (ruído de Perlin) ----------
  const PERM = new Uint8Array(512);
  { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]; }
  const f5 = t => t * t * t * (t * (t * 6 - 15) + 10), lp = (a, b, t) => a + (b - a) * t;
  function gr(h, x, y, z) { h &= 15; const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z); return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); }
  function perlin(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255; x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = f5(x), v = f5(y), w = f5(z), A = PERM[X] + Y, AA = PERM[A] + Z, AB = PERM[A + 1] + Z, B = PERM[X + 1] + Y, BA = PERM[B] + Z, BB = PERM[B + 1] + Z;
    return lp(lp(lp(gr(PERM[AA], x, y, z), gr(PERM[BA], x - 1, y, z), u), lp(gr(PERM[AB], x, y - 1, z), gr(PERM[BB], x - 1, y - 1, z), u), v),
              lp(lp(gr(PERM[AA + 1], x, y, z - 1), gr(PERM[BA + 1], x - 1, y, z - 1), u), lp(gr(PERM[AB + 1], x, y - 1, z - 1), gr(PERM[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  }
  const pf = (x, y, z, o) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * perlin(x * f, y * f, z * f); n += a; f *= 2; a *= 0.5; } return 0.5 + 0.5 * s / n; };

  function canyon(W, H) { // máscara do Valles Marineris com ramificações
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = Math.random;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.lineCap = g.lineJoin = 'round';
    const X = l => (l + 180) / 360 * W, Y = l => (90 - l) / 180 * H;
    const path = (pts, wf) => { for (let i = 0; i < pts.length - 1; i++) for (const [m, al] of [[1.9, 0.22], [1, 0.85]]) { g.lineWidth = wf(i / (pts.length - 1)) * m; g.strokeStyle = `rgba(255,255,255,${al})`; g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke(); } };
    const trunk = []; for (let i = 0; i <= 70; i++) { const t = i / 70; trunk.push([X(-100 + t * 56), Y(-6.5 - t * 8 + perlin(t * 5, 3.3, 1.1) * 1.4)]); }
    const wid = t => 3 + 11 * Math.pow(Math.sin(Math.min(1, t * 1.1) * Math.PI), 0.7);
    [[-6, 0.7], [0, 1], [7, 0.65]].forEach(([off, k]) => path(trunk.map((p, i) => [p[0], p[1] + off * Math.sin(i / 70 * Math.PI)]), t => wid(t) * k));
    for (let b = 0; b < 18; b++) {
      const i0 = Math.floor((0.1 + rnd() * 0.8) * 69), p = trunk[i0], dir = Math.atan2(trunk[i0 + 1][1] - p[1], trunk[i0 + 1][0] - p[0]);
      let ang = dir + (rnd() < 0.5 ? -1 : 1) * (1.2 + rnd() * 0.5), x = p[0], y = p[1]; const len = 22 + rnd() * 55, pts = [[x, y]];
      for (let s = 0; s < 10; s++) { ang += (rnd() - 0.5) * 0.5; x += Math.cos(ang) * len / 10; y += Math.sin(ang) * len / 10; pts.push([x, y]); }
      path(pts, t => 3.2 * (1 - t * 0.7));
    }
    for (let n = 0; n < 14; n++) { const x = X(-100) + (rnd() - 0.5) * 40, y = Y(-7.5) + (rnd() - 0.5) * 26, a = rnd() * 6.28, l = 12 + rnd() * 24; path([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], () => 2.4); } // Noctis Labyrinthus
    g.fillStyle = 'rgba(255,255,255,.5)'; for (let n = 0; n < 6; n++) { g.beginPath(); g.ellipse(X(-48) + (rnd() - 0.5) * 24, Y(-12) + (rnd() - 0.5) * 14, 4 + rnd() * 6, 3 + rnd() * 5, rnd() * 3, 0, 6.3); g.fill(); } // terreno caótico
    const d = g.getImageData(0, 0, W, H).data, m = new Float32Array(W * H); for (let i = 0; i < m.length; i++) m[i] = d[i * 4] / 255; return m;
  }

  function makeMars() {
    const W = 2048, H = 1024, N = W * H, lw = 512, lh = 256, o = Math.random() * 80, rnd = Math.random;
    const S = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const lb = new Float32Array(lw * lh), la = new Float32Array(lw * lh), ld = new Float32Array(lw * lh), lv = new Float32Array(lw * lh);
    const NAMED = [[8.4, 69.5, 0.19, 0.7], [-25, -38, 0.24, 0.55], [-35, -152, 0.24, 0.45], [-22, 145, 0.26, 0.45], [46, -20, 0.3, 0.4], [-45, 25, 0.24, 0.35]].map(([a, l, s, am]) => { const t = a * Math.PI / 180, g = (l + 180) * Math.PI / 180; return { x: Math.cos(t) * Math.cos(g), y: Math.sin(t), z: Math.cos(t) * Math.sin(g), s, a: am }; }); // Syrtis Major, Mare Erythraeum, Sirenum, Cimmerium...
    for (let y = 0; y < lh; y++) { // campos de grande escala (baixa resolução) com distorção de domínio
      const lat = (0.5 - (y + 0.5) / lh) * Math.PI, cl = Math.cos(lat), py = Math.sin(lat);
      for (let x = 0; x < lw; x++) {
        const lon = (x + 0.5) / lw * 6.2832, px = cl * Math.cos(lon), pz = cl * Math.sin(lon), i = y * lw + x;
        const qx = px + (pf(px * 1.4 + o, py * 1.4, pz * 1.4, 3) - 0.5) * 0.9, qy = py + (pf(px * 1.4, py * 1.4 + o, pz * 1.4, 3) - 0.5) * 0.9, qz = pz + (pf(px * 1.4, py * 1.4, pz * 1.4 + o, 3) - 0.5) * 0.9;
        lb[i] = pf(qx * 2.2 + o, qy * 2.2, qz * 2.2, 5); la[i] = pf(qx * 3.4, qy * 3.4 + o, qz * 3.4, 4); lv[i] = pf(px * 9 + o, py * 9 + o, pz * 9, 3);
        let d = pf(qx * 2.6 + o, qy * 2.6, qz * 2.6 + o, 4);
        for (const n of NAMED) { const ang = Math.acos(Math.min(1, px * n.x + py * n.y + pz * n.z)); d += n.a * Math.exp(-(ang / n.s) * (ang / n.s)); }
        ld[i] = d;
      }
    }
    const samp = (arr, x, y) => {
      const fx = (x + 0.5) * lw / W - 0.5, fy = (y + 0.5) * lh / H - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const xa = (x0 + lw) % lw, xb = (x0 + 1 + lw) % lw, ya = Math.max(0, Math.min(lh - 1, y0)), yb = Math.max(0, Math.min(lh - 1, y0 + 1));
      return lp(lp(arr[ya * lw + xa], arr[ya * lw + xb], tx), lp(arr[yb * lw + xa], arr[yb * lw + xb], tx), ty);
    };
    const hf = new Float32Array(N), cr = new Float32Array(N), fn = new Float32Array(N), cs = new Float32Array(W), sn = new Float32Array(W);
    for (let x = 0; x < W; x++) { const lon = (x + 0.5) / W * 6.2832; cs[x] = Math.cos(lon); sn[x] = Math.sin(lon); }
    for (let y = 0; y < H; y++) { // relevo base + detalhe fino (alta resolução)
      const lat = (0.5 - (y + 0.5) / H) * Math.PI, cl = Math.cos(lat), py = Math.sin(lat);
      for (let x = 0; x < W; x++) { const i = y * W + x, F = pf(cl * cs[x] * 20 + o, py * 20 + o, cl * sn[x] * 20, 3); fn[i] = F; hf[i] = samp(lb, x, y) * 0.5 + 0.25 + (F - 0.5) * 0.07; }
    }
    function stamp(cx, cy, r, deg, big) { // cratera com borda irregular, erodida, ejecta e pico central
      const sx = 1 / Math.max(0.25, Math.cos((0.5 - cy / H) * Math.PI)), RR = Math.ceil(r * 1.6), hp = rnd() * 6.28, rp = rnd() * 6.28;
      const ha = big ? [(rnd() - 0.5) * 0.16, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.07] : null, sc = Math.min(1, 0.3 + r / 10);
      const D0 = (0.05 + Math.min(0.07, r * 0.0035)) * deg * sc, rim = (0.02 + Math.min(0.03, r * 0.0016)) * deg * sc;
      for (let dy = -RR; dy <= RR; dy++) {
        const y = (cy + dy) | 0; if (y < 0 || y >= H) continue;
        const wr = Math.ceil(RR * sx);
        for (let dx = -wr; dx <= wr; dx++) {
          const ddx = dx / sx; let ang = 0, irr = 1;
          if (big) { ang = Math.atan2(dy, ddx); irr = 1 + ha[0] * Math.cos(2 * ang + hp) + ha[1] * Math.cos(3 * ang + hp * 1.7) + ha[2] * Math.cos(4 * ang + hp * 2.3); }
          const d = Math.hypot(ddx, dy) / (r * irr); if (d > 1.6) continue;
          let dh = d < 1 ? -D0 * (1 - d * d) : 0;
          dh += rim * (big ? 0.55 + 0.45 * Math.cos(2 * ang + rp) : 1) * Math.exp(-Math.pow((d - 1) / 0.14, 2)) + (d >= 1 ? 0.008 * deg * sc * Math.exp(-(d - 1) * 3.5) : 0);
          if (big && r > 16 && d < 0.25) dh += 0.035 * deg * (1 - d / 0.25);
          const j = y * W + ((((cx + dx) | 0) % W) + W) % W; hf[j] += dh; cr[j] += dh;
        }
      }
    }
    const place = (n, rmin, rmax, pw, big) => { for (let k = 0; k < n; k++) { let cy; do { cy = (0.04 + 0.92 * rnd()) * H; } while ((cy > H / 2 ? 1 : 0.4) < rnd()); stamp(rnd() * W, cy, rmin + Math.pow(rnd(), pw) * (rmax - rmin), 0.35 + rnd() * 0.65, big); } };
    place(260, 6, 46, 2.2, true); place(1400, 2.5, 6, 1.5, false); place(5500, 1.2, 2.5, 1, false); // mais crateras no sul
    const cm = canyon(W, H); for (let i = 0; i < N; i++) hf[i] -= cm[i] * 0.3;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cg = cv.getContext('2d'), ci = cg.createImageData(W, H), c = [0, 0, 0];
    const mi = (a, b, t) => { c[0] = a[0] + (b[0] - a[0]) * t; c[1] = a[1] + (b[1] - a[1]) * t; c[2] = a[2] + (b[2] - a[2]) * t; };
    const RUST = [170, 68, 32], ORA = [214, 102, 48], OCHRE = [204, 122, 68], GOLD = [224, 150, 86], DUST = [228, 172, 126], BAS = [50, 27, 21], CAN = [70, 38, 28], ICE = [244, 240, 236];
    for (let y = 0; y < H; y++) {
      const lat = (0.5 - (y + 0.5) / H) * Math.PI, alat = Math.abs(lat), n = S(-0.2, 0.5, lat / (Math.PI / 2));
      for (let x = 0; x < W; x++) {
        const i = y * W + x, p = i * 4, h = hf[i], F = fn[i], A = samp(la, x, y), D = samp(ld, x, y), V = samp(lv, x, y);
        mi(RUST, ORA, S(0.35, 0.7, A)); const s0 = c[0], s1 = c[1], s2 = c[2];
        mi(OCHRE, GOLD, S(0.3, 0.75, A)); c[0] = s0 + (c[0] - s0) * n; c[1] = s1 + (c[1] - s1) * n; c[2] = s2 + (c[2] - s2) * n; // sul ferrugem, norte ocre/dourado
        mi(c, DUST, S(0.55, 0.8, V) * 0.5);
        mi(c, BAS, S(0.55, 0.78, D + (F - 0.5) * 0.5 + (V - 0.5) * 0.3) * (0.4 + 0.6 * (1 - n)) * 0.9); // regiões basálticas escuras (mais no sul)
        mi(c, CAN, cm[i] * 0.55);
        const thr = (lat > 0 ? 1.4 : 1.36) + (A - 0.5) * 0.25 + (F - 0.5) * 0.06; // calotas polares irregulares
        mi(c, ICE, Math.max(S(thr, thr + 0.05, alat), S(0.62, 0.75, V) * S(1.2, 1.32, alat) * 0.6));
        const k = (0.93 + 0.14 * F) * (0.92 + 0.16 * h) * (1 + cr[i] * 2.6);
        ci.data[p] = c[0] * k; ci.data[p + 1] = c[1] * k; ci.data[p + 2] = c[2] * k; ci.data[p + 3] = 255;
      }
    }
    cg.putImageData(ci, 0, 0);
    // mapa de normais (espaço tangente) a partir da altura: profundidade real em crateras, cânions e montanhas
    const nv = document.createElement('canvas'); nv.width = W; nv.height = H; const ng = nv.getContext('2d'), ni = ng.createImageData(W, H), SN = 30;
    for (let y = 0; y < H; y++) {
      const lat = (0.5 - (y + 0.5) / H) * Math.PI, su = SN / Math.max(0.35, Math.cos(lat)), ya = Math.max(0, y - 1), yb = Math.min(H - 1, y + 1);
      for (let x = 0; x < W; x++) {
        const xa = (x - 1 + W) % W, xb = (x + 1) % W, du = (hf[y * W + xb] - hf[y * W + xa]) * 0.5 * su, dv = (hf[ya * W + x] - hf[yb * W + x]) * 0.5 * SN, l = Math.hypot(du, dv, 1), p = (y * W + x) * 4;
        ni.data[p] = (-du / l * 0.5 + 0.5) * 255; ni.data[p + 1] = (-dv / l * 0.5 + 0.5) * 255; ni.data[p + 2] = (1 / l * 0.5 + 0.5) * 255; ni.data[p + 3] = 255;
      }
    }
    ng.putImageData(ni, 0, 0); return { cv, nv };
  }

  // ---------- Luas de Marte: Fobos e Deimos ----------
  const moons = [];
  function addMoon(rad, color, sx, sy, sz, r, w, inc) {
    const g = new THREE.IcosahedronGeometry(rad, 3), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.25 * perlin(x / rad * 1.7 + 7, y / rad * 1.7, z / rad * 1.7); p.setXYZ(i, x * n * sx, y * n * sy, z * n * sz); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 })); scene.add(m); moons.push({ m, r, w, inc, ph: Math.random() * 6 });
  }
  addMoon(0.07, 0x756a60, 1.25, 0.95, 0.9, 3.0, 0.45, 0.25); // Fobos
  addMoon(0.045, 0x857a6e, 1.1, 0.95, 0.9, 4.6, 0.16, -0.2); // Deimos

  // ---------- Locais ----------
  const SITES = [
    { name: 'Monte Olimpo', lat: 18.65, lon: -133.8, sub: 'Vulcão em escudo · 18,65°N · 226,2°L', txt: 'O maior vulcão conhecido do Sistema Solar, formado por lava basáltica fluida na região vulcânica de Tharsis.',
      facts: [['Altura', '~22 km (≈2,5× o Everest)'], ['Base', '~600 km de largura'], ['Caldeira', '~80 km, com 6 caldeiras encaixadas']] },
    { name: 'Valles Marineris', lat: -13.9, lon: -59, sub: 'Sistema de cânions · 13,9°S · 59°O', txt: 'Um dos maiores sistemas de cânions do Sistema Solar. Acredita-se que tenha se aberto por rachaduras da crosta ligadas ao crescimento da região de Tharsis.',
      facts: [['Extensão', '~4.000 km'], ['Largura', 'até ~200 km'], ['Profundidade', 'até ~7 km'], ['Comparação', 'Grand Canyon: ~446 km × 1,8 km']] },
    { name: 'Cratera Jezero', lat: 18.4, lon: 77.5, sub: 'Antigo lago e delta · 18,4°N · 77,5°L', txt: 'Há cerca de 3,5 bilhões de anos abrigou um lago alimentado por um rio. Seu delta preserva rochas que podem guardar sinais de vida antiga.',
      facts: [['Diâmetro', '~45 km'], ['Missão', 'Rover Perseverance'], ['Pouso', '18 de fevereiro de 2021'], ['Objetivo', 'Coletar amostras de rocha e buscar biossinais']] },
    { name: 'Cratera Gale', lat: -5.4, lon: 137.8, sub: 'Cratera com montanha central · 5,4°S · 137,8°L', txt: 'No centro da cratera ergue-se o Monte Sharp, de camadas sedimentares. O Curiosity encontrou evidências de um antigo lago habitável e moléculas orgânicas.',
      facts: [['Diâmetro', '~154 km'], ['Monte Sharp', '~5 km de altura'], ['Missão', 'Rover Curiosity'], ['Pouso', '6 de agosto de 2012']] }
  ];
  const hits = [];
  let mars, controls, mode = 'space', focus = null, T = 0, lockUntil = 0, markerK = 0, jump = 0, pulse = 0;

  function buildMars(map, normal) {
    map.encoding = THREE.sRGBEncoding; map.anisotropy = normal.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mars = new THREE.Mesh(new THREE.SphereGeometry(2, 128, 128), new THREE.MeshStandardMaterial({ map, normalMap: normal, normalScale: new THREE.Vector2(1, 1), roughness: 0.95, metalness: 0 }));
    mars.rotation.order = 'ZYX'; mars.rotation.z = R.degToRad(25); scene.add(mars);
    // atmosfera: casca Fresnel (laranja → azulado) + halo externo fino e suave, só no lado iluminado, com dithering contra banding
    const atmVS = 'varying vec3 vN; varying vec3 wN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); wN=normalize(normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }';
    const atmFS = body => 'uniform vec3 ld; varying vec3 vN; varying vec3 wN; varying vec3 vV; void main(){ float d=dot(normalize(vN),normalize(vV)); float lit=smoothstep(-0.12,0.55,dot(wN,ld)); ' + body + ' col*=lit; float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)/255.0; gl_FragColor=vec4(col+n*min(1.0,length(col)*50.0),1.0); }';
    const atm = (r, side, body) => scene.add(new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side, uniforms: { ld: { value: LD } }, vertexShader: atmVS, fragmentShader: atmFS(body) })));
    atm(2.03, THREE.FrontSide, 'float f=pow(1.0-max(d,0.0),3.0); vec3 col=mix(vec3(1.0,0.5,0.28),vec3(0.45,0.62,1.0),smoothstep(0.5,1.0,f))*f*0.5;');
    atm(2.14, THREE.BackSide, 'float f=pow(smoothstep(0.0,0.36,-d),2.0); vec3 col=mix(vec3(1.0,0.52,0.3),vec3(0.4,0.6,1.0),smoothstep(0.2,0.9,f))*f*0.8;');
    const sun = new THREE.DirectionalLight(0xfff1dd, 3.4); sun.position.copy(LD).multiplyScalar(30); scene.add(sun, new THREE.AmbientLight(0xffffff, 0.025));
    const halo = glowTex('90,230,255');
    SITES.forEach(s => {
      const la = R.degToRad(s.lat), lo = R.degToRad(s.lon);
      s.m = new THREE.Vector3(Math.cos(lo) * Math.cos(la), Math.sin(la), -Math.sin(lo) * Math.cos(la));
      const g = new THREE.Group(); g.position.copy(s.m).multiplyScalar(2.02); g.visible = false; g.scale.setScalar(0.001); mars.add(g); s.g = g;
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: 0xbffaff })));
      s.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); g.add(s.halo);
      s.hit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); s.hit.userData.site = s; g.add(s.hit); hits.push(s.hit);
    });
    const ld = $('loading'); ld.style.opacity = 0; setTimeout(() => ld.remove(), 700);
  }
  requestAnimationFrame(() => setTimeout(() => { const { cv, nv } = makeMars(); buildMars(new THREE.CanvasTexture(cv), new THREE.CanvasTexture(nv)); }, 30));

  // ---------- Robô companheiro (materiais sólidos, sem envMap) ----------
  const rig = new THREE.Group(); camera.add(rig);
  const M = (c, m, r, e) => new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r }, e));
  const white = M(0xeef0f5, 0.35, 0.4), gray = M(0x3b404c, 0.5, 0.5), orange = M(0xff7a30, 0.2, 0.5), visor = M(0x06182c, 0.2, 0.2, { emissive: 0x2aa8ff, emissiveIntensity: 1.4 });
  const robot = new THREE.Group(); rig.add(robot); robot.scale.setScalar(0.12);
  const add = (g, m, x, y, z, p) => { const o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); (p || robot).add(o); return o; };
  const head = new THREE.Group(); head.position.y = 0.8; robot.add(head);
  add(new THREE.SphereGeometry(0.75, 32, 24), white, 0, 0, 0, head).scale.set(1.15, 0.85, 0.95);
  add(new THREE.SphereGeometry(0.6, 32, 16), visor, 0, 0.02, 0.45, head).scale.set(1.05, 0.5, 0.55); // visor azul brilhante
  [-1, 1].forEach(s => add(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16).rotateZ(Math.PI / 2), gray, 0.86 * s, 0, 0, head));
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 10), gray, 0, 0.95, 0, head);
  const tip = add(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff7a30 }), 0, 1.27, 0, head);
  const tipLight = new THREE.PointLight(0xff7a30, 1.2, 1); tipLight.position.set(0, 1.3, 0.1); head.add(tipLight);
  add(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 20), gray, 0, 0.14, 0);
  add(new THREE.SphereGeometry(0.62, 32, 24), white, 0, -0.6, 0).scale.set(1, 1.05, 0.85);
  add(new THREE.TorusGeometry(0.56, 0.04, 12, 40).rotateX(Math.PI / 2), orange, 0, -0.38, 0);
  add(new THREE.CircleGeometry(0.11, 24), new THREE.MeshBasicMaterial({ color: 0xff7a30 }), 0, -0.62, 0.53);
  add(new THREE.CylinderGeometry(0.32, 0.2, 0.3, 24), gray, 0, -1.4, 0);
  const arms = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(0.72 * s, -0.35, 0); robot.add(p);
    add(new THREE.SphereGeometry(0.15, 16, 12), gray, 0, 0, 0, p); add(new THREE.CylinderGeometry(0.085, 0.085, 0.6, 14), white, 0, -0.3, 0, p); add(new THREE.SphereGeometry(0.13, 16, 12), orange, 0, -0.64, 0, p); return p;
  });
  const fm = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [[0, -1.85, 0, 0.2, 0.6], [-0.58, -1.28, -0.2, 0.09, 0.4], [0.58, -1.28, -0.2, 0.09, 0.4]].map(([x, y, z, r, l], i) => {
    if (i) add(new THREE.CylinderGeometry(0.09, 0.13, 0.22, 16), gray, x, y + 0.32, z);
    const f = add(new THREE.ConeGeometry(r, l, 14).rotateX(Math.PI), fm, x, y, z);
    const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('90,190,255'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    g.scale.set(i ? 0.9 : 1.6, i ? 0.9 : 1.6, 1); g.position.set(x, y - 0.05, z); robot.add(g); f.userData.g = g; return f;
  });
  const key = new THREE.PointLight(0xffffff, 1.3, 5), fill = new THREE.PointLight(0x9fb8ff, 0.5, 5); key.position.set(-0.3, 0.9, -2.2); fill.position.set(1, -0.5, -2); rig.add(key, fill);

  // ---------- Controles ----------
  controls = new THREE.OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.07, enablePan: false, minDistance: 2.1, maxDistance: 40, rotateSpeed: 0.6, zoomSpeed: 0.7 });

  // ---------- Modo mapa ----------
  const bubble = $('bubble'), panel = $('panel'), acts = $('actions'), backBtn = $('back'), landBtn = $('land');
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let down = null, mx = 0, my = 0;
  const fly = { on: false, t: 0, dur: 2.4 };
  const TIPS = ['Dica: arraste para girar Marte e role para dar zoom.', 'Clique em Marte para abrir o mapa dos locais mais famosos!'];
  const say = (txt, hold = 6) => { bubble.textContent = txt; bubble.classList.add('pop'); setTimeout(() => bubble.classList.remove('pop'), 200); lockUntil = T + hold; };
  function startFlight(end, spin) {
    const p = camera.position;
    Object.assign(fly, { on: true, t: 0, d0: p.clone().normalize(), r0: p.length(), d1: end.clone().normalize(), r1: end.length(), y0: mars.rotation.y, y1: spin === undefined ? mars.rotation.y : spin }); controls.enabled = false;
  }
  function toMap() {
    mode = 'map'; focus = null; markerK = 0; SITES.forEach(s => s.g.visible = true); panel.classList.remove('open');
    startFlight(camera.position.clone().normalize().multiplyScalar(7)); acts.hidden = false; backBtn.textContent = '↩ Voltar ao espaço'; jump = 1;
    say('Mapa de Marte! Clique num marcador brilhante: Monte Olimpo, Valles Marineris, Cratera Jezero ou Cratera Gale.', 9);
  }
  function toSpace() { mode = 'space'; focus = null; SITES.forEach(s => s.g.visible = false); markerK = 0; panel.classList.remove('open'); acts.hidden = true; startFlight(new THREE.Vector3(0, 1.5, 14)); say('De volta à órbita! Clique em Marte para explorar de novo.', 8); }
  function backToMap() { mode = 'map'; focus = null; panel.classList.remove('open'); startFlight(camera.position.clone().normalize().multiplyScalar(7)); backBtn.textContent = '↩ Voltar ao espaço'; say('Voltamos ao mapa. Escolha outro marcador!', 8); }
  function focusSite(s) {
    mode = 'site'; focus = s; jump = 1;
    const tilt = R.degToRad(25), d = new THREE.Vector3(-0.55, 0.05, 0.83).normalize(), w = d.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), -tilt), cur = mars.rotation.y;
    let th = Math.atan2(w.x, w.z) - Math.atan2(s.m.x, s.m.z); th = cur + Math.atan2(Math.sin(th - cur), Math.cos(th - cur));
    startFlight(s.m.clone().applyEuler(new THREE.Euler(0, th, tilt, 'ZYX')).multiplyScalar(4.4), th);
    $('pt').textContent = s.name; $('pc').textContent = s.sub; $('px').textContent = s.txt; $('pd').innerHTML = s.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('');
    panel.classList.add('open'); acts.hidden = false; backBtn.textContent = '↩ Voltar ao mapa'; say('Veja os dados de ' + s.name + ' no painel ao lado!', 8);
  }
  const mapfile = $('mapfile'); // aplica a foto real escolhida no computador (sem CORS: usa blob local)
  $('mapbtn').onclick = () => mapfile.click();
  mapfile.onchange = () => {
    const f = mapfile.files[0]; if (!f) return; const url = URL.createObjectURL(f);
    new THREE.TextureLoader().load(url, tex => {
      URL.revokeObjectURL(url); if (!mars) return;
      tex.encoding = THREE.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const m = mars.material; if (m.map) m.map.dispose(); if (m.normalMap) m.normalMap.dispose(); if (m.bumpMap && m.bumpMap !== m.map) m.bumpMap.dispose();
      m.map = tex; m.normalMap = null; m.bumpMap = tex; m.bumpScale = 0.025; m.needsUpdate = true; say('Mapa real aplicado! Marte agora usa a sua foto.', 8);
    }, undefined, () => { URL.revokeObjectURL(url); say('Não consegui abrir essa imagem. Tente um .jpg ou .png.', 8); });
    mapfile.value = '';
  };
  landBtn.onclick = () => enterSurface();
  $('pclose').onclick = () => mode === 'site' && backToMap();
  backBtn.onclick = () => mode === 'surface' ? exitSurface() : mode === 'site' ? backToMap() : toSpace();
  const setM = e => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera); };
  const pick = () => { if (!mars) return null; const r = ray.intersectObjects(mode === 'space' ? [mars] : [mars, ...hits]); return r.length ? r[0].object : null; };
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (mode === 'surface') return;
    if (moved > 5) { if (mode === 'space' && T > lockUntil) say('Isso! Gire para ver outras regiões.', 5); return; }
    setM(e); const o = pick(); if (!o) return;
    if (o.userData.site) focusSite(o.userData.site); else if (mode === 'space') toMap(); else { pulse = 1; jump = 1; }
  });
  canvas.addEventListener('wheel', e => { if (mode === 'surface') { surfCam.fov = Math.max(25, Math.min(70, surfCam.fov + e.deltaY * 0.03)); surfCam.updateProjectionMatrix(); return; } if (mode === 'space' && T > lockUntil) say('Zoom! Chegue perto para ver as crateras. 🔭', 5); }, { passive: true });
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight) * 2 + 1; });
  canvas.addEventListener('pointermove', e => { if (down || mode === 'surface') return; setM(e); canvas.style.cursor = pick() ? 'pointer' : 'grab'; });

  // ---------- Modo Superfície (Mars Pathfinder · Ares Vallis, Chryse Planitia) ----------
  const surf = new THREE.Scene(), surfCam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 2000), surfBtn = $('surf'), busy = $('busy');
  surf.add(surfCam); surf.fog = new THREE.FogExp2(0xd6a67a, 0.017); surf.background = new THREE.Color(0xd6a67a);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  // neblina com altura (mais densa junto ao chão e ao horizonte): substitui os trechos de fog do three
  THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n varying float vFogDepth; varying float vFogH;\n#endif';
  THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n vFogDepth = -mvPosition.z; vFogH = dot(viewMatrix[1].xyz, mvPosition.xyz - viewMatrix[3].xyz);\n#endif';
  THREE.ShaderChunk.fog_pars_fragment = '#ifdef USE_FOG\n uniform vec3 fogColor; varying float vFogDepth; varying float vFogH;\n #ifdef FOG_EXP2\n uniform float fogDensity;\n #else\n uniform float fogNear; uniform float fogFar;\n #endif\n#endif';
  THREE.ShaderChunk.fog_fragment = '#ifdef USE_FOG\n #ifdef FOG_EXP2\n float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);\n fogFactor = clamp(fogFactor * (0.6 + 0.8 * exp(-max(vFogH, 0.0) * 0.07)), 0.0, 1.0);\n #else\n float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);\n #endif\n gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);\n#endif';
  const TN = 1024, TS = 160, TH = 6, TB = -2.4, tH = new Float32Array(TN * TN), SUNV = new THREE.Vector3(-0.78, 0.5, -0.37).normalize();
  let shownMode = '', surfReady = false, composer = null, rover, bigRock, roverCol, sunL, yaw = 0, pitch = -0.14, rvTh = 0, lx = 0, ly = 0, bob = 0; const wheels = [], colliders = [], keys = {}, pp = { x: 0, z: 0.6, y: 0 };
  const Hf = (x, z) => { // altura (m) do terreno: mesma amostragem do mapa de displacement
    const fx = Math.min(TN - 1.001, Math.max(0, (x / TS + 0.5) * TN - 0.5)), fy = Math.min(TN - 1.001, Math.max(0, (z / TS + 0.5) * TN - 0.5)), x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
    return lp(lp(tH[y0 * TN + x0], tH[y0 * TN + x0 + 1], tx), lp(tH[(y0 + 1) * TN + x0], tH[(y0 + 1) * TN + x0 + 1], tx), ty) * TH + TB;
  };
  function blocked(x, z, pr = 0.35) { // colisão simples: círculos (rochas, mastro, rover) e retângulos girados (painéis)
    for (const c of colliders) {
      if (c.rect) { const dx = x - c.x, dz = z - c.z, co = Math.cos(c.ry), si = Math.sin(c.ry), px = dx * co - dz * si, pz = dx * si + dz * co; if (Math.abs(px) < c.w / 2 + pr && Math.abs(pz) < c.d / 2 + pr) return true; }
      else if (Math.hypot(x - c.x, z - c.z) < c.r + pr) return true;
    }
    return false;
  }
  const SURF_TIPS = ['Bem-vindo a Ares Vallis, em Chryse Planitia! Foi aqui que a Mars Pathfinder pousou, em 4 de julho de 1997. Use WASD ou setas para andar!',
    'Os painéis em primeiro plano são as "pétalas" solares do módulo de pouso, que alimentavam a estação.',
    'À direita, o Sojourner: com 65 cm de comprimento, foi o primeiro rover a rodar em Marte. Ele analisou rochas como a "Yogi".',
    'As rochas escuras e porosas foram arrastadas por enchentes gigantes, há bilhões de anos. A poeira ferrugem se acumula no topo.',
    'O céu cor de caramelo vem da poeira fina em suspensão. Aqui a gravidade é só 38% da terrestre!',
    'Segure Shift para correr. Lá longe, na névoa de poeira, ficam os "Twin Peaks", dois montes que a Pathfinder fotografou.'];

  // --- ruído periódico (tileável) para a textura de detalhe ---
  const hash2 = (a, b) => { let x = Math.imul(a, 374761393) ^ Math.imul(b, 668265263); x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967295; };
  const tnoise = (x, y, P) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), m = k => ((k % P) + P) % P; return lp(lp(hash2(m(xi), m(yi)), hash2(m(xi + 1), m(yi)), u), lp(hash2(m(xi), m(yi + 1)), hash2(m(xi + 1), m(yi + 1)), u), v); };
  const tfbm = (x, y, P, o) => { let s = 0, a = 0.5, n = 0; for (let i = 0; i < o; i++) { s += a * tnoise(x * (1 << i), y * (1 << i), P * (1 << i)); n += a; a *= 0.5; } return s / n; };
  function detailTex() { // R,G = normal tangente; B = altura. Areia fina, cascalho e marcas de vento
    const N = 512, hh = new Float32Array(N * N), rnd = Math.random;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N, v = y / N; hh[y * N + x] = tfbm(u * 8, v * 8, 8, 5) * 0.55 + tfbm(u * 64, v * 64, 64, 2) * 0.25 + 0.05 * Math.sin((u * 12 + tfbm(u * 4, v * 4, 4, 3) * 1.4) * 6.2832) * (0.4 + tfbm(u * 6, v * 6, 6, 2)); }
    for (let n = 0; n < 900; n++) { const px = rnd() * N | 0, py = rnd() * N | 0, r = 2 + Math.pow(rnd(), 2) * 6, ht = 0.12 + rnd() * 0.15; for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const d = Math.hypot(dx, dy) / r; if (d < 1) hh[((py + dy + N) % N) * N + (px + dx + N) % N] += ht * Math.sqrt(1 - d * d); } }
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N), cl = v => Math.max(0, Math.min(255, (v * 0.5 + 0.5) * 255));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x, xa = (x - 1 + N) % N, xb = (x + 1) % N, ya = (y - 1 + N) % N, yb = (y + 1) % N, p = i * 4; im.data[p] = cl((hh[y * N + xa] - hh[y * N + xb]) * 7); im.data[p + 1] = cl((hh[yb * N + x] - hh[ya * N + x]) * 7); im.data[p + 2] = Math.min(255, Math.max(0, hh[i] * 255)); im.data[p + 3] = 255; }
    g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  }
  function addDetail(mat, tex, s1, s2, str) { // granulação em espaço-mundo (triplanar), em duas escalas, sobre normal e albedo
    mat.customProgramCacheKey = () => 'dt' + s1 + '_' + s2 + '_' + str;
    mat.onBeforeCompile = sh => {
      sh.uniforms.dTex = { value: tex };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D dTex; varying vec3 vWP; varying vec3 vWN;\nvoid dTri(float s, out vec3 off, out float hh){ vec3 wn=pow(abs(normalize(vWN)),vec3(4.0)); wn/=(wn.x+wn.y+wn.z); vec4 a=texture2D(dTex,vWP.zy*s), b=texture2D(dTex,vWP.xz*s), c=texture2D(dTex,vWP.xy*s); vec2 ga=a.rg*2.0-1.0, gb=b.rg*2.0-1.0, gc=c.rg*2.0-1.0; off=wn.x*vec3(0.0,ga.y,ga.x)+wn.y*vec3(gb.x,0.0,gb.y)+wn.z*vec3(gc.x,gc.y,0.0); hh=wn.x*a.b+wn.y*b.b+wn.z*c.b; }')
        .replace('#include <map_fragment>', '#include <map_fragment>\nvec3 o1, o2; float h1, h2; dTri(' + s1.toFixed(2) + ', o1, h1); dTri(' + s2.toFixed(2) + ', o2, h2); diffuseColor.rgb *= 0.6 + 0.9 * mix(h1, h2, 0.5);')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal + (viewMatrix * vec4((o1 + 0.7 * o2) * ' + str.toFixed(2) + ', 0.0)).xyz);');
    };
  }
  function smoothNormals(g) { // normais suaves (funde vértices coincidentes) para rochas orgânicas
    const p = g.attributes.position, acc = new Map(), key = i => Math.round(p.getX(i) * 1e4) + '_' + Math.round(p.getY(i) * 1e4) + '_' + Math.round(p.getZ(i) * 1e4), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) { A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); C.fromBufferAttribute(p, i + 2); const f = B.sub(A).cross(C.sub(A)); for (let j = 0; j < 3; j++) { const k = key(i + j); (acc.get(k) || acc.set(k, new THREE.Vector3()).get(k)).add(f); } }
    const nr = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const v = acc.get(key(i)).clone().normalize(); nr.set([v.x, v.y, v.z], i * 3); } g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
  }
  function rockGeo(seed) { // rocha vulcânica: subdivisão alta + deslocamento multi-oitava + poros; cor: cinza, ferrugem e poeira no topo
    const g = new THREE.IcosahedronGeometry(1, 5), p = g.attributes.position, n = p.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), pore = perlin(x * 18 + seed, y * 18, z * 18), d = 1 + 0.3 * perlin(x * 1.1 + seed, y * 1.1, z * 1.1) + 0.15 * perlin(x * 2.6 + seed, y * 2.6, z * 2.6) + 0.06 * perlin(x * 6 + seed, y * 6, z * 6) + 0.025 * perlin(x * 14 + seed, y * 14, z * 14) - 0.2 * Math.max(0, pore - 0.25); p.setXYZ(i, x * d, y * d * 0.7, z * d); }
    smoothNormals(g); const nr = g.attributes.normal;
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = 0.5 + 0.5 * perlin(x * 1.7 + seed * 3, y * 1.7, z * 1.7), pit = Math.max(0, perlin(x * 18 + seed, y * 18, z * 18) - 0.25) * 2, top = Math.min(1, Math.max(0, (nr.getY(i) - 0.35) / 0.5)) * (0.55 + 0.45 * (0.5 + 0.5 * perlin(x * 5, y * 5, z * 5 + seed))) * 0.7;
      const k = 1 - pit * 0.45, r = lp(lp(58, 104, t), 176, top), gg = lp(lp(53, 62, t), 118, top), b = lp(lp(51, 42, t), 82, top);
      col.set([Math.pow(r * k / 255, 2.2), Math.pow(gg * k / 255, 2.2), Math.pow(b * k / 255, 2.2)], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
  }
  function wheelGeo() { // roda dentada do Sojourner
    const g = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 48, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); if (Math.hypot(x, z) > 0.01) { const k = Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI / 12)) % 2 ? 1.22 : 1; p.setXYZ(i, x * k, p.getY(i), z * k); } }
    g.computeVertexNormals(); return g.rotateZ(Math.PI / 2);
  }
  const cellT = (() => { // células fotovoltaicas com barramentos
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#0c1430'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const x = i * 64 + 3, y = j * 64 + 3, gr = g.createLinearGradient(x, y, x + 58, y + 58), b = 0.85 + Math.random() * 0.3; gr.addColorStop(0, `rgb(${30 * b | 0},${52 * b | 0},${108 * b | 0})`); gr.addColorStop(1, `rgb(${16 * b | 0},${30 * b | 0},${72 * b | 0})`); g.fillStyle = gr; g.fillRect(x, y, 58, 58); g.strokeStyle = 'rgba(190,170,110,.55)'; g.lineWidth = 1.5; [16, 29, 42].forEach(o => { g.beginPath(); g.moveTo(x, y + o); g.lineTo(x + 58, y + o); g.stroke(); }); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();
  function dustTex() { // poeira marciana acumulada nas bordas do painel
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(188,122,84,.8)'); gr.addColorStop(1, 'rgba(188,122,84,0)'); g.fillStyle = gr; g.fillRect(rx, ry, rw, rh); };
    edge(0, 0, 0, 40, 0, 0, 256, 40); edge(0, 256, 0, 216, 0, 216, 256, 40); edge(0, 0, 40, 0, 0, 0, 40, 256); edge(256, 0, 216, 0, 216, 0, 40, 256);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(188,122,84,${0.1 + Math.random() * 0.2})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function buildRover() { // Sojourner: rocker-bogie, rodas dentadas, antena, câmeras, APXS e painel solar
    const g = new THREE.Group(), V = (x, y, z) => new THREE.Vector3(x, y, z), add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    const bar = (a, b, r, mat) => { const d = new THREE.Vector3().subVectors(b, a), len = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.divideScalar(len)); m.castShadow = true; g.add(m); };
    const white = M(0xd2cbc2, 0.5, 0.5), dark = M(0x23262e, 0.5, 0.55), gold = M(0xc79b3c, 0.85, 0.3), metal = M(0x9aa0aa, 0.8, 0.35), pt = cellT.clone(), wg = wheelGeo(); pt.needsUpdate = true; pt.repeat.set(3, 3);
    add(new THREE.BoxGeometry(0.5, 0.16, 0.62), white, 0, 0.3, 0); add(new THREE.BoxGeometry(0.52, 0.03, 0.64), metal, 0, 0.22, 0);
    add(new THREE.BoxGeometry(0.46, 0.012, 0.58), new THREE.MeshPhysicalMaterial({ map: pt, metalness: 0.35, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15 }), 0, 0.386, 0);
    add(new THREE.BoxGeometry(0.2, 0.1, 0.12), gold, 0, 0.3, 0.37);
    [-0.06, 0.06].forEach(x => { add(new THREE.BoxGeometry(0.05, 0.05, 0.05), dark, x, 0.34, 0.43); add(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 10).rotateX(Math.PI / 2), M(0x0a1020, 0.9, 0.1), x, 0.34, 0.46); });
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), metal, 0.1, 0.2, -0.36); add(new THREE.BoxGeometry(0.12, 0.04, 0.1), dark, -0.12, 0.42, -0.2);
    bar(V(0.16, 0.39, -0.24), V(0.16, 0.86, -0.22), 0.006, dark); add(new THREE.SphereGeometry(0.012, 8, 6), dark, 0.16, 0.87, -0.22);
    [-1, 1].forEach(s => {
      const x = 0.28 * s, piv = V(x, 0.24, 0.02), joint = V(x, 0.16, -0.12), ws = [V(0.3 * s, 0.065, 0.24), V(0.3 * s, 0.065, 0), V(0.3 * s, 0.065, -0.24)];
      bar(piv, ws[0], 0.011, metal); bar(piv, joint, 0.011, metal); bar(joint, ws[1], 0.011, metal); bar(joint, ws[2], 0.011, metal); bar(V(x, 0.24, -0.2), piv, 0.008, dark);
      ws.forEach(p => { wheels.push(add(wg, dark, p.x, p.y, p.z)); add(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8).rotateZ(Math.PI / 2), metal, p.x, p.y, p.z); });
    });
    g.scale.setScalar(1.3); g.rotation.order = 'YXZ'; return g;
  }
  function buildSurface() {
    const rnd = Math.random, o = rnd() * 90, sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let y = 0; y < TN; y++) { // altura: colinas, ondulações, dunas pequenas, "Twin Peaks" e área plana junto ao módulo
      const z = (y / TN - 0.5) * TS;
      for (let x = 0; x < TN; x++) {
        const wx = (x / TN - 0.5) * TS;
        let v = pf(wx * 0.011 + o, z * 0.011, 5.5, 5) * 0.6 + pf(wx * 0.05, z * 0.05 + o, 1.2, 3) * 0.22 + 0.018 * Math.sin(wx * 0.9 + z * 0.35 + pf(wx * 0.08, z * 0.08, 9.1, 2) * 5);
        v += 0.34 * Math.exp(-((wx + 9) ** 2 + (z + 60) ** 2) / 150) + 0.27 * Math.exp(-((wx - 7) ** 2 + (z + 62) ** 2) / 110);
        tH[y * TN + x] = Math.min(1, Math.max(0, lp(0.4, v - 0.08, sm(5, 22, Math.hypot(wx, z)))));
      }
    }
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = TN; const g = c.getContext('2d'); return [c, g, g.createImageData(TN, TN)]; };
    const [cc, cg, ci] = mk(), [nc, ng, ni] = mk(), [dc, dg, di] = mk(), c = [0, 0, 0], mi = (a, b, t) => { c[0] = a[0] + (b[0] - a[0]) * t; c[1] = a[1] + (b[1] - a[1]) * t; c[2] = a[2] + (b[2] - a[2]) * t; };
    const LOW = [118, 64, 40], SAND = [184, 106, 62], LIGHT = [208, 146, 96], GRAVEL = [96, 72, 58], OXIDE = [168, 70, 40], tx = TS / TN;
    for (let y = 0; y < TN; y++) {
      const z = (y / TN - 0.5) * TS;
      for (let x = 0; x < TN; x++) {
        const i = y * TN + x, p = i * 4, wx = (x / TN - 0.5) * TS, v = tH[i], tone = pf(wx * 0.06 + o, z * 0.06, 3.3, 3), gm = sm(0.55, 0.7, pf(wx * 0.03 + o, z * 0.03, 7.7, 3)), ox = sm(0.58, 0.78, pf(wx * 0.04, z * 0.04 + o, 2.2, 3)), st = pf(wx * 0.02, z * 0.4 + o, 4.4, 2);
        mi(LOW, SAND, sm(0.25, 0.6, v)); mi(c, LIGHT, sm(0.5, 0.75, tone) * 0.6); mi(c, OXIDE, ox * 0.4); mi(c, GRAVEL, gm * 0.55); if (rnd() < 0.02 + gm * 0.06) mi(c, GRAVEL, 0.8);
        const k = (0.9 + 0.2 * rnd()) * (0.9 + 0.2 * st); ci.data[p] = c[0] * k; ci.data[p + 1] = c[1] * k; ci.data[p + 2] = c[2] * k; ci.data[p + 3] = 255;
        const xa = Math.max(0, x - 1), xb = Math.min(TN - 1, x + 1), ya = Math.max(0, y - 1), yb = Math.min(TN - 1, y + 1);
        const dx = (tH[y * TN + xb] - tH[y * TN + xa]) * TH / (2 * tx) * 1.3, dz = (tH[yb * TN + x] - tH[ya * TN + x]) * TH / (2 * tx) * 1.3, l = Math.hypot(dx, dz, 1);
        ni.data[p] = (-dx / l * 0.5 + 0.5) * 255; ni.data[p + 1] = (dz / l * 0.5 + 0.5) * 255; ni.data[p + 2] = (1 / l * 0.5 + 0.5) * 255; ni.data[p + 3] = 255;
        di.data[p] = di.data[p + 1] = di.data[p + 2] = v * 255; di.data[p + 3] = 255;
      }
    }
    cg.putImageData(ci, 0, 0); ng.putImageData(ni, 0, 0); dg.putImageData(di, 0, 0);
    const map = new THREE.CanvasTexture(cc); map.encoding = THREE.sRGBEncoding; const nm = new THREE.CanvasTexture(nc), dm = new THREE.CanvasTexture(dc), dt = detailTex(); [map, nm].forEach(t => t.anisotropy = 8);
    const gmat = new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(1.2, 1.2), displacementMap: dm, displacementScale: TH, displacementBias: TB, roughness: 1, metalness: 0 }); addDetail(gmat, dt, 0.9, 3.7, 1.1);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(TS, TS, 448, 448).rotateX(-Math.PI / 2), gmat); ground.receiveShadow = true; surf.add(ground);
    // céu em degradê bege-alaranjado (mesma cor da neblina no horizonte); a versão "lin" alimenta o mapa de ambiente
    const domeMat = lin => new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sd: { value: SUNV }, lin: { value: lin } },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 sd; uniform float lin; varying vec3 vP; void main(){ vec3 d=normalize(vP); float h=clamp(d.y,0.0,1.0); vec3 hor=vec3(0.84,0.65,0.48), zen=vec3(0.62,0.42,0.31); vec3 c=mix(hor,zen,pow(h,0.5)); float s=max(dot(d,sd),0.0); c+=vec3(1.0,0.75,0.55)*pow(s,6.0)*0.25+vec3(1.0,0.85,0.7)*pow(s,60.0)*0.35; c=mix(c,hor,smoothstep(0.0,-0.2,d.y)); c=mix(c,pow(c,vec3(2.2)),lin); float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)/255.0; gl_FragColor=vec4(c+n*(1.0-lin),1.0); }' });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), domeMat(0)); dome.renderOrder = -10; dome.frustumCulled = false; dome.name = 'dome'; surf.add(dome);
    const envS = new THREE.Scene(); envS.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), domeMat(1)));
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.9, 0.75).multiplyScalar(25) })); sunDisc.position.copy(SUNV).multiplyScalar(800); envS.add(sunDisc);
    surf.environment = new THREE.PMREMGenerator(renderer).fromScene(envS, 0.02, 1, 2000).texture;
    // sol forte com sombras nítidas + luz hemisférica quente refletida do solo avermelhado
    sunL = new THREE.DirectionalLight(0xffe0bf, 3.4); sunL.castShadow = true; const sz = Math.min(4096, renderer.capabilities.maxTextureSize); sunL.shadow.mapSize.set(sz, sz);
    Object.assign(sunL.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 150 }); sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.03;
    surf.add(sunL, sunL.target, new THREE.HemisphereLight(0xffd7ae, 0xb35a36, 0.25));
    // painéis solares (primeiro plano): células, clearcoat, parafusos, cabos e poeira nas bordas
    const petal = (w, d, x, z, ry) => {
      const g = new THREE.Group(), t = cellT.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w * 1.2)), Math.max(1, Math.round(d * 1.2)));
      const fr = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), M(0xb4a99c, 0.55, 0.5)), pn = new THREE.Mesh(new THREE.BoxGeometry(w - 0.14, 0.02, d - 0.14), new THREE.MeshPhysicalMaterial({ map: t, metalness: 0.35, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }));
      pn.position.y = 0.035; const ds = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.14, d - 0.14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: dustTex(), transparent: true, depthWrite: false, roughness: 1 })); ds.position.y = 0.0465;
      const pts = []; for (let s = -w / 2 + 0.2; s < w / 2 - 0.1; s += 0.35) pts.push([s, d / 2 - 0.035], [s, -d / 2 + 0.035]); for (let s = -d / 2 + 0.2; s < d / 2 - 0.1; s += 0.35) pts.push([w / 2 - 0.035, s], [-w / 2 + 0.035, s]);
      const sc = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 8), M(0x4f545e, 0.85, 0.4), pts.length), o3 = new THREE.Object3D(); pts.forEach(([px, pz], i) => { o3.position.set(px, 0.033, pz); o3.updateMatrix(); sc.setMatrixAt(i, o3.matrix); });
      [fr, pn].forEach(m => m.castShadow = m.receiveShadow = true); ds.receiveShadow = true; g.add(fr, pn, ds, sc); g.position.set(x, Hf(x, z) + 0.11, z); g.rotation.set(0.03, ry, 0); surf.add(g);
      const e = d / 2 + 0.05, p0 = [x + Math.sin(ry) * e, z + Math.cos(ry) * e]; // cabo seguindo o chão em direção ao módulo
      const cv = new THREE.CatmullRomCurve3([[p0[0], p0[1]], [p0[0] * 0.8, p0[1] + 0.5], [p0[0] * 0.5, p0[1] + 1.1], [p0[0] * 0.2, 2.2]].map(([a, b]) => new THREE.Vector3(a, Hf(a, b) + 0.03, b)));
      const cb = new THREE.Mesh(new THREE.TubeGeometry(cv, 24, 0.012, 6), M(0x1b1b1f, 0.2, 0.7)); cb.castShadow = true; surf.add(cb); colliders.push({ rect: true, x, z, w, d, ry });
    };
    petal(2.6, 1.9, 0, -3.3, 0); petal(2.4, 1.7, -2.7, -3.1, 0.6); petal(2.4, 1.7, 2.7, -3.1, -0.6);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 10), M(0xb9bdc6, 0.6, 0.4)), dish = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 10, 0, 6.2832, 0, 1.2), M(0xd8dadf, 0.5, 0.4, { side: THREE.DoubleSide }));
    mast.position.set(-1.7, Hf(-1.7, -4.2) + 0.65, -4.2); dish.position.set(-1.7, mast.position.y + 0.7, -4.2); dish.rotation.set(-1.0, 0.5, 0); [mast, dish].forEach(m => { m.castShadow = true; surf.add(m); }); colliders.push({ x: -1.7, z: -4.2, r: 0.08 });
    // rochas vulcânicas orgânicas (8 formas × muitas instâncias) + cascalho espalhado
    const geos = [1, 2, 3, 4, 5, 6, 7, 8].map(s => rockGeo(s * 13.7)), rmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }); addDetail(rmat, dt, 4.5, 14, 1.3);
    const addRock = (x, z, sx, sy, sz) => { const m = new THREE.Mesh(geos[rnd() * 8 | 0], rmat); m.scale.set(sx, sy, sz); m.position.set(x, Hf(x, z) + sy * 0.12, z); m.rotation.set((rnd() - 0.5) * 0.4, rnd() * 6.28, (rnd() - 0.5) * 0.4); m.castShadow = m.receiveShadow = true; surf.add(m); if (Math.max(sx, sz) > 0.45) colliders.push({ x, z, r: Math.max(sx, sz) * 0.85 }); return m; };
    bigRock = addRock(4.6, -8.2, 1.5, 1.1, 1.25);
    for (let n = 0; n < 340; n++) {
      const x = (rnd() - 0.5) * 100, z = -rnd() * 60 + (rnd() < 0.2 ? rnd() * 30 : 0), s = (0.1 + Math.pow(rnd(), 3) * 0.75) * (rnd() < 0.08 ? 1.8 : 1);
      if (Math.hypot(x - bigRock.position.x, z - bigRock.position.z) < 3.8 || blocked(x, z, s * 0.9)) continue; addRock(x, z, s * (0.8 + rnd() * 0.6), s * (0.5 + rnd() * 0.5), s * (0.8 + rnd() * 0.6));
    }
    const pg = [0, 1, 2].map(s => { const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.35 * perlin(x * 2 + s * 5, y * 2, z * 2); p.setXYZ(i, x * n, y * n * 0.6, z * n); } g.computeVertexNormals(); return g; }), d4 = new THREE.Object3D(), pc = new THREE.Color();
    pg.forEach(geo => {
      const NP = 2800, im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1 }), NP); let k = 0;
      while (k < NP) {
        const a = rnd() * 6.2832, r = Math.pow(rnd(), 0.7) * 68, x = Math.cos(a) * r, z = Math.sin(a) * r - 8; if (blocked(x, z, 0.12)) continue;
        const s = 0.025 + Math.pow(rnd(), 2.5) * 0.11, v = 0.28 + rnd() * 0.22, rr = rnd() < 0.5 ? 1.25 : 1;
        d4.position.set(x, Hf(x, z) + s * 0.2, z); d4.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); d4.scale.set(s * (1 + rnd() * 0.5), s * 0.7, s * (1 + rnd() * 0.5)); d4.updateMatrix(); im.setMatrixAt(k, d4.matrix);
        pc.setRGB(Math.pow(v * rr, 2.2), Math.pow(v * 0.85, 2.2), Math.pow(v * 0.72, 2.2)); im.setColorAt(k++, pc);
      }
      im.receiveShadow = true; im.frustumCulled = false; surf.add(im);
    });
    rover = buildRover(); surf.add(rover); roverCol = { x: 0, z: 0, r: 0.55 }; colliders.push(roverCol);
    if (THREE.EffectComposer && THREE.UnrealBloomPass) try { // pós-processamento: bloom sutil, com anti-aliasing por MSAA
      const pr = renderer.getPixelRatio(), W = innerWidth * pr | 0, H = innerHeight * pr | 0; let rt; try { rt = new THREE.WebGLMultisampleRenderTarget(W, H); rt.samples = 4; } catch (e) { rt = new THREE.WebGLRenderTarget(W, H); }
      rt.texture.encoding = THREE.sRGBEncoding; composer = new THREE.EffectComposer(renderer, rt); composer.addPass(new THREE.RenderPass(surf, surfCam)); composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.6, 0.85)); composer.addPass(new THREE.ShaderPass(THREE.CopyShader));
    } catch (e) { composer = null; }
  }
  function surfStep(t, dt) {
    const run = keys.ShiftLeft || keys.ShiftRight, fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), str = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), sm = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
    if (fwd || str) { // caminhada com colisão (desliza ao longo de obstáculos)
      const sp = (run ? 5.2 : 2.8) * dt / Math.hypot(fwd, str), sy = Math.sin(yaw), cy = Math.cos(yaw), dx = (-sy * fwd + cy * str) * sp, dz = (-cy * fwd - sy * str) * sp;
      if (!blocked(pp.x + dx, pp.z + dz)) { pp.x += dx; pp.z += dz; } else if (!blocked(pp.x + dx, pp.z)) pp.x += dx; else if (!blocked(pp.x, pp.z + dz)) pp.z += dz;
      pp.x = Math.max(-70, Math.min(70, pp.x)); pp.z = Math.max(-70, Math.min(70, pp.z)); bob += dt * (run ? 10 : 6.5);
    }
    pp.y += (Hf(pp.x, pp.z) + 1.6 + (fwd || str ? Math.sin(bob) * 0.035 : 0) - pp.y) * Math.min(1, dt * 14); // câmera segue o relevo
    surfCam.position.set(pp.x, pp.y + Math.sin(t * 0.6) * 0.01, pp.z); surfCam.rotation.set(pitch + Math.sin(t * 0.35) * 0.003, yaw, 0, 'YXZ'); surf.getObjectByName('dome').position.copy(surfCam.position);
    sunL.target.position.set(Math.round(pp.x / 2) * 2, 0, Math.round(pp.z / 2) * 2); sunL.position.copy(sunL.target.position).addScaledVector(SUNV, 70);
    const mov = sm(-0.35, 0.25, Math.sin(t * 0.3)); rvTh += dt * 0.07 * mov; // Sojourner passeia em volta da rocha grande
    const x = bigRock.position.x + 2.4 * Math.cos(rvTh), z = bigRock.position.z + 2.4 * Math.sin(rvTh), psi = Math.atan2(-Math.sin(rvTh), Math.cos(rvTh)), fx = Math.sin(psi), fz = Math.cos(psi), rx = Math.cos(psi), rz = -Math.sin(psi);
    rover.position.set(x, Hf(x, z), z); roverCol.x = x; roverCol.z = z;
    rover.rotation.set(-Math.atan2(Hf(x + fx * 0.3, z + fz * 0.3) - Hf(x - fx * 0.3, z - fz * 0.3), 0.6), psi, Math.atan2(Hf(x + rx * 0.25, z + rz * 0.25) - Hf(x - rx * 0.25, z - rz * 0.25), 0.5));
    wheels.forEach(w => w.rotation.x += dt * 2.2 * mov);
  }
  function enterSurface() {
    if (mode === 'surface') return;
    const go = () => {
      mode = 'surface'; focus = null; fly.on = false; panel.classList.remove('open'); controls.enabled = false; camera.remove(rig); surfCam.add(rig); renderer.toneMappingExposure = 1.05;
      pp.x = 0; pp.z = 0.6; pp.y = Hf(0, 0.6) + 1.6; yaw = 0; pitch = -0.14; surfCam.fov = 50; surfCam.updateProjectionMatrix(); $('hud').style.display = 'none'; $('hint').textContent = 'Use WASD ou setas para andar • Arraste o mouse para olhar';
      rp.x = -0.82; rp.y = -0.55; nextWp = 0; nextTip = T + 14; tipI = 1; say(SURF_TIPS[0], 12);
    };
    if (surfReady) return go();
    busy.hidden = false; requestAnimationFrame(() => setTimeout(() => { buildSurface(); surfReady = true; busy.hidden = true; go(); }, 30));
  }
  function exitSurface() {
    mode = 'space'; surfCam.remove(rig); camera.add(rig); renderer.toneMappingExposure = 1; for (const k in keys) keys[k] = false; $('hud').style.display = ''; $('hint').textContent = 'Arraste · Role para zoom · Clique em Marte';
    SITES.forEach(s => s.g.visible = false); markerK = 0; startFlight(new THREE.Vector3(0, 1.5, 14)); tipI = 0; nextTip = T + 14; say('De volta à órbita! Clique em Marte para explorar de novo.', 8);
  }
  surfBtn.onclick = enterSurface;
  addEventListener('keydown', e => { keys[e.code] = true; if (mode === 'surface' && e.code.startsWith('Arrow')) e.preventDefault(); });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  canvas.addEventListener('pointerdown', e => { lx = e.clientX; ly = e.clientY; });
  addEventListener('pointermove', e => { if (mode === 'surface' && down) { const f = surfCam.fov / 50; yaw += (e.clientX - lx) * 0.004 * f; pitch = Math.max(-0.7, Math.min(0.5, pitch + (e.clientY - ly) * 0.003 * f)); } lx = e.clientX; ly = e.clientY; });

  // ---------- Loop ----------
  const clock = new THREE.Clock(), camFl = new THREE.Vector3(), hv = new THREE.Vector3(), wp = { x: -0.82, y: -0.55 }, rp = { x: -0.82, y: -0.55 };
  const WPS = [[-0.82, -0.55], [-0.86, -0.05], [-0.8, 0.35], [-0.5, -0.72], [-0.7, -0.3], [-0.9, 0.1]];
  let lastT = 0, frame = 0, nextWp = 5, curWp = WPS[0], tiltX = 0, tiltZ = 0, nextTip = 14, tipI = 0;
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime(), dt = Math.min(0.05, t - lastT), W = innerWidth, H = innerHeight; lastT = t; T = t; const SURF = mode === 'surface', cam = SURF ? surfCam : camera;
    if (shownMode !== mode) { shownMode = mode; acts.hidden = false; surfBtn.hidden = SURF; backBtn.hidden = mode === 'space'; backBtn.textContent = mode === 'site' ? '↩ Voltar ao mapa' : '↩ Voltar ao espaço'; }
    if (!SURF) {
    sky.rotation.y += 0.00003;
    planets.forEach(p => { const a = p.a0 + p.amp * Math.sin(t * p.w + p.ph); p.g.position.set(SUN.x + p.r * Math.cos(a), SUN.y + p.y0 + p.r * 0.04 * Math.sin(a), SUN.z + p.r * Math.sin(a)); p.m.rotation.y += p.spin; });
    moons.forEach(o => { const a = t * o.w + o.ph; o.m.position.set(o.r * Math.cos(a), o.r * Math.sin(a) * Math.sin(o.inc), o.r * Math.sin(a) * Math.cos(o.inc)); o.m.rotation.y += 0.01; }); camera.position.sub(camFl);
    if (mars) {
      if (mode !== 'site' && !fly.on) mars.rotation.y += 0.0018;
      if (pulse > 0) { pulse = Math.max(0, pulse - 0.04); mars.scale.setScalar(1 + Math.sin(pulse * Math.PI) * 0.03); }
      if (mode !== 'space') markerK = Math.min(1, markerK + dt * 1.6);
      const mk = Math.max(0.001, markerK * markerK * (3 - 2 * markerK));
      SITES.forEach((s, i) => { s.g.scale.setScalar(mk); s.halo.scale.setScalar(0.5 + 0.15 * Math.sin(t * 3 + i * 2)); });
    }
    if (fly.on) {
      fly.t = Math.min(1, fly.t + dt / fly.dur); const k = fly.t, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const qi = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(fly.d0, fly.d1), e);
      camera.position.copy(fly.d0).applyQuaternion(qi).multiplyScalar(fly.r0 + (fly.r1 - fly.r0) * e); camera.lookAt(0, 0, 0); mars.rotation.y = fly.y0 + (fly.y1 - fly.y0) * e;
      if (k >= 1) { fly.on = false; controls.enabled = true; controls.update(); }
    } else controls.update();
    const a = 0.012 * camera.position.length(); // flutuação de gravidade zero
    camFl.set(Math.sin(t * 0.31) * a, Math.sin(t * 0.43 + 1) * a * 0.8, Math.sin(t * 0.23) * a * 0.5); camera.position.add(camFl); camera.rotateZ(Math.sin(t * 0.27) * 0.006);
    } else surfStep(t, dt);

    // robô: navega pela borda esquerda/inferior
    const k = SURF ? 1 : Math.min(1, Math.max(0.05, (camera.position.length() - 2.05) / 3.5)), cl = (v, m) => Math.max(-m, Math.min(m, v));
    if ((mode === 'space' || SURF) && t > lockUntil && t > nextTip) { const tl = SURF ? SURF_TIPS : TIPS; say(tl[tipI++ % tl.length], SURF ? 9 : 7); nextTip = t + (SURF ? 12 : 10); }
    if (mode === 'space' || SURF) { if (t > nextWp) { let n; do { n = WPS[Math.random() * WPS.length | 0]; } while (n === curWp); curWp = n; wp.x = n[0]; wp.y = n[1]; nextWp = t + 4 + Math.random() * 3; } } else { wp.x = -0.82; wp.y = -0.55; }
    const px0 = rp.x, py0 = rp.y, al = 1 - Math.exp(-dt * 1.1);
    rp.x += (wp.x + Math.sin(t * 0.7) * 0.03 - rp.x) * al; rp.y += (wp.y + Math.sin(t * 1.1) * 0.03 - rp.y) * al;
    const vx = dt > 0 ? (rp.x - px0) / dt : 0, vy = dt > 0 ? (rp.y - py0) / dt : 0;
    rig.position.set(rp.x * 3.6 * 0.4142 * cam.aspect, rp.y * 3.6 * 0.4142, -3.6).multiplyScalar(k); rig.scale.setScalar(k);
    key.distance = fill.distance = 5 * k; tipLight.distance = 1.4 * k;
    tiltZ += (cl(-vx * 0.5, 0.45) - tiltZ) * 0.1; tiltX += (cl(vy * 0.4, 0.35) - tiltX) * 0.1;
    robot.position.set(Math.sin(t * 0.7) * 0.07, Math.sin(t * 1.3) * 0.05 + Math.sin(jump * Math.PI) * 0.15, Math.sin(t * 0.5) * 0.05); jump = Math.max(0, jump - 0.025);
    robot.rotation.set(Math.sin(t * 0.5) * 0.05 + tiltX, -0.7 * rp.x + Math.sin(t * 0.6) * 0.15, Math.sin(t * 0.9) * 0.06 + tiltZ);
    head.rotation.y += (mx * 0.6 - head.rotation.y) * 0.08; head.rotation.x += (-my * 0.3 - head.rotation.x) * 0.08;
    arms[0].rotation.z = -0.3; arms[1].rotation.z = 2.4 + Math.sin(t * 5) * 0.25;
    const bl = 0.6 + 0.4 * Math.sin(t * 4); tipLight.intensity = 0.6 + 1.2 * bl; tip.scale.setScalar(0.8 + 0.4 * bl);
    flames.forEach((f, i) => { f.scale.y = 0.85 + 0.15 * Math.sin(t * 9 + i * 2); f.userData.g.material.opacity = 0.65 + 0.25 * Math.sin(t * 7 + i); });

    if (SURF && composer) composer.render(); else renderer.render(SURF ? surf : scene, cam);
    head.getWorldPosition(hv); hv.project(cam); // balão acompanha o robô
    const bw = bubble.offsetWidth, hx = (hv.x * 0.5 + 0.5) * W, bx = Math.min(W - bw - 8, Math.max(8, hx - bw / 2));
    bubble.style.left = bx + 'px'; bubble.style.setProperty('--tx', Math.min(bw - 20, Math.max(20, hx - bx)) + 'px'); bubble.style.top = 'auto'; bubble.style.bottom = (H - (-hv.y * 0.5 + 0.5) * H + 48) + 'px';
    if (mars && !SURF && frame++ % 6 === 0) {
      const p = mars.worldToLocal(camera.position.clone()), r = p.length(), lat = Math.asin(p.y / r) * 57.2958, lon = Math.atan2(-p.z, p.x) * 57.2958, f = v => Math.abs(v).toFixed(1).replace('.', ',');
      $('coords').innerHTML = `LAT ${f(lat)}°${lat < 0 ? 'S' : 'N'}<br>LON ${f(lon)}°${lon < 0 ? 'O' : 'L'}<br>ALT ${Math.round((r - 2) * 1694.75).toLocaleString('pt-BR')} km`;
      const d = camera.getWorldDirection(hv), hd = (Math.atan2(d.x, -d.z) * 57.2958 + 360) % 360;
      $('compass').textContent = 'RUMO ' + String(Math.round(hd) % 360).padStart(3, '0') + '° ' + ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(hd / 45) % 8];
    }
  }
  animate();
  addEventListener('resize', () => { camera.aspect = surfCam.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); surfCam.updateProjectionMatrix(); if (composer) { const pr = renderer.getPixelRatio(); composer.setSize(innerWidth * pr, innerHeight * pr); } renderer.setSize(innerWidth, innerHeight); });
})();
