/* ---------------------------------------------------------------------------
 * generate-assets — deterministic SVG artwork for the demo marketplace.
 *
 *   npm run assets
 *
 * Produces district, collection, listing, agent, agency and floor-plan art
 * under public/images. No external image dependencies; every file is plain
 * SVG so it renders identically in dev and production.
 * ------------------------------------------------------------------------ */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { POPULAR_DISTRICTS } from "../constants/locations";

const ROOT = path.join(process.cwd(), "public", "images");

type Palette = {
  sky: [string, string];
  sun: string;
  far: string;
  mid: string;
  near: string;
  accent: string;
  line: string;
};

const PALETTES: Palette[] = [
  { sky: ["#f3e9d8", "#d9c3a3"], sun: "#c9a36a", far: "#c8b399", mid: "#8f7a63", near: "#3b332a", accent: "#b8935a", line: "#f6efe3" },
  { sky: ["#e8e5df", "#b9c4c1"], sun: "#dfcba8", far: "#aebbb6", mid: "#6c7f7b", near: "#26312f", accent: "#9fae8e", line: "#f2f0ea" },
  { sky: ["#f2dfc8", "#cf9f7d"], sun: "#f0c58a", far: "#c99d83", mid: "#8f5f4b", near: "#38261f", accent: "#c3785a", line: "#f9eee1" },
  { sky: ["#e9e4ea", "#b3a9bd"], sun: "#e4cfa8", far: "#b6a8ba", mid: "#7a6884", near: "#2d2633", accent: "#a68fb0", line: "#f4f0f5" },
  { sky: ["#e3ecf0", "#a9c2cf"], sun: "#f0d9a8", far: "#a8c0ca", mid: "#5f7f8d", near: "#22343c", accent: "#8fb0b4", line: "#f1f6f7" },
  { sky: ["#efe6d4", "#cbb894"], sun: "#d8b878", far: "#c4b190", mid: "#87775c", near: "#30291f", accent: "#b18f4f", line: "#f8f2e5" },
  { sky: ["#ece0d4", "#c2a99a"], sun: "#dcb98f", far: "#bda598", mid: "#7f675c", near: "#33251f", accent: "#a57a63", line: "#f7ede3" },
  { sky: ["#e5e8e4", "#aebbb3"], sun: "#e6d3ab", far: "#b0beb6", mid: "#66796f", near: "#24332c", accent: "#8da08d", line: "#f1f4f0" },
];

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function frame(w: number, h: number, p: Palette, body: string, defs = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${p.sky[0]}"/><stop offset="100%" stop-color="${p.sky[1]}"/>
</linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${p.line}" stop-opacity="0.9"/><stop offset="100%" stop-color="${p.accent}" stop-opacity="0.45"/>
</linearGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%">
<stop offset="0%" stop-color="${p.sun}" stop-opacity="0.85"/><stop offset="100%" stop-color="${p.sun}" stop-opacity="0"/>
</radialGradient>
${defs}
</defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
${body}
</svg>`;
}

function grain(w: number, h: number) {
  return `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer><feComposite operator="in" in2="SourceGraphic"/></filter>
<rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5" fill="#000"/>`;
}

function towerScene(w: number, h: number, p: Palette, seed: number) {
  const base = h * 0.82;
  const rand = mulberry(seed);
  const buildings = Array.from({ length: 7 }, (_, i) => {
    const bw = w * (0.08 + rand() * 0.06);
    const bh = h * (0.22 + rand() * 0.4);
    const x = w * 0.06 + i * w * 0.13 + rand() * 12;
    const tone = i % 3 === 0 ? p.mid : i % 3 === 1 ? p.near : p.far;
    const windows = Array.from({ length: Math.floor(bh / 22) }, (_, r) =>
      Array.from({ length: Math.max(2, Math.floor(bw / 26)) }, (_, c) =>
        `<rect x="${(x + 8 + c * 24).toFixed(1)}" y="${(base - bh + 12 + r * 22).toFixed(1)}" width="8" height="9" fill="url(#glass)" opacity="${(0.35 + rand() * 0.5).toFixed(2)}"/>`
      ).join("")
    ).join("");
    return `<rect x="${x.toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${tone}"/>${windows}`;
  }).join("");

  return frame(
    w,
    h,
    p,
    `<circle cx="${w * 0.72}" cy="${h * 0.3}" r="${w * 0.16}" fill="url(#glow)"/>
<circle cx="${w * 0.72}" cy="${h * 0.3}" r="${w * 0.055}" fill="${p.sun}" opacity="0.9"/>
<rect x="0" y="${base}" width="${w}" height="${h - base}" fill="${p.near}" opacity="0.9"/>
${buildings}
<rect x="0" y="${h * 0.74}" width="${w}" height="1.2" fill="${p.accent}" opacity="0.7"/>
`,
    grain(w, h)
  );
}

