/* ════════════════════════════════════════════════════════════════
   Jasmine Jacobs · portfolio
   Plain JS + three.js (loaded from a CDN, no build step).
   Everything personal you might want to edit lives in CONTENT below.
   ════════════════════════════════════════════════════════════════ */

const CONTENT = {
  email: "jasminejacobs11@icloud.com",
  linkedin: "https://www.linkedin.com/in/jasmine-jacobs-2ab8342bb/",

  // EDIT: little blanks only you can fill in. Leave "" and the chat just skips them.
  me: {
    games: "",        // e.g. "stardew valley and mario kart"
    piProject: "",    // e.g. "a little weather station that posts to my phone"
    favoriteBoba: "", // e.g. "brown sugar milk tea, 50% sweet"
  },

  // Optional: point this at your own AI endpoint later to make the chat a real LLM.
  // It gets POST { messages: [{role, content}] } and should return { reply: "..." }.
  // Leave "" to use the built-in replies below (works on GitHub Pages, no keys needed).
  agentEndpoint: "",

  funFacts: [
    "only 32.03% of 2×2 binary matrix pairs commute. i checked all 256 of them.",
    "i designed the Rider Report App Store preview screens. you can swipe them in lvl 2!",
    "i was on the IT team at Chicago Public Safety HQ during the CrowdStrike outage. wild week.",
    "the flower at the top of this page is a few hundred lines of three.js. no 3d models at all.",
    "my BNY pipeline chewed through 740K+ vulnerability records a week.",
  ],
};

/* ───────── tiny helpers ───────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInOut = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
// ?og renders the intro instantly, fully bloomed: used to capture the LinkedIn preview image
const OG = new URLSearchParams(location.search).has("og");
if (OG) document.documentElement.classList.add("og");
const reduceMotion = OG || matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function whenVisible(el, cb, opts = { threshold: 0.01 }) {
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), opts);
  io.observe(el);
}

function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 200,
    background: "#121522", border: "1px solid rgba(200,230,170,.3)", color: "#c6e39a",
    padding: "10px 16px", borderRadius: "12px", fontFamily: "var(--mono)", fontSize: ".8rem", maxWidth: "90vw",
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3800);
}

/* ═════════ 1. boot screen ═════════ */
async function boot() {
  const log = $("#boot-log");
  const lines = [
    "[ ok ] mounting /dev/jasmine",
    "[ ok ] loading three.js shaders",
    "[ ok ] brewing boba............ done",
    "[ ok ] waking up glow-buddies (5)",
    "> ./bloom --name jasmine",
  ];
  if (!reduceMotion) {
    for (const l of lines) { log.textContent += l + "\n"; await sleep(170); }
    await sleep(250);
  }
  $("#boot").classList.add("done");
}

/* ═════════ 2. binary rain ═════════ */
function binaryRain() {
  const c = $("#rain"), ctx = c.getContext("2d");
  let w, h, cols, drops;
  const fs = 16;
  const resize = () => {
    w = c.width = innerWidth; h = c.height = innerHeight;
    cols = Math.ceil(w / fs); drops = Array.from({ length: cols }, () => Math.random() * -h / fs);
  };
  resize(); addEventListener("resize", resize);
  let last = 0;
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (document.hidden || now - last < 60) return;
    last = now;
    ctx.fillStyle = "rgba(11,13,20,0.18)";
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${fs}px JetBrains Mono, monospace`;
    for (let i = 0; i < cols; i++) {
      const y = drops[i] * fs;
      ctx.fillStyle = Math.random() < 0.04 ? "#ff5c8a" : "#c6e39a";
      ctx.fillText(Math.random() < .5 ? "0" : "1", i * fs, y);
      drops[i] = y > h && Math.random() > 0.975 ? 0 : drops[i] + 1;
    }
  };
  if (!reduceMotion) requestAnimationFrame(tick);
}

/* ═════════ 3. hero: 3D jasmine bloom ═════════ */
function petalGeometry(THREE, len = 1.55, wid = 0.62) {
  const g = new THREE.PlaneGeometry(1, 1, 12, 28);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5;           // 0..1 across
    const v = p.getY(i) + 0.5;           // 0..1 along (base → tip)
    const w = Math.max(0.07, wid * Math.sin(Math.PI * Math.pow(v, 0.72)));
    let x = (u - 0.5) * w;
    let y = 0.55 * Math.pow((u - 0.5) * 2, 2) * w * 0.35 - 0.22 * v * v; // cupped + tip droop
    const z = v * len;
    const tw = 0.45 * v;                 // pinwheel twist along the petal
    const x2 = x * Math.cos(tw) - y * Math.sin(tw);
    const y2 = x * Math.sin(tw) + y * Math.cos(tw);
    p.setXYZ(i, x2, y2, z);
  }
  g.computeVertexNormals();
  return g;
}

function makeFlower(THREE, { petals = 5, color = 0xfffaf0, tint = 0xffe6ee, scale = 1 } = {}) {
  const flower = new THREE.Group();
  const petalMat = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.42, sheen: 1, sheenColor: new THREE.Color(tint), sheenRoughness: 0.4,
    side: THREE.DoubleSide, emissive: 0x2a2620, clearcoat: 0.3,
  });
  const geo = petalGeometry(THREE);
  const pivots = [];
  for (let i = 0; i < petals; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / petals) * Math.PI * 2;
    const hinge = new THREE.Group();
    const m = new THREE.Mesh(geo, petalMat);
    m.position.z = 0.04;
    hinge.add(m);
    pivot.add(hinge);
    flower.add(pivot);
    pivots.push(hinge);
  }
  // corolla tube + stem
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.05, 0.9, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf3f0df, roughness: 0.6, side: THREE.DoubleSide })
  );
  tube.position.y = -0.45;
  flower.add(tube);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.9, 0), new THREE.Vector3(0.1, -1.6, 0.05),
    new THREE.Vector3(-0.15, -2.4, 0), new THREE.Vector3(0.05, -3.4, -0.1),
  ]);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5f8f3e, roughness: 0.7 });
  flower.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.045, 8), stemMat));
  // leaves
  const leafGeo = petalGeometry(THREE, 1.2, 0.5);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x0d1a08 });
  [[-1.9, 0.6, -0.5], [-2.5, -2.4, -0.3]].forEach(([y, ry, rx]) => {
    const l = new THREE.Mesh(leafGeo, leafMat);
    l.position.set(0, y, 0); l.rotation.set(rx, ry, 0);
    flower.add(l);
  });
  // stamens
  const stamenMat = new THREE.MeshStandardMaterial({ color: 0xf2d46b, emissive: 0x6b5110, roughness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), stamenMat);
    const a = (i / 3) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.05, 0.1, Math.sin(a) * 0.05);
    flower.add(s);
  }
  flower.scale.setScalar(scale);
  flower.userData.hinges = pivots;
  flower.userData.mat = petalMat;
  return flower;
}

function setBloom(flower, t) {
  flower.userData.hinges.forEach((h, i) => {
    const local = clamp((t - i * 0.07) / 0.72, 0, 1);
    const e = easeOutBack(local);
    h.rotation.x = lerp(-1.42, -0.1, e);
    h.scale.setScalar(lerp(0.55, 1, clamp(e, 0, 1.1)));
  });
}

function glyphTexture(THREE, ch, color) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  x.fillStyle = color; x.font = "bold 48px JetBrains Mono, monospace";
  x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(ch, 32, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hero(THREE) {
  const canvas = $("#bloom");
  const heroEl = $("#hero");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.6, 8.5);

  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a2414, 1.1));
  const key = new THREE.DirectionalLight(0xfff1dd, 2.4); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc6e39a, 2.2); rim.position.set(-4, 2, -4); scene.add(rim);
  const pink = new THREE.PointLight(0xff5c8a, 2.5, 0, 0); pink.position.set(-2, -1, 2); scene.add(pink);

  const rig = new THREE.Group();
  scene.add(rig);
  const main = makeFlower(THREE);
  main.rotation.x = 0.75;
  rig.add(main);

  // two pink-tinged buds (real jasmine buds blush pink)
  const buds = [];
  [[-1.25, -0.9, -0.4, 0.5], [1.15, -1.5, -0.6, 0.42]].forEach(([x, y, z, s]) => {
    const b = makeFlower(THREE, { color: 0xffd9e4, tint: 0xff5c8a, scale: s });
    b.position.set(x, y, z); b.rotation.z = x > 0 ? -0.35 : 0.35;
    setBloom(b, 0); rig.add(b); buds.push(b);
  });

  // hologram pedestal rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xc6e39a, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(1.2 + i * 0.45, 1.215 + i * 0.45, 96, 1, 0, Math.PI * (1.2 + i * 0.3)), ringMat);
    r.rotation.x = -Math.PI / 2; r.position.y = -3.3;
    rig.add(r); rings.push(r);
  }

  // orbiting binary particles
  const bits = new THREE.Group();
  ["0", "1"].forEach((ch, k) => {
    const n = 260, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 2.6 + Math.random() * 2.6, a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 6;
      pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      size: 0.16, map: glyphTexture(THREE, ch, k ? "#c6e39a" : "#ff8fb0"), transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.75,
    });
    bits.add(new THREE.Points(g, m));
  });
  rig.add(bits);
  if (OG) bits.visible = false; // cleaner preview card

  // layout: flower sits right on desktop, top on mobile
  const resize = () => {
    const w = heroEl.clientWidth, h = heroEl.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const wide = w > 760;
    rig.position.set(wide ? 1.9 : 0, wide ? 1.75 : 2.2, 0);
    rig.scale.setScalar(wide ? 0.95 : 0.7);
    if (OG) { rig.position.set(2.35, 1.55, 0); rig.scale.setScalar(1.18); }
  };
  resize(); addEventListener("resize", resize);

  // pointer parallax
  let mx = 0, my = 0;
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

  let t0 = performance.now(), running = true, nameShown = false;
  const rebloom = () => { t0 = performance.now(); };
  canvas.addEventListener("click", rebloom);
  whenVisible(heroEl, (v) => { running = v; if (v) requestAnimationFrame(loop); });

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    const t = reduceMotion ? 1 : clamp((now - t0) / 3200, 0, 1);
    setBloom(main, t);
    const breathe = Math.sin(now / 1400) * 0.03;
    buds.forEach((b, i) => setBloom(b, 0.08 + Math.sin(now / 1800 + i) * 0.04));
    main.rotation.y = now / 9000 + breathe;
    rig.rotation.y = lerp(rig.rotation.y, mx * 0.6, 0.05);
    rig.rotation.x = lerp(rig.rotation.x, my * 0.25, 0.05);
    rings.forEach((r, i) => (r.rotation.z = now / (3000 + i * 1500) * (i % 2 ? -1 : 1)));
    bits.rotation.y = now / 14000;
    const scrollFade = clamp(1 - scrollY / innerHeight, 0, 1);
    canvas.style.opacity = 0.25 + 0.75 * scrollFade;
    if (!nameShown && t > 0.5) { nameShown = true; revealName(); }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}

async function typeInto(el, text, speed = 45) {
  if (reduceMotion) { el.textContent = text; return; }
  for (const ch of text) { el.textContent += ch; await sleep(speed); }
}

function splitName() {
  ["#name-first", "#name-last"].forEach((sel) => {
    const el = $(sel);
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c}</span>`).join("");
  });
}