function villaScene(w: number, h: number, p: Palette, seed: number) {
  const rand = mulberry(seed);
  const base = h * 0.78;
  const pool = `<path d="M ${w * 0.08} ${base + 18} H ${w * 0.92} V ${h - 12} H ${w * 0.08} Z" fill="${p.accent}" opacity="0.35"/>
<path d="M ${w * 0.08} ${base + 18} H ${w * 0.92}" stroke="${p.line}" stroke-opacity="0.6" stroke-width="2"/>`;
  const palm = `<g stroke="${p.near}" stroke-width="3" fill="none" stroke-linecap="round">
<path d="M ${w * 0.16} ${base} C ${w * 0.15} ${base - 60} ${w * 0.19} ${base - 90} ${w * 0.22} ${base - 118}"/>
${[0, 1, 2, 3, 4].map((i) => `<path d="M ${w * 0.22} ${base - 118} q ${(i - 2) * 26} ${-18 - i * 3} ${(i - 2) * 52} ${6 + i * 4}" stroke-width="2" opacity="0.85"/>`).join("")}
</g>`;
  const houseX = w * 0.3;
  const houseW = w * 0.52;
  const house = `<rect x="${houseX}" y="${base - 86}" width="${houseW}" height="86" fill="${p.near}"/>
<rect x="${houseX + 18}" y="${base - 128}" width="${houseW * 0.44}" height="42" fill="${p.mid}"/>
<rect x="${houseX + 18}" y="${base - 74}" width="${houseW * 0.36}" height="52" fill="url(#glass)"/>
<rect x="${houseX + houseW * 0.56}" y="${base - 74}" width="${houseW * 0.3}" height="52" fill="url(#glass)" opacity="0.85"/>`;
  const sun = `<circle cx="${w * 0.86}" cy="${h * 0.22}" r="${w * 0.09}" fill="url(#glow)"/><circle cx="${w * 0.86}" cy="${h * 0.22}" r="${w * 0.032}" fill="${p.sun}"/>`;
  const shrubs = Array.from({ length: 6 }, (_, i) => {
    const cx = w * (0.34 + i * 0.08) + rand() * 8;
    return `<circle cx="${cx.toFixed(1)}" cy="${base + 6}" r="${(10 + rand() * 12).toFixed(1)}" fill="${p.accent}" opacity="0.3"/>`;
  }).join("");

  return frame(w, h, p, `${sun}${pool}${palm}${house}${shrubs}`);
}

function archScene(w: number, h: number, p: Palette, seed: number) {
  const base = h * 0.88;
  const rand = mulberry(seed);
  const arches = Array.from({ length: 5 }, (_, i) => {
    const aw = w * 0.14;
    const x = w * 0.08 + i * w * 0.17;
    const top = base - h * (0.3 + rand() * 0.18);
    return `<path d="M ${x} ${base} V ${top + aw / 2} A ${aw / 2} ${aw / 2} 0 0 1 ${x + aw} ${top + aw / 2} V ${base} Z" fill="${p.near}" opacity="${0.75 + i * 0.03}"/>
<path d="M ${x + 7} ${base} V ${top + aw / 2 + 4} A ${aw / 2 - 7} ${aw / 2 - 7} 0 0 1 ${x + aw - 7} ${top + aw / 2 + 4} V ${base} Z" fill="url(#glass)" opacity="0.5"/>`;
  }).join("");

  return frame(
    w,
    h,
    p,
    `<circle cx="${w * 0.28}" cy="${h * 0.24}" r="${w * 0.13}" fill="url(#glow)"/>
${arches}
<rect x="0" y="${base}" width="${w}" height="${h - base}" fill="${p.near}"/>
<path d="M ${w * 0.06} ${base - 2} H ${w * 0.94}" stroke="${p.accent}" stroke-width="2" opacity="0.8"/>`,
    grain(w, h)
  );
}