let nameRevealed = false;
async function revealName() {
  if (nameRevealed) return;
  nameRevealed = true;
  const chars = $$(".name .ch");
  chars.forEach((c, i) => setTimeout(() => c.classList.add("in"), reduceMotion ? 0 : i * 75));
  setTimeout(() => $("#hero").classList.add("revealed"), chars.length * 75);
}

/* ═════════ 4. scroll reveals ═════════ */
function reveals() {
  const els = $$(".section-head, .desk .card, .window, .shelf-stage");
  els.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
}

/* ═════════ 5. intro: jasmine.ai, a chat in my own voice ═════════
   Every reply below is written in first person, the way I'd say it.
   EDIT freely: `keys` are words that trigger a reply, `say` is a list of
   ways I might answer (one is picked at random), `more` is what I say if
   someone asks "tell me more", `next` are the suggestion chips shown after. */
const AGENT_BRAIN = [
  { id: "greet", keys: ["hi", "hey", "hello", "yo", "sup", "hiya", "howdy", "good morning", "good afternoon", "good evening", "whats up"],
    say: [(c) => `hey${c.nameBit}! 👋 what do you want to know?`, (c) => `hi hi${c.nameBit}! ask me anything: school, projects, what i'm nerding out on lately.`],
    next: ["who are you?", "what are you working on?", "fun fact"] },
  { id: "how", keys: ["how are you", "hows it going", "how you doing", "how r u", "hru", "how is your day"],
    say: ["honestly? pretty good. probably holding a boba right now 🧋 how about you?", "doing good! currently in senior-year mode: classes, girls who code, and building fun stuff on the side."],
    next: ["what are you working on?", "what's on the shelf?"] },
  { id: "about", keys: ["who are you", "about you", "about yourself", "introduce", "tell me about", "who is jasmine", "whoami", "who r u"],
    say: ["i'm jasmine! a senior studying computer science at penn state with a math minor, graduating may 2027. i'm president of girls who code psu, i've interned at BNY, and i love building things people actually use, like rider report."],
    more: "the short version of what drives me: real problems + real users. rider report helps chicago commuters stay safe, my BNY pipeline helped leadership actually see their vulnerability backlog, and girls who code is how i pay it forward.",
    next: ["rider report?", "your internships", "what are you nerding out on?"] },
  { id: "school", keys: ["school", "college", "university", "penn state", "psu", "major", "minor", "degree", "graduate", "graduation", "year", "senior", "study"],
    say: ["computer science major, math minor, in penn state's college of engineering. i graduate may 2027, so it's senior year 🎓"],
    next: ["favorite classes?", "clubs?"] },
  { id: "home", keys: ["from", "hometown", "where do you live", "chicago", "home", "grow up", "grew up"],
    say: ["chicago → state college. chicago is where i built rider report and did my first two internships, so a lot of my story starts there."],
    next: ["rider report?", "what was the bean photo?"] },
  { id: "classes", keys: ["class", "classes", "course", "courses", "coursework", "taking", "took"],
    say: ["so far: programming & computation fundamentals, data structures & algorithms, linear algebra, probability, systems programming, database management, and computer organization & design."],
    more: "the low-level ones (computer organization, systems programming) are a big reason i'm leaning toward computer engineering. once you see how the bits move, you can't unsee it.",
    next: ["tell me more", "numerical analysis?", "hardware?"] },
  { id: "clubs", keys: ["club", "clubs", "girls who code", "gwc", "swe", "nsbe", "awc", "involved", "involvement", "activities", "leadership", "president"],
    say: ["i'm president of girls who code at penn state! i'm also in SWE (society of women engineers), the association of women in computing, and NSBE."],
    more: "running gwc is honestly one of my favorite things. it's the community i wish every girl walking into her first cs class had. there's a photo of us in lvl 4 on the shelf.",
    next: ["tell me more", "your internships"] },
  { id: "work", keys: ["experience", "internship", "internships", "intern", "work", "job", "jobs", "worked"],
    say: ["three so far: infrastructure production services at BNY (summer 2026), software engineering at everyone can code chicago (2024–25, that's rider report), and IT at SDI presence (summer 2024)."],
    next: ["what did you do at BNY?", "rider report?", "SDI?"] },
  { id: "bny", keys: ["bny", "bank of new york", "pittsburgh", "pipeline", "vulnerability", "qlik", "bnyconnect"],
    say: ["at BNY i built a weekly reporting pipeline (python/pandas, qlik sense, power query, docker) that cleaned 740K+ vulnerability records and briefed leadership every day. i also designed a remediation-routing framework that surfaced an 86.9% patchable rate and helped cut the backlog by 24,280 records."],
    more: "my favorite side project there was BNYConnect, an AI employee-matching prototype. i specified embedding-based similarity (skills, hobbies, mentorship goals) and prompt-engineered devin, an autonomous coding agent, to build the first version through gitlab ci/cd.",
    next: ["tell me more", "AI stuff?"] },
  { id: "sdi", keys: ["sdi", "sdi presence", "it intern", "data center", "crowdstrike", "powershell"],
    say: ["at SDI presence i supported data center ops for chicago public safety HQ: decommissioning servers, asset inventory, python + powershell automation. and yes, i was there for the crowdstrike outage. great crash course in what 'critical systems' means."],
    next: ["your internships", "hardware?"] },
  { id: "rider", keys: ["rider report", "rider", "cta", "app", "ios", "swift", "swiftui", "firebase", "firestore", "train", "everyone can code"],
    say: ["rider report is an iOS app for chicago CTA riders to share live updates and safety reports. i built the real-time map view in swiftui + firestore, with location filtering and one-tap 911. it's 5.0★ on the app store!"],
    more: "on the backend side i designed the firestore data structures and query patterns (cut refresh latency 40%) and squashed bugs that dropped crash rates 25%. i also designed the app store screenshots, which you can swipe through on the 3d iphone in lvl 2.",
    next: ["tell me more", "can i see the code?", "your research?"] },
  { id: "code", keys: ["code", "github", "repo", "source"],
    say: () => `my github is @nvmo0j, and more fun ai + personal projects are coming. the rider report repo is private, but email me (${CONTENT.email}) and i'll add you.`,
    next: ["AI stuff?", "contact"] },
  { id: "research", keys: ["research", "matrix", "matrices", "commutative", "commutativity", "poster", "paper", "numpy"],
    say: ["i tested every pair of 2×2 binary matrices (all 256 of them) to see how often AB = BA. only 32.03% commute! you can run the experiment yourself in lvl 3."],
    more: "my hypothesis was under 25%, so i was wrong in a fun way. over the first 16 pairs, 75% didn't commute, and it settled to 67.97% across the full set. mentored by robert a. zambanini, jr.",
    next: ["tell me more", "numerical analysis?"] },
  { id: "skills", keys: ["skills", "stack", "languages", "language", "tech stack", "tools", "python", "java", "c++", "sql"],
    say: ["languages: python (pandas, numpy), swift, java, c/c++, sql, assembly. backend: firebase, supabase. tools: git, docker, gitlab ci/cd, xcode, linux. plus AI pair-programming with copilot and devin."],
    next: ["AI stuff?", "rider report?"] },
  { id: "nerd", keys: ["nerding", "interested in", "interests", "into lately", "obsessed", "passion", "excited about"],
    say: ["right now: AI agents, the raspberry pi 5, numerical analysis, and the bloomberg terminal. pick one and i'll gush 😅"],
    next: ["AI stuff?", "raspberry pi?", "numerical analysis?", "bloomberg terminal?"] },
  { id: "ai", keys: ["ai", "artificial intelligence", "agent", "agents", "llm", "claude", "gemini", "openai", "chatgpt", "devin", "machine learning", "ml"],
    say: ["AI is my current obsession. i've worked with claude, gemini and openai models, prompt-engineered devin at BNY, and next i want to turn this exact chat into a real AI version of me."],
    more: "the goal: you talk to this window and it actually sounds like me, because it's grounded in my own writing, projects and opinions, not a generic chatbot.",
    next: ["tell me more", "are you real?"] },
  { id: "pi", keys: ["raspberry", "raspberry pi", "pi 5", "pi5", "rpi", "gpio"],
    say: (c) => "the raspberry pi 5! it's a tiny computer you can actually wire things to, which is my excuse to mix hardware and code." + (CONTENT.me.piProject ? ` right now i'm building ${CONTENT.me.piProject}.` : " project reveal coming soon 👀"),
    next: ["hardware?", "numerical analysis?"] },
  { id: "hardware", keys: ["hardware", "computer engineering", "assembly", "circuits", "chips", "low level", "low-level"],
    say: ["computer organization & design is where it clicked for me: assembly, datapaths, how the bits actually move. i'm leaning toward computer engineering, and the raspberry pi 5 is my playground."],
    next: ["raspberry pi?", "favorite classes?"] },
  { id: "numerical", keys: ["numerical", "numerical analysis", "numerical methods", "floating point", "approximation", "newton", "math"],
    say: ["numerical analysis is where my math minor meets cs: how computers approximate roots, integrals and linear systems, and how tiny floating-point errors snowball into big ones. my matrix research was a little taste of that world."],
    next: ["your research?", "bloomberg terminal?"] },
  { id: "bbg", keys: ["bloomberg", "terminal", "finance", "markets", "stocks", "fintech", "trading"],
    say: ["the bloomberg terminal! the keyboard alone is iconic. i love how it packs real-time market data, news and analytics into one very dense screen. it's basically a masterclass in data pipelines and power-user UI."],
    next: ["what did you do at BNY?", "numerical analysis?"] },
  { id: "hobbies", keys: ["hobby", "hobbies", "fun", "free time", "for fun", "weekend", "outside of"],
    say: ["collecting tiny glow-in-the-dark figures (they inspired the shelf below), boba runs, jazz on repeat, and tinkering with AI and my raspberry pi."],
    next: ["what's on the shelf?", "music?", "games?"] },
  { id: "shelf", keys: ["shelf", "buddies", "buddy", "figures", "figure", "glow", "collect"],
    say: ["the glow buddies on the shelf are inspired by the little glow-in-the-dark figures i collect. mine got antennas because… cs. click one to open a level!"],
    next: ["hobbies?", "fun fact"] },
  { id: "food", keys: ["boba", "food", "eat", "ramen", "drink", "tea", "coffee", "snack"],
    say: () => "boba first, always 🧋" + (CONTENT.me.favoriteBoba ? ` my order: ${CONTENT.me.favoriteBoba}.` : "") + " ramen is a close second.",
    next: ["hobbies?", "music?"] },
  { id: "music", keys: ["music", "song", "jazz", "listen", "playlist"],
    say: ["afro jazz on repeat. hit the jazz button in the top right corner and you'll hear what i mean ♪"],
    next: ["hobbies?", "games?"] },
  { id: "games", keys: ["game", "games", "gaming", "play", "playing", "video game"],
    say: () => CONTENT.me.games ? `lately: ${CONTENT.me.games}. got recs? i'm listening.` : "ooh, i'm taking game recs right now. what should i play next?",
    next: ["hobbies?", "fun fact"] },
  { id: "bean", keys: ["bean", "spark", "sophomore spark", "capital one", "discover", "program"],
    say: () => "that's me at the bean in chicago during the discover × capital one sophomore SPARK program, exploring the city with other college students. there's more in my linkedin post!",
    next: ["contact", "your internships"] },
  { id: "google", keys: ["google", "nyc", "new york"],
    say: ["that's me visiting google's office in nyc. i had to get the neon sign picture 😄"],
    next: ["your internships", "AI stuff?"] },
  { id: "hire", keys: ["hire", "hiring", "recruiter", "recruiting", "looking for", "open to", "opportunity", "opportunities", "role", "roles", "new grad", "full time", "full-time", "available", "goals", "future", "after graduation"],
    say: () => `i'm looking for software engineering, data, and AI roles (2027 new grad, plus internships). if you're hiring, i'd love to chat: ${CONTENT.email} 💌`,
    next: ["contact", "your internships", "skills?"] },
  { id: "contact", keys: ["contact", "email", "reach", "linkedin", "connect", "resume", "cv", "talk to you"],
    say: () => `email is best: ${CONTENT.email}. i'm also on linkedin (lvl 5 on the shelf has every link). want my resume? just email me!`,
    next: ["fun fact", "who are you?"] },
  { id: "fact", keys: ["fun fact", "fact", "surprise me", "random", "something interesting"],
    say: () => CONTENT.funFacts[Math.floor(Math.random() * CONTENT.funFacts.length)],
    next: ["another one", "your research?"] },
  { id: "real", keys: ["are you real", "are you ai", "are you a bot", "bot", "robot", "real person", "is this ai", "chatbot", "human"],
    say: ["half and half? every answer here is something i (the real jasmine) wrote in my own words. it's not an LLM yet, so if i miss something, email the real me. making this a true AI version of me is on my roadmap!"],
    next: ["AI stuff?", "contact"] },
  { id: "joke", keys: ["joke", "funny", "make me laugh"],
    say: ["why do programmers prefer dark mode? because light attracts bugs 🐛", "there are 10 kinds of people: those who understand binary and those who don't.", "i'd tell you a UDP joke, but you might not get it."],
    next: ["another one", "fun fact"] },
  { id: "thanks", keys: ["thanks", "thank you", "thx", "ty", "appreciate"],
    say: [(c) => `of course${c.nameBit}! 💛 anything else?`, "anytime! poke around the shelf below, there's a lot more there."],
    next: ["fun fact", "contact"] },
  { id: "bye", keys: ["bye", "goodbye", "see you", "later", "cya", "gtg"],
    say: [(c) => `bye${c.nameBit}! thanks for stopping by 🌼`],
    next: ["fun fact"] },
  { id: "help", keys: ["help", "what can i ask", "what can you do", "options", "commands"],
    say: ["you can ask me about school, classes, internships, rider report, my research, AI, the raspberry pi, hobbies, music… or just say hi. (secret: try `sudo hire jasmine`)"],
    next: ["who are you?", "fun fact", "AI stuff?"] },
];

const FALLBACKS = [
  () => `hmm, i don't have a good answer for that one yet! try asking about rider report, my research, or what i'm nerding out on. or email the real me: ${CONTENT.email}`,
  () => "ooh, good question. that one's not in my brain yet 😅 ask me about my internships, AI, or my raspberry pi?",
];

function agent() {
  const out = $("#agent-out"), form = $("#agent-form"), input = $("#agent-input"), quick = $("#agent-quick");
  const ctx = { name: "", nameBit: "", last: null, history: [] };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const norm = (t) => " " + t.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9+#\s-]/g, " ").replace(/\s+/g, " ").trim() + " ";
  const render = (r) => (typeof r === "function" ? r(ctx) : r);
  const NOT_NAMES = new Set("a an the just here looking interested recruiter student hiring from new curious good fine ok okay so not doing well great tired bored back sorry wondering trying working currently also really glad happy excited on in at with".split(" "));

  const bubble = (who, text) => {
    const row = document.createElement("div");
    row.className = `msg ${who}`;
    if (who === "me") row.innerHTML = `<span class="avatar" aria-hidden="true">✿</span>`;
    const b = document.createElement("div");
    b.className = "bubble-msg";
    b.textContent = text;
    row.appendChild(b);
    out.appendChild(row);
    out.scrollTop = out.scrollHeight;
    return row;
  };
  const chips = (list = []) => {
    quick.innerHTML = "";
    list.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = c;
      b.addEventListener("click", () => send(c));
      quick.appendChild(b);
    });
  };

  // figure out which reply fits best
  const think = (raw) => {
    const t = norm(raw);
    if (/^ ?sudo .*hire/.test(t)) return { text: `permission granted ✅ let's talk: ${CONTENT.email}`, next: ["contact"] };
    if (/^ ?clear ?$/.test(t)) { out.innerHTML = ""; return null; }
    const m = raw.toLowerCase().match(/(?:i'?m|i am|my name is|my names|this is|call me)\s+([a-z][a-z'-]{1,20})/);
    let gotName = false;
    if (m && !NOT_NAMES.has(m[1])) { ctx.name = m[1][0].toUpperCase() + m[1].slice(1); ctx.nameBit = `, ${ctx.name}`; gotName = true; }
    if (/(^| )(tell me more|more|go on|keep going|and then|elaborate|another one|wait one more thing)( |$)/.test(t) && ctx.last) {
      const L = AGENT_BRAIN.find((i) => i.id === ctx.last);
      if (/another one/.test(t) && (L.id === "fact" || L.id === "joke")) return { intent: L, text: render(pick([].concat(L.say))) };
      if (L.more) return { intent: L, text: L.more, next: (L.next || []).filter((n) => n !== "tell me more") };
    }
    let best = null, score = 0;
    for (const intent of AGENT_BRAIN) {
      let s = 0;
      for (const k of intent.keys) if (t.includes(` ${k} `)) s += k.split(" ").length + (k.length > 6 ? 0.5 : 0);
      if (s > score) { score = s; best = intent; }
    }
    if (gotName && (!best || best.id === "greet" || score < 1.5)) return { text: `nice to meet you, ${ctx.name}! 🌼 i'm jasmine. what do you want to know?`, next: ["who are you?", "what are you nerding out on?", "rider report?"] };
    if (!best) return { text: render(pick(FALLBACKS)), next: ["who are you?", "rider report?", "help"] };
    return { intent: best, text: render(pick([].concat(best.say))) };
  };

  // optional real-AI mode: if CONTENT.agentEndpoint is set, ask it first
  const askRemote = async (msg) => {
    if (!CONTENT.agentEndpoint) return null;
    try {
      ctx.history.push({ role: "user", content: msg });
      const r = await fetch(CONTENT.agentEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: ctx.history.slice(-12) }) });
      const j = await r.json();
      if (j.reply) { ctx.history.push({ role: "assistant", content: j.reply }); return j.reply; }
    } catch (e) { console.warn("agent endpoint failed, using built-in replies", e); }
    return null;
  };

  let busy = false;
  const send = async (msg) => {
    msg = msg.trim();
    if (!msg || busy) return;
    busy = true;
    bubble("you", msg);
    chips([]);
    const typing = bubble("me", "");
    typing.classList.add("typing");
    $(".bubble-msg", typing).innerHTML = "<i></i><i></i><i></i>";
    const remote = askRemote(msg);
    const res = think(msg);
    const remoteText = await remote;
    const text = remoteText || res?.text;
    await sleep(reduceMotion ? 0 : 450 + Math.min((text || "").length * 9, 1400));
    typing.remove();
    if (text) {
      bubble("me", text);
      if (res?.intent) ctx.last = res.intent.id;
      chips(res?.next || res?.intent?.next || ["fun fact", "help"]);
    }
    busy = false;
  };

  form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; send(v); });

  // open with a greeting that knows what time it is
  let started = false;
  whenVisible(out, async (v) => {
    if (!v || started) return;
    started = true;
    const h = new Date().getHours();
    const hello = h < 5 ? "up late? same 🌙" : h < 12 ? "good morning! ☀️" : h < 18 ? "good afternoon! 🌤" : "good evening! 🌙";
    const typing = bubble("me", ""); typing.classList.add("typing");
    $(".bubble-msg", typing).innerHTML = "<i></i><i></i><i></i>";
    await sleep(reduceMotion ? 0 : 900);
    typing.remove();
    bubble("me", `${hello} i'm jasmine, well, the version of me that lives on this website. ask me anything, or tell me your name first 🌼`);
    chips(["who are you?", "what are you nerding out on?", "rider report?", "fun fact"]);
  }, { threshold: 0.5 });
}