function coastScene(w: number, h: number, p: Palette, seed: number) {
  const rand = mulberry(seed);
  const waves = Array.from({ length: 4 }, (_, i) => {
    const y = h * (0.62 + i * 0.09);
    return `<path d="M 0 ${y} C ${w * 0.2} ${y - 18} ${w * 0.35} ${y + 16} ${w * 0.55} ${y - 6} S ${w * 0.85} ${y + 14} ${w} ${y - 4} V ${h} H 0 Z" fill="${i % 2 ? p.mid : p.near}" opacity="${0.32 + i * 0.18}"/>`;
  }).join("");
  const sun = `<circle cx="${w * 0.74}" cy="${h * 0.32}" r="${w * 0.11}" fill="url(#glow)"/><circle cx="${w * 0.74}" cy="${h * 0.32}" r="${w * 0.04}" fill="${p.sun}"/>`;
  const dunes = `<path d="M 0 ${h * 0.66} C ${w * 0.22} ${h * 0.52} ${w * 0.4} ${h * 0.7} ${w * 0.6} ${h * 0.58} S ${w * 0.9} ${h * 0.5} ${w} ${h * 0.64} V ${h} H 0 Z" fill="${p.far}"/>`;
  const birds = Array.from({ length: 3 }, (_, i) =>
    `<path d="M ${w * (0.18 + i * 0.07)} ${h * (0.24 + rand() * 0.08)} q 8 -6 16 0 q 8 -6 16 0" stroke="${p.near}" fill="none" stroke-width="1.6" opacity="0.5"/>`
  ).join("");
  return frame(w, h, p, `${sun}${dunes}${waves}${birds}`);
}

function gardenScene(w: number, h: number, p: Palette, seed: number) {
  const rand = mulberry(seed);
  const base = h * 0.84;
  const blobs = Array.from({ length: 9 }, (_, i) => {
    const cx = w * (0.08 + i * 0.11);
    const cy = base - rand() * h * 0.22;
    const r = w * (0.05 + rand() * 0.05);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${i % 2 ? p.mid : p.accent}" opacity="${(0.28 + rand() * 0.35).toFixed(2)}"/>`;
  }).join("");
  return frame(
    w,
    h,
    p,
    `<rect width="${w}" height="${h}" fill="${p.far}" opacity="0.24"/>
${blobs}
<rect x="0" y="${base}" width="${w}" height="${h - base}" fill="${p.near}" opacity="0.85"/>
<rect x="0" y="${base - 2}" width="${w}" height="2" fill="${p.accent}" opacity="0.8"/>`,
    grain(w, h)
  );
}

function loftScene(w: number, h: number, p: Palette, seed: number) {
  const rand = mulberry(seed);
  const base = h * 0.9;
  const cols = 6;
  const rows = 4;
  const cellW = (w * 0.8) / cols;
  const cellH = (base - h * 0.18) / rows;
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      `<rect x="${(w * 0.1 + c * cellW + 6).toFixed(1)}" y="${(h * 0.18 + r * cellH + 6).toFixed(1)}" width="${(cellW - 12).toFixed(1)}" height="${(cellH - 12).toFixed(1)}" fill="url(#glass)" opacity="${(0.3 + rand() * 0.45).toFixed(2)}"/>`
    ).join("")
  ).join("");
  return frame(
    w,
    h,
    p,
    `<rect x="${w * 0.06}" y="${h * 0.14}" width="${w * 0.88}" height="${base - h * 0.14}" fill="${p.near}"/>
${grid}
<rect x="${w * 0.06}" y="${base - 6}" width="${w * 0.88}" height="6" fill="${p.accent}" opacity="0.8"/>
<rect x="0" y="${base}" width="${w}" height="${h - base}" fill="${p.near}" opacity="0.9"/>`,
    grain(w, h)
  );
}

const MOTIFS = { tower: towerScene, villa: villaScene, arch: archScene, coast: coastScene, garden: gardenScene, loft: loftScene } as const;
type Motif = keyof typeof MOTIFS;

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const art = (seedText: string, motif: Motif, w: number, h: number) => {
  const seed = hash(seedText);
  return MOTIFS[motif](w, h, PALETTES[seed % PALETTES.length], seed);
};

/* -------------------------------- assets -------------------------------- */