/* ═════════ 6. intro: laptop git log ═════════ */
function laptop() {
  const lap = $("#laptop"), log = $("#gitlog");
  const entries = [
    ["a3f9e21 (HEAD -> main) 2026.08", "infra production services @ BNY"],
    ["7c01b4d 2025.08", "swe intern @ everyone can code chicago"],
    ["5e2d9aa 2024.12", "ship: rider report on the app store ★5.0"],
    ["19b7c3f 2024.08", "it intern @ sdi presence"],
    ["0000001 2023.08", "init: penn state cs + math"],
  ];
  let typed = false;
  const open = async () => {
    lap.classList.toggle("open");
    if (typed) return; typed = true;
    log.innerHTML = "";
    await sleep(500);
    for (const [h, m] of entries) {
      log.innerHTML += `<span class="h">commit ${h}</span>\n    ${m}\n`;
      await sleep(reduceMotion ? 0 : 260);
    }
  };
  lap.addEventListener("click", open);
  lap.addEventListener("mouseenter", () => { if (!typed) open().then(() => lap.classList.remove("open")); });
  lap.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
}

/* ═════════ 7. intro: personalized code (new every refresh) ═════════ */
const SNIPPETS = [
  ["today.py", `from penn_state import Engineer

jasmine = Engineer(major="CS", minor="Math", grad=2027)
jasmine.stack += ["Swift", "Firestore", "pandas"]
jasmine.fuel = "brown sugar boba"  # non-negotiable

while jasmine.curious:
    jasmine.build(next_idea())`],
  ["RiderReport.swift", `struct LiveReports: View {
    // real-time safety reports for CTA riders
    @State var reports: [Report] = []

    func listen() {
        db.collection("reports")
          .addSnapshotListener { snap, _ in
              reports = snap?.documents.map(Report.init) ?? []
          }
    }
}`],
  ["commute.py", `import numpy as np
from itertools import product

M = [np.array(b).reshape(2, 2) for b in product([0, 1], repeat=4)]
hits = sum(np.array_equal(A @ B, B @ A) for A in M for B in M)
print(hits, "/ 256")  # 82 / 256 -> 32.03%`],
  ["weekly.sql", `-- weekly remediation snapshot
SELECT status, COUNT(*) AS findings
FROM vulnerabilities
WHERE scanned_at >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY status
ORDER BY findings DESC;`],
  ["hello.c", `#include <stdio.h>

int main(void) {
    const char *me = "jasmine";
    for (int i = 0; me[i]; i++)
        printf("%c = 0x%02X\\n", me[i], me[i]);
    return 0;  // hi from the hardware side
}`],
  ["match.py", `def match(me, colleagues, k=3):
    # embedding similarity: skills, hobbies, mentorship goals
    scores = [(cos_sim(embed(me), embed(c)), c) for c in colleagues]
    return [c for _, c in sorted(scores, reverse=True)[:k]]`],
];

const KW = "from|import|while|for|in|def|return|struct|var|func|let|const|int|void|char|include|SELECT|FROM|WHERE|GROUP|BY|ORDER|AS|DESC|COUNT|INTERVAL|sum|print|printf|State|View";
function highlight(src) {
  const re = new RegExp(`(#include|#[^\\n]*|//[^\\n]*|--[^\\n]*)|("[^"\\n]*"|'[^'\\n]*')|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${KW})\\b|\\b([a-zA-Z_]\\w*)(?=\\()`, "g");
  return esc(src).replace(re, (m, c, s, n, k, f) => {
    if (c) return c === "#include" ? `<span class="tok-k">${c}</span>` : `<span class="tok-c">${c}</span>`;
    if (s) return `<span class="tok-s">${s}</span>`;
    if (n) return `<span class="tok-n">${n}</span>`;
    if (k) return `<span class="tok-k">${k}</span>`;
    if (f) return `<span class="tok-f">${f}</span>`;
    return m;
  });
}

function codeCard() {
  const codeEl = $("#code"), file = $("#code-file");
  let idx;
  try { const last = +sessionStorage.getItem("jj-snippet"); do { idx = Math.floor(Math.random() * SNIPPETS.length); } while (idx === last && SNIPPETS.length > 1); } catch { idx = Math.floor(Math.random() * SNIPPETS.length); }
  let token = 0;
  const show = async (i) => {
    const my = ++token;
    try { sessionStorage.setItem("jj-snippet", i); } catch {}
    const [name, src] = SNIPPETS[i];
    file.textContent = name; codeEl.textContent = "";
    if (!reduceMotion) {
      for (let k = 0; k < src.length; k += 3) {
        if (my !== token) return;
        codeEl.textContent = src.slice(0, k);
        await sleep(12);
      }
    }
    if (my === token) codeEl.innerHTML = highlight(src);
  };
  let started = false;
  whenVisible(codeEl, (v) => { if (v && !started) { started = true; show(idx); } }, { threshold: 0.4 });
  $("#reroll").addEventListener("click", () => { idx = (idx + 1) % SNIPPETS.length; show(idx); });
}

/* ═════════ 8. intro: name in binary ═════════ */
function binaryCard() {
  const box = $("#bits");
  const word = "jasmine";
  box.innerHTML = [...word].map((ch) =>
    `<span class="byte" data-bin="${ch.charCodeAt(0).toString(2).padStart(8, "0")}"><span class="b">00000000</span><span class="letter">${ch}</span></span>`).join("");
  const settle = () => {
    $$(".byte", box).forEach((b, i) => {
      const target = b.dataset.bin, el = $(".b", b);
      let n = 0;
      const iv = setInterval(() => {
        n++;
        el.textContent = [...target].map((bit, j) => (j < n - i ? bit : Math.random() < .5 ? "0" : "1")).join("");
        if (n - i >= 8) { clearInterval(iv); el.textContent = target; }
      }, 55);
    });
  };
  let done = false;
  whenVisible(box, (v) => { if (v && !done) { done = true; settle(); } }, { threshold: 0.5 });
  $("#decode").addEventListener("click", (e) => {
    const on = box.classList.toggle("decoded");
    e.target.textContent = on ? "encode()" : "decode()";
  });
}

/* ═════════ 9. tilt cards ═════════ */
function tilt() {
  if (reduceMotion || matchMedia("(hover: none)").matches) return;
  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateZ(0)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  });
}

/* ═════════ 10. levels window ═════════ */
let shelfSetActive = () => {};
function openLevel(n, scroll = false) {
  $$(".tabs [role=tab]").forEach((t) => t.setAttribute("aria-selected", String(+t.dataset.level === n)));
  $$(".panel").forEach((p) => (p.hidden = +p.dataset.panel !== n));
  $("#level-title").textContent = `level_${n}.exe`;
  shelfSetActive(n);
  if (scroll) $("#levels").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  document.dispatchEvent(new CustomEvent("level", { detail: n }));
}
function levels() {
  $$(".tabs [role=tab]").forEach((t) => t.addEventListener("click", () => openLevel(+t.dataset.level)));
  $$(".nav-links a[data-level]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openLevel(+a.dataset.level, true); }));
}

/* ═════════ 11. the shelf (three.js) ═════════ */
function woodTexture(THREE) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 64;
  const x = c.getContext("2d");
  x.fillStyle = "#c79a68"; x.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = `rgba(${120 + Math.random() * 40},${80 + Math.random() * 30},40,${0.15 + Math.random() * 0.25})`;
    x.lineWidth = 1 + Math.random() * 2;
    x.beginPath(); const y = Math.random() * 64; x.moveTo(0, y);
    for (let k = 0; k <= 512; k += 32) x.lineTo(k, y + Math.sin(k / 60 + i) * 3);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeBuddy(THREE, level) {
  const g = new THREE.Group();
  const glow = new THREE.MeshStandardMaterial({ color: 0xc6e39a, emissive: 0x9bd07a, emissiveIntensity: 0.28, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.4 });
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);
  const body = new THREE.Mesh(cap(0.2, 0.28), glow); body.position.y = 0.36; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 28, 20), glow); head.position.y = 0.82; head.scale.set(1, 0.95, 0.92); g.add(head);
  [-0.09, 0.09].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), dark); e.position.set(x, 0.85, 0.26); g.add(e); });
  const mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.05, 2, 6), dark); mouth.rotation.z = Math.PI / 2; mouth.position.set(0, 0.76, 0.27); g.add(mouth);
  // antenna with an LED: these little guys are robots at heart
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16), dark); ant.position.y = 1.15; g.add(ant);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), new THREE.MeshStandardMaterial({ color: 0xff5c8a, emissive: 0xff5c8a, emissiveIntensity: 1.2 }));
  led.position.y = 1.25; g.add(led);
  const armL = new THREE.Group(), armR = new THREE.Group();
  [armL, armR].forEach((a, i) => {
    const m = new THREE.Mesh(cap(0.06, 0.22), glow); m.position.y = -0.14; a.add(m);
    a.position.set(i ? 0.22 : -0.22, 0.52, 0); a.rotation.z = i ? 0.35 : -0.35; g.add(a);
  });
  const legs = [-0.09, 0.09].map((x) => { const l = new THREE.Mesh(cap(0.07, 0.12), glow); l.position.set(x, 0.08, 0); g.add(l); return l; });
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData = { level, glow, led, armL, armR, legs, body, head, hover: 0, baseY: 0 };
  return g;
}