async function writeAsset(relative: string, contents: string) {
  const target = path.join(ROOT, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
  return relative;
}

function avatar(name: string, index: number) {
  const palette = PALETTES[index % PALETTES.length];
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320" role="img" aria-label="${esc(name)}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${palette.sky[0]}"/><stop offset="100%" stop-color="${palette.sky[1]}"/>
</linearGradient>
</defs>
<rect width="320" height="320" fill="url(#bg)"/>
<circle cx="160" cy="122" r="58" fill="${palette.near}" opacity="0.92"/>
<path d="M 52 320 C 62 238 108 200 160 200 C 212 200 258 238 268 320 Z" fill="${palette.mid}" opacity="0.95"/>
<circle cx="160" cy="122" r="72" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.7"/>
<text x="160" y="300" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" letter-spacing="6" fill="${palette.line}" opacity="0.9">${initials}</text>
</svg>`;
}

function monogram(name: string, index: number) {
  const palette = PALETTES[(index + 2) % PALETTES.length];
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480" role="img" aria-label="${esc(name)}">
<rect width="480" height="480" rx="24" fill="${palette.near}"/>
<rect x="24" y="24" width="432" height="432" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.6"/>
<circle cx="240" cy="240" r="132" fill="none" stroke="${palette.accent}" stroke-width="1.5" opacity="0.45"/>
<text x="240" y="268" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="120" letter-spacing="10" fill="${palette.line}">${initials}</text>
</svg>`;
}

function floorPlan(label: string, seed: number) {
  const rand = mulberry(seed);
  const rooms = [
    { name: "Living", x: 40, y: 40, w: 250, h: 170 },
    { name: "Kitchen", x: 310, y: 40, w: 150, h: 100 },
    { name: "Dining", x: 310, y: 160, w: 150, h: 90 },
    { name: "Primary suite", x: 40, y: 230, w: 200, h: 150 },
    { name: "Bedroom 2", x: 260, y: 270, w: 120, h: 110 },
    { name: "Terrace", x: 400, y: 270, w: 60, h: 110 },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 420" width="500" height="420" role="img" aria-label="${esc(label)}">
<rect width="500" height="420" fill="#faf8f4"/>
<rect x="24" y="24" width="452" height="372" fill="none" stroke="#2b2723" stroke-width="4"/>
${rooms
  .map((room) => {
    const tone = ["#efe9de", "#f4f0e8", "#e9e2d5"][Math.floor(rand() * 3)];
    return `<rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" fill="${tone}" stroke="#2b2723" stroke-width="2"/>
<text x="${room.x + 12}" y="${room.y + 24}" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="1.6" fill="#6b6259">${room.name.toUpperCase()}</text>`;
  })
  .join("")}
<path d="M 300 40 A 40 40 0 0 1 300 120" fill="none" stroke="#b8935a" stroke-width="3"/>
<rect x="40" y="380" width="52" height="8" fill="#2b2723"/>
<text x="40" y="412" font-family="Helvetica, Arial, sans-serif" font-size="11" letter-spacing="2" fill="#8b8178">ARC — ${esc(label.toUpperCase())}</text>
</svg>`;
}

async function main() {
  const written: string[] = [];

  for (const district of POPULAR_DISTRICTS) {
    const file = district.image.replace(/^\/images\//, "");
    const motif: Motif =
      /dubai|lagos/.test(district.slug) ? "tower" : /cape|palma|bay/.test(district.slug) ? "coast" : /london/.test(district.slug) ? "villa" : /new-york/.test(district.slug) ? "loft" : "arch";
    written.push(await writeAsset(file, art(district.slug, motif, 1200, 900)));
  }

  const collections: [string, Motif][] = [
    ["apartments", "tower"],
    ["villas", "villa"],
    ["penthouses", "loft"],
    ["townhouses", "arch"],
  ];
  for (const [name, motif] of collections) {
    written.push(await writeAsset(`collections/${name}.svg`, art(`collection-${name}`, motif, 900, 1200)));
  }

  const propertyMotifs: Motif[] = ["villa", "tower", "arch", "loft", "coast", "garden"];
  for (let i = 1; i <= 12; i++) {
    written.push(await writeAsset(`properties/property-${i}.svg`, art(`property-${i}`, propertyMotifs[(i - 1) % propertyMotifs.length], 1600, 1100)));
  }

  written.push(await writeAsset("placeholder-property.svg", art("placeholder", "villa", 1200, 800)));

  const agents: [string, string][] = [
    ["Ava Sterling", "ava"],
    ["Julian Okafor", "julian"],
    ["Noor Al-Farsi", "noor"],
    ["Lena Whitmore", "lena"],
    ["Tunde Balogun", "tunde"],
    ["Sofia Marchetti", "sofia"],
    ["Marcus Reed", "marcus"],
    ["Imani Cole", "imani"],
  ];
  for (const [name, slug] of agents) {
    written.push(await writeAsset(`agents/${slug}.svg`, avatar(name, hash(slug))));
  }

  const agencies: [string, string][] = [
    ["Sterling & Co.", "sterling"],
    ["Meridian Estates", "meridian"],
    ["Atlantic & Vine", "atlantic"],
  ];
  for (const [name, slug] of agencies) {
    written.push(await writeAsset(`agencies/${slug}.svg`, monogram(name, hash(slug))));
  }

  for (let i = 1; i <= 3; i++) {
    written.push(await writeAsset(`floorplans/plan-${i}.svg`, floorPlan(i === 1 ? "Ground floor" : `Level ${i}`, i * 97)));
  }

  console.log(`\n  Arcadia — ${written.length} SVG assets written to public/images\n`);
}

main().catch((error) => {
  console.error("Asset generation failed:", error);
  process.exit(1);
});