function prop(THREE, kind) {
  const p = new THREE.Group();
  const M = (c, e = 0x000000, ei = 0) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: ei, roughness: 0.5 });
  if (kind === "briefcase") {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.09), M(0x6b3f22)); p.add(b);
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16, Math.PI), M(0x222222)); h.position.y = 0.11; p.add(h);
  } else if (kind === "phone") {
    p.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.025), M(0x111111)));
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.26), M(0x2a63b7, 0x6cc4ff, 0.9)); s.position.z = 0.014; p.add(s);
  } else if (kind === "board") {
    const c = document.createElement("canvas"); c.width = 256; c.height = 160;
    const x = c.getContext("2d"); x.fillStyle = "#1f3326"; x.fillRect(0, 0, 256, 160);
    x.fillStyle = "#e9f5d8"; x.font = "bold 34px JetBrains Mono, monospace"; x.textAlign = "center";
    x.fillText("AB = BA ?", 128, 70); x.font = "26px JetBrains Mono, monospace"; x.fillStyle = "#ff8fb0"; x.fillText("82 / 256", 128, 120);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.03), [M(0x7a5232), M(0x7a5232), M(0x7a5232), M(0x7a5232), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 }), M(0x7a5232)]);
    b.position.y = 0.55; p.add(b);
    [-0.3, 0.3].forEach((x) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6), M(0x7a5232)); l.position.set(x, 0.3, -0.03); p.add(l); });
  } else if (kind === "cap") {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.42), M(0x1b1b1b)); top.rotation.y = Math.PI / 4; p.add(top);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.1, 16), M(0x1b1b1b)); base.position.y = -0.06; p.add(base);
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18), M(0xf2d46b, 0xf2d46b, 0.4)); tassel.position.set(0.17, -0.07, 0.0); p.add(tassel);
  } else if (kind === "books") {
    [0xff5c8a, 0x6cc4ff, 0xf2d46b].forEach((c, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42 - i * 0.04, 0.08, 0.3), M(c)); b.position.y = 0.04 + i * 0.085; b.rotation.y = i * 0.2; p.add(b); });
  } else if (kind === "heart") {
    const s = new THREE.Shape();
    s.moveTo(0, -0.15); s.bezierCurveTo(-0.25, 0, -0.18, 0.2, 0, 0.08); s.bezierCurveTo(0.18, 0.2, 0.25, 0, 0, -0.15);
    p.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 }), M(0xff5c8a, 0xff5c8a, 0.6)));
  } else if (kind === "boba") {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.3, 20), new THREE.MeshPhysicalMaterial({ color: 0xd9a066, roughness: 0.3, transmission: 0.2 })); cup.position.y = 0.15; p.add(cup);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25), M(0xff7a3d)); straw.position.set(0.03, 0.36, 0); straw.rotation.z = 0.2; p.add(straw);
  }
  p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return p;
}

function shelf(THREE) {
  const stage = $(".shelf-stage"), canvas = $("#shelf-canvas"), labelsEl = $("#shelf-labels");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x20222e, 0.9));
  const spot = new THREE.SpotLight(0xfff3e0, 3.2, 0, 0.55, 0.6, 0);
  spot.position.set(3.5, 7.5, 9); spot.target.position.set(0, 2.4, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(1536, 1536); spot.shadow.bias = -0.0004; spot.shadow.radius = 4;
  scene.add(spot, spot.target);
  const mintFill = new THREE.PointLight(0xc6e39a, 1.2, 0, 0); mintFill.position.set(-4, 3, 3); scene.add(mintFill);

  const world = new THREE.Group(); scene.add(world);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), new THREE.MeshStandardMaterial({ color: 0x23283d, roughness: 0.95 }));
  wall.position.set(0, 5, -1.1); wall.receiveShadow = true; scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: 0x191c2b, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const woodMap = woodTexture(THREE);
  const wood = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.7 });
  const box = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; world.add(m); return m; };

  // five boards, staggered like a real display shelf; level 1 on top
  const boards = [
    { y: 4.9, w: 5.4, x: 0.1 },
    { y: 3.75, w: 6.4, x: -0.25 },
    { y: 2.6, w: 5.6, x: 0.15 },
    { y: 1.45, w: 5.9, x: -0.15 },
    { y: 0.3, w: 5.4, x: 0.35 },
  ];
  box(0.7, 5.0, 0.55, 0, 2.6, -0.45);
  boards.forEach((b) => box(b.w, 0.12, 0.95, b.x, b.y, 0));

  const ladderMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const ladder = (x, y0, y1, tilt = 0.12) => {
    const L = new THREE.Group(), h = y1 - y0;
    [-0.15, 0.15].forEach((dx) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, 0.03), ladderMat); r.position.set(dx, h / 2, 0); L.add(r); });
    for (let k = 0.15; k < h; k += 0.18) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), ladderMat); s.position.y = k; L.add(s); }
    L.position.set(x, y0, 0.15); L.rotation.x = -tilt;
    L.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    world.add(L);
  };
  ladder(-1.6, 3.81, 4.9); ladder(2.3, 2.66, 3.75); ladder(1.9, 0.36, 1.45);

  // the five level-buddies + their props
  const buddies = [];
  const place = (level, x, opts = {}) => {
    const b = makeBuddy(THREE, level);
    const y = boards[level - 1].y + 0.06;
    b.position.set(x, y, 0.05); b.userData.baseY = y;
    if (opts.rotY) b.rotation.y = opts.rotY;
    world.add(b); buddies.push(b);
    return b;
  };
  // lvl 1 · experience: waving, holding a briefcase
  const b1 = place(1, -1.5, { rotY: 0.25 });
  const bc = prop(THREE, "briefcase"); bc.position.set(0.02, -0.33, 0.06); b1.userData.armR.add(bc);
  b1.userData.pose = "wave";
  // lvl 2 · rider report: sitting on the edge, legs dangling, on their phone
  const b2 = place(2, 1.3, { rotY: -0.15 });
  b2.position.z = 0.42; b2.position.y -= 0.2; b2.userData.baseY = b2.position.y;
  b2.userData.legs.forEach((l) => { l.rotation.x = -1.3; l.position.z = 0.12; l.position.y = 0.16; });
  const ph = prop(THREE, "phone"); ph.position.set(0.1, 0.5, 0.3); ph.rotation.x = -0.4; b2.add(ph);
  b2.userData.armL.rotation.set(-1.1, 0, -0.2); b2.userData.armR.rotation.set(-1.1, 0, 0.2);
  b2.userData.pose = "scroll";
  // lvl 3 · research: presenting at a tiny chalkboard
  const b3 = place(3, -1.45, { rotY: -0.2 });
  const brd = prop(THREE, "board"); brd.position.set(-2.3, boards[2].y + 0.06, -0.1); brd.rotation.y = 0.45; world.add(brd);
  b3.userData.armL.rotation.z = -1.9;
  b3.userData.pose = "point";
  // lvl 4 · classwork: grad cap + a stack of books
  const b4 = place(4, 0.95, { rotY: -0.3 });
  const capP = prop(THREE, "cap"); capP.position.y = 1.08; capP.rotation.z = 0.12; b4.add(capP);
  b4.userData.led.visible = false; b4.children.forEach((o) => { if (o.geometry?.type === "CylinderGeometry") o.visible = false; });
  const books = prop(THREE, "books"); books.position.set(1.7, boards[3].y + 0.06, 0.05); world.add(books);
  b4.userData.pose = "nod";
  // lvl 5 · connect: both arms up, a heart floating overhead
  const b5 = place(5, -0.95, { rotY: 0.1 });
  const heart = prop(THREE, "heart"); heart.position.set(0.5, 0.95, 0.1); heart.scale.setScalar(0.8); b5.add(heart);
  b5.userData.heart = heart;
  b5.userData.pose = "cheer";
  // a little boba on the shelf, just because
  const boba = prop(THREE, "boba"); boba.position.set(-2.4, boards[1].y + 0.06, 0.1); world.add(boba);

  const NAMES = ["experience", "rider report", "research", "classwork", "connect"];
  const labels = buddies.map((b, i) => {
    const d = document.createElement("div"); d.className = "shelf-label";
    d.textContent = `lvl ${i + 1} · ${NAMES[i]}`;
    labelsEl.appendChild(d); return d;
  });
  let active = 1;
  shelfSetActive = (n) => { active = n; labels.forEach((l, i) => l.classList.toggle("active", i + 1 === n)); };
  shelfSetActive(1);

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w < 640;
    camera.fov = narrow ? 46 : 32;
    camera.position.set(0, 3.3, narrow ? 13.5 : 12.8);
    camera.lookAt(0, 2.95, 0);
    camera.updateProjectionMatrix();
  };
  resize(); addEventListener("resize", resize);

  // pointer: hover, click, drag to peek
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hovered = null, dragging = false, downX = 0, downY = 0, rotTarget = 0, lastX = 0;
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(buddies, true)[0];
    if (!hit) return null;
    let o = hit.object; while (o && !o.userData.level) o = o.parent;
    return o;
  };
  canvas.addEventListener("pointerdown", (e) => { dragging = true; downX = lastX = e.clientX; downY = e.clientY; });
  addEventListener("pointerup", (e) => {
    if (!dragging) return; dragging = false;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6 && e.target === canvas) {
      const b = pick(e);
      if (b) { b.userData.jump = performance.now(); openLevel(b.userData.level, true); }
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging && e.pointerType === "mouse") { rotTarget = clamp(rotTarget + (e.clientX - lastX) * 0.005, -0.7, 0.7); lastX = e.clientX; }
    hovered = pick(e);
    canvas.style.cursor = hovered ? "pointer" : dragging ? "grabbing" : "grab";
  });
  canvas.addEventListener("pointerleave", () => (hovered = null));

  const v = new THREE.Vector3();
  let running = false;
  whenVisible(stage, (vis) => { running = vis; if (vis) requestAnimationFrame(loop); });
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    world.rotation.y = lerp(world.rotation.y, rotTarget + Math.sin(now / 5000) * 0.06, 0.06);
    const s = now / 1000;
    buddies.forEach((b, i) => {
      const u = b.userData;
      u.hover = lerp(u.hover, hovered === b || active === u.level ? 1 : 0, 0.12);
      u.glow.emissiveIntensity = 0.28 + u.hover * 0.55;
      const jump = u.jump ? clamp((now - u.jump) / 600, 0, 1) : 1;
      const hop = Math.sin(jump * Math.PI) * 0.45;
      b.position.y = u.baseY + hop + (hovered === b ? Math.abs(Math.sin(s * 6)) * 0.08 : 0);
      u.led.material.emissiveIntensity = 0.8 + Math.sin(s * 3 + i) * 0.6;
      if (u.pose === "wave") u.armL.rotation.z = -2.4 + Math.sin(s * 5) * 0.4;
      if (u.pose === "scroll") u.head.rotation.x = 0.25 + Math.sin(s * 1.5) * 0.05;
      if (u.pose === "point") u.armL.rotation.z = -1.9 + Math.sin(s * 2) * 0.15;
      if (u.pose === "nod") b.rotation.z = Math.sin(s * 2.2) * 0.06;
      if (u.pose === "cheer") {
        u.armL.rotation.z = -2.6 + Math.sin(s * 6) * 0.25; u.armR.rotation.z = 2.6 - Math.sin(s * 6) * 0.25;
        u.heart.position.y = 0.95 + Math.sin(s * 2) * 0.08; u.heart.rotation.y = s;
      }
      // label tracks the buddy's head on screen
      b.getWorldPosition(v); v.x += 0.42; v.y += 0.85; v.project(camera);
      const lx = (v.x * 0.5 + 0.5) * stage.clientWidth, ly = (-v.y * 0.5 + 0.5) * stage.clientHeight;
      labels[i].style.left = lx + "px"; labels[i].style.top = ly + "px";
      labels[i].classList.toggle("hot", hovered === b);
    });
    renderer.render(scene, camera);
  }
}

/* ═════════ 12. 3D iPhone + swipe demo ═════════ */
function phone() {
  const ph = $("#phone"), screen = $("#phone-screen"), track = $("#track"), dotsEl = $("#dots");
  const slides = $$("img", track), N = slides.length;
  // extrude the frame: stack thin layers to fake thickness
  const depth = 12;
  for (let i = 1; i < depth; i++) {
    const l = document.createElement("div"); l.className = "layer";
    l.style.transform = `translateZ(${i - depth / 2}px)`;
    ph.insertBefore(l, ph.firstChild);
  }
  slides.forEach((_, i) => {
    const d = document.createElement("button"); d.setAttribute("aria-label", `Screen ${i + 1}`);
    d.addEventListener("click", () => go(i, true)); dotsEl.appendChild(d);
  });
  let idx = 0, rx = 6, ry = -18, flipped = false, lastTouch = 0;
  const apply = () => (ph.style.transform = `rotateY(${ry + (flipped ? 180 : 0)}deg) rotateX(${rx}deg)`);
  const go = (i, user) => {
    idx = (i + N) % N;
    track.style.transform = `translateX(${-idx * 100}%)`;
    $$("button", dotsEl).forEach((d, k) => d.classList.toggle("on", k === idx));
    if (user) lastTouch = performance.now();
  };
  go(0); apply();
  $("#prev").addEventListener("click", () => go(idx - 1, true));
  $("#next").addEventListener("click", () => go(idx + 1, true));
  $("#flip").addEventListener("click", () => { flipped = !flipped; lastTouch = performance.now(); apply(); });

  // swipe on the screen
  let sx = 0, dx = 0, swiping = false;
  screen.addEventListener("pointerdown", (e) => {
    if (flipped) return;
    swiping = true; sx = e.clientX; dx = 0; track.classList.add("dragging");
    screen.setPointerCapture(e.pointerId); e.stopPropagation();
  });
  screen.addEventListener("pointermove", (e) => {
    if (!swiping) return;
    dx = e.clientX - sx;
    track.style.transform = `translateX(calc(${-idx * 100}% + ${dx}px))`;
  });
  const endSwipe = () => {
    if (!swiping) return; swiping = false; track.classList.remove("dragging");
    const w = screen.clientWidth;
    if (Math.abs(dx) < 6) go(idx + 1, true);          // tap → next
    else if (dx < -w * 0.18) go(idx + 1, true);
    else if (dx > w * 0.18) go(idx - 1, true);
    else go(idx, true);
  };
  screen.addEventListener("pointerup", endSwipe);
  screen.addEventListener("pointercancel", endSwipe);

  // drag the frame to rotate
  let rotating = false, px = 0, py = 0;
  ph.addEventListener("pointerdown", (e) => {
    if (screen.contains(e.target) && !flipped) return;
    rotating = true; px = e.clientX; py = e.clientY; ph.classList.add("dragging"); ph.setPointerCapture(e.pointerId);
  });
  ph.addEventListener("pointermove", (e) => {
    if (!rotating) return;
    ry += (e.clientX - px) * 0.5; rx = clamp(rx - (e.clientY - py) * 0.3, -35, 35);
    px = e.clientX; py = e.clientY; apply();
  });
  const endRot = () => { if (!rotating) return; rotating = false; ph.classList.remove("dragging"); lastTouch = performance.now(); };
  ph.addEventListener("pointerup", endRot); ph.addEventListener("pointercancel", endRot);

  // keyboard
  $("#phone-stage").addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(idx + 1, true); if (e.key === "ArrowLeft") go(idx - 1, true); });

  // auto-advance + gentle float, only while visible and idle
  let visible = false;
  whenVisible($("#phone-stage"), (v) => (visible = v));
  setInterval(() => { if (visible && !reduceMotion && performance.now() - lastTouch > 6000 && !flipped) go(idx + 1); }, 3200);
  const float = (now) => {
    requestAnimationFrame(float);
    if (!visible || rotating || reduceMotion || performance.now() - lastTouch < 4000) return;
    ry = lerp(ry, -18 + Math.sin(now / 1800) * 10, 0.04);
    rx = lerp(rx, 6 + Math.sin(now / 2300) * 3, 0.04);
    ph.classList.add("dragging"); apply();
  };
  requestAnimationFrame(float);
  $("#flip").addEventListener("click", () => ph.classList.remove("dragging"));
}

/* ═════════ 13. research lab: all 256 pairs ═════════ */
function research() {
  const mats = Array.from({ length: 16 }, (_, i) => [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1]);
  const mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]];
  const eq = (a, b) => a.every((v, i) => v === b[i]);
  const matHTML = (m) => `<span class="mat">${m.map((v) => `<span>${v}</span>`).join("")}</span>`;
  let A = 9, B = 6;
  const pickA = $("#pickA"), pickB = $("#pickB"), out = $("#matResult");
  const build = (el, which) => {
    el.innerHTML = mats.map((m, i) => `<button data-i="${i}" title="matrix ${i}">${m[0]} ${m[1]}<br>${m[2]} ${m[3]}</button>`).join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (which === "A") A = +b.dataset.i; else B = +b.dataset.i;
      render();
    });
  };
  const render = () => {
    $$("button", pickA).forEach((b) => b.classList.toggle("sel", +b.dataset.i === A));
    $$("button", pickB).forEach((b) => b.classList.toggle("sel", +b.dataset.i === B));
    const ab = mul(mats[A], mats[B]), ba = mul(mats[B], mats[A]), ok = eq(ab, ba);
    out.innerHTML = `<span>AB =</span>${matHTML(ab)}<span>BA =</span>${matHTML(ba)}<span class="verdict ${ok ? "yes" : "no"}">${ok ? "✓ commutes" : "✗ AB ≠ BA"}</span>`;
  };
  build(pickA, "A"); build(pickB, "B"); render();

  let running = false;
  $("#runAll").addEventListener("click", async () => {
    if (running) return; running = true;
    let c = 0, n = 0;
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      A = i; B = j; n++;
      if (eq(mul(mats[i], mats[j]), mul(mats[j], mats[i]))) c++;
      if (n % 2 === 0 || n === 256) {
        render();
        $("#meterFill").style.width = (c / n) * 100 + "%";
        $("#runStat").textContent = `pairs: ${n}/256 · commutative: ${c} · non-commutative: ${n - c} · ${(c / n * 100).toFixed(2)}%`;
        await sleep(reduceMotion ? 0 : 14);
      }
    }
    running = false;
  });
}

/* ═════════ 14. jazz ═════════ */
function music() {
  const btn = $("#music"), audio = $("#jazz"), label = $(".music-label", btn);
  audio.volume = 0.45;
  const pop = $("#jazz-pop"), frame = $("#jazz-frame");
  const setOn = (on) => { btn.setAttribute("aria-pressed", String(on)); label.textContent = on ? "jazz: on" : "jazz: off"; };
  const togglePop = (show) => {
    pop.hidden = !show;
    if (show && !frame.src) frame.src = frame.dataset.src; // load Apple Music only when asked
    setOn(show);
  };
  btn.addEventListener("click", async () => {
    if (!pop.hidden) return togglePop(false);
    if (audio.paused) {
      try { await audio.play(); setOn(true); }          // local mp3, if you add one
      catch { togglePop(true); }                        // otherwise: Apple Music player
    } else { audio.pause(); setOn(false); }
  });
  $("#jazz-close").addEventListener("click", () => togglePop(false));
}

/* ═════════ 14b. camera roll + photo viewer ═════════ */
function cameraRoll() {
  const roll = $("#roll"), snaps = $$(".snap", roll);
  const dlg = $("#viewer"), img = $("#viewer-img");
  let shown = snaps, cur = 0;

  // filters: ls ./memories --tag=…
  $$(".roll-filters button").forEach((b) => b.addEventListener("click", () => {
    $$(".roll-filters button").forEach((x) => x.classList.toggle("on", x === b));
    const tag = b.dataset.tag;
    snaps.forEach((s) => s.classList.toggle("out", tag !== "all" && s.dataset.tag !== tag));
    shown = snaps.filter((s) => !s.classList.contains("out"));
  }));

  // camera flash as each snap scrolls into view
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("flash"); io.unobserve(e.target); }
  }), { threshold: 0.35 });
  snaps.forEach((s, i) => { s.style.setProperty("--d", `${i * 120}ms`); io.observe(s); });

  const show = (i) => {
    cur = (i + shown.length) % shown.length;
    const s = shown[cur], im = $("img", s);
    img.src = im.src; img.alt = im.alt;
    $("#viewer-file").textContent = $(".snap-bar span", s).textContent;
    $("#viewer-cap").textContent = $("figcaption", s).textContent;
    $("#viewer-loc").textContent = "📍 " + s.dataset.loc;
    $("#viewer-note").textContent = s.dataset.note || "";
    const link = $("#viewer-link");
    link.hidden = !s.dataset.link;
    if (s.dataset.link) { link.href = s.dataset.link; link.textContent = s.dataset.linkText || "read more ↗"; }
  };
  snaps.forEach((s) => {
    s.tabIndex = 0; s.setAttribute("role", "button");
    const open = () => { show(shown.indexOf(s)); dlg.showModal(); };
    s.addEventListener("click", open);
    s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  $("#viewer-prev").addEventListener("click", () => show(cur - 1));
  $("#viewer-next").addEventListener("click", () => show(cur + 1));
  $("#viewer-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") show(cur + 1); if (e.key === "ArrowLeft") show(cur - 1); });
}

/* ═════════ 15. ending bloom ═════════ */
function ending() {
  $$(".mini-bloom path").forEach((p, i) => p.style.setProperty("--r", `${i * 72}deg`));
  const end = $("#ending");
  whenVisible(end, (v) => end.classList.toggle("on", v), { threshold: 0.35 });
  $("#year").textContent = new Date().getFullYear();
}

/* ═════════ go ═════════ */
(async () => {
  splitName();
  binaryRain();
  reveals(); agent(); laptop(); codeCard(); binaryCard(); tilt();
  levels(); phone(); research(); music(); cameraRoll(); ending();
  const booted = boot();
  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    await booted;
    typeInto($("#hello-type"), "> hello.... i'm", 70);
    hero(THREE);
    shelf(THREE);
  } catch (err) {
    console.error(err);
    await booted;
    revealName(); // 3D failed (offline / no WebGL): still show the name
  }
})();
