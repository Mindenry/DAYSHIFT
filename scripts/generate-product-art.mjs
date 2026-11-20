// Generates the DAYSHIFT demo studio illustrations.
// These are deliberately stylised product drawings, not photographs: they are
// clearly demo assets and should be replaced with licensed product photography
// before running a real store.
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "apps", "web", "public", "art");

const COLORS = {
  "optic-white": "#F2EEE5",
  "washed-black": "#22211F",
  black: "#1A1917",
  white: "#F5F2EA",
  chalk: "#EDE8DD",
  stone: "#BFB4A3",
  oat: "#D8CBB4",
  taupe: "#A99C88",
  indigo: "#3C4B5C",
  cream: "#E8DFCE",
  "heather-grey": "#A9A6A0",
  "pale-blue": "#B7C6CE",
  "light-blue": "#AFC4D2",
  navy: "#28313D",
  sand: "#CBBBA0",
  olive: "#6C6C53",
  tan: "#9A6F4C",
  camel: "#B08D62",
  tortoise: "#6B4A2F",
  gold: "#C6A15B",
  "washed-grey": "#B4B1AB",
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const stroke = "rgba(26,25,23,.78)";
const fine = "rgba(32,30,27,.28)";
const fold = "rgba(32,30,27,.09)";

const labels = {
  tee: "OVERSIZED TEE",
  shirt: "RELAXED SHIRT",
  polo: "PIQUÉ POLO",
  dress: "SLIP DRESS",
  jeans: "STRAIGHT DENIM",
  trousers: "WIDE-LEG TROUSER",
  skirt: "PLEATED SKIRT",
  shorts: "TAILORED SHORT",
  hoodie: "BRUSHED HOODIE",
  sweatshirt: "FRENCH TERRY CREW",
  knit: "MERINO KNIT",
  jacket: "STRUCTURED JACKET",
  bomber: "HARRINGTON JACKET",
  bag: "LEATHER TOTE",
  backpack: "CANVAS BACKPACK",
  crossbody: "NYLON CROSSBODY",
  sneaker: "LEATHER SNEAKER",
  loafer: "SUEDE LOAFER",
  sandal: "LEATHER SANDAL",
  cap: "SIX-PANEL CAP",
  hat: "WOOL FELT HAT",
  sunglasses: "ACETATE SUNGLASSES",
  belt: "LEATHER BELT",
  wallet: "BIFOLD WALLET",
  socks: "RIB SOCK PACK",
  jewelry: "GOLD HOOPS",
};

function garment(type, c) {
  const dark = shade(c, -26);
  const light = shade(c, 22);
  switch (type) {
    case "tee":
    case "sweatshirt":
      return `
        <path d="M322 396 L248 436 L214 560 L300 596 L330 512 L330 898 Q330 914 346 914 L554 914 Q570 914 570 898 L570 512 L600 596 L686 560 L652 436 L578 396 Q556 424 450 424 Q344 424 322 396 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M322 396 Q344 424 450 424 Q556 424 578 396" fill="none" stroke="${dark}" stroke-width="2"/>
        <path d="M382 402 Q450 452 518 402" fill="none" stroke="${dark}" stroke-width="3" opacity=".8"/>
        <path d="M330 520 C330 650 328 790 334 900" stroke="${fold}" stroke-width="26" fill="none"/>
        <path d="M570 520 C570 650 572 790 566 900" stroke="${fold}" stroke-width="22" fill="none"/>
        <path d="M386 700 C410 720 490 720 514 700" stroke="${fine}" stroke-width="2" fill="none"/>
        ${type === "sweatshirt" ? `<rect x="330" y="866" width="240" height="48" fill="${dark}" opacity=".5"/><path d="M330 872 H570 M330 892 H570" stroke="${stroke}" stroke-width="1.5" opacity=".55"/>` : ""}
        ${type === "sweatshirt" ? `<path d="M360 424 Q450 466 540 424" stroke="${stroke}" stroke-width="3" fill="none" opacity=".7"/>` : ""}
        ${type === "sweatshirt" ? `<path d="M640 530 L660 575" stroke="${fine}" stroke-width="2"/>` : ""}
      `;
    case "shirt":
    case "polo":
      return `
        <path d="M328 396 L252 442 L226 610 L300 634 L326 540 L330 900 Q330 916 346 916 L554 916 Q570 916 570 900 L570 540 L596 634 L670 610 L644 442 L568 396 L510 382 L450 452 L390 382 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M390 382 L430 470 L406 482 L360 410 Z" fill="${light}" stroke="${stroke}" stroke-width="2"/>
        <path d="M510 382 L470 470 L494 482 L540 410 Z" fill="${light}" stroke="${stroke}" stroke-width="2"/>
        <path d="M450 452 L450 906" stroke="${stroke}" stroke-width="2"/>
        <circle cx="450" cy="500" r="4" fill="${fine}"/>
        <circle cx="450" cy="570" r="4" fill="${fine}"/>
        <circle cx="450" cy="640" r="4" fill="${fine}"/>
        <circle cx="450" cy="710" r="4" fill="${fine}"/>
        <path d="M300 612 L326 540 M600 612 L570 540" stroke="${fine}" stroke-width="2"/>
        <path d="M340 470 C336 600 336 760 340 890" stroke="${fold}" stroke-width="20" fill="none"/>
        <path d="M560 470 C564 600 564 760 560 890" stroke="${fold}" stroke-width="18" fill="none"/>
        <path d="M330 892 Q450 920 570 892" fill="none" stroke="${stroke}" stroke-width="2" opacity=".6"/>
        ${type === "polo" ? `<path d="M330 470 L380 440 M570 470 L520 440" stroke="${stroke}" stroke-width="2"/><path d="M400 470 H500" stroke="${stroke}" stroke-width="2" opacity=".6"/>` : ""}
      `;
    case "jacket":
    case "bomber":
      return `
        <path d="M330 392 L250 440 L220 600 L298 624 L326 532 L330 900 Q330 916 346 916 L554 916 Q570 916 570 900 L570 532 L598 624 L676 600 L646 440 L566 392 L520 378 L450 470 L380 378 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M450 470 L450 906" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M380 378 L450 470 L392 512 L330 404 Z" fill="${light}" stroke="${stroke}" stroke-width="2"/>
        <path d="M520 378 L450 470 L508 512 L570 404 Z" fill="${light}" stroke="${stroke}" stroke-width="2"/>
        <path d="M340 650 L392 650 M508 650 L560 650" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M340 660 L392 660 M508 660 L560 660" stroke="${fine}" stroke-width="2"/>
        <circle cx="450" cy="560" r="4.5" fill="${fine}"/>
        <circle cx="450" cy="640" r="4.5" fill="${fine}"/>
        <path d="M328 890 H572" stroke="${stroke}" stroke-width="2"/>
        <path d="M345 500 C340 630 340 770 344 885" stroke="${fold}" stroke-width="18" fill="none"/>
        <path d="M555 500 C560 630 560 770 556 885" stroke="${fold}" stroke-width="18" fill="none"/>
      `;
    case "hoodie":
      return `
        <path d="M330 400 L248 442 L214 566 L300 600 L330 516 L330 898 Q330 914 346 914 L554 914 Q570 914 570 898 L570 516 L600 600 L686 566 L652 442 L570 400 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M338 402 Q336 320 450 300 Q564 320 562 402 Q520 430 450 430 Q380 430 338 402 Z" fill="${shade(c, -12)}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M374 392 Q376 340 450 326 Q524 340 526 392 Q492 414 450 414 Q408 414 374 392 Z" fill="${shade(c, -30)}" opacity=".55"/>
        <path d="M412 424 L410 520 M488 424 L490 520" stroke="${light}" stroke-width="5" stroke-linecap="round"/>
        <path d="M368 706 Q450 760 532 706 L532 790 Q450 826 368 790 Z" fill="${shade(c, -10)}" stroke="${stroke}" stroke-width="2"/>
        <path d="M330 866 H570" stroke="${stroke}" stroke-width="2" opacity=".5"/>
        <path d="M350 520 C346 650 346 780 350 890" stroke="${fold}" stroke-width="20" fill="none"/>
        <path d="M550 520 C554 650 554 780 550 890" stroke="${fold}" stroke-width="20" fill="none"/>
      `;
    case "dress":
      return `
        <path d="M402 350 L386 420 L360 900 Q450 928 540 900 L514 420 L498 350" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M402 350 L414 330 M498 350 L486 330" stroke="${stroke}" stroke-width="3"/>
        <path d="M386 420 Q450 470 514 420" fill="none" stroke="${dark}" stroke-width="2.5"/>
        <path d="M394 430 Q450 468 506 430" fill="none" stroke="${light}" stroke-width="1.5" opacity=".6"/>
        <path d="M404 470 C392 640 378 790 366 892" stroke="${fold}" stroke-width="18" fill="none"/>
        <path d="M496 470 C508 640 522 790 534 892" stroke="${fold}" stroke-width="18" fill="none"/>
        <path d="M420 600 Q450 616 480 600" stroke="${fine}" stroke-width="1.5" fill="none"/>
      `;
    case "jeans":
    case "trousers":
      return `
        <path d="M330 356 L570 356 L578 470 L566 916 L474 916 L462 600 L438 600 L426 916 L334 916 L322 470 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M332 408 H568" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M450 408 V520" stroke="${stroke}" stroke-width="2"/>
        <path d="M332 408 L322 470 M568 408 L578 470" stroke="${fine}" stroke-width="2"/>
        <path d="M350 430 Q380 468 400 500" fill="none" stroke="${fine}" stroke-width="2"/>
        <path d="M550 430 Q520 468 500 500" fill="none" stroke="${fine}" stroke-width="2"/>
        <path d="M386 600 L382 900 M514 600 L518 900" stroke="${fine}" stroke-width="1.5" opacity=".7"/>
        ${type === "trousers" ? `<path d="M450 420 L450 900" stroke="${stroke}" stroke-width="1.5" opacity=".55"/><path d="M400 600 L396 900 M500 600 L504 900" stroke="${fine}" stroke-width="1.2"/>` : ""}
        ${type === "jeans" ? `<circle cx="450" cy="445" r="4" fill="${fine}"/>` : ""}
        <path d="M340 470 C338 620 338 780 340 900" stroke="${fold}" stroke-width="14" fill="none"/>
        <path d="M560 470 C562 620 562 780 560 900" stroke="${fold}" stroke-width="14" fill="none"/>
      `;
    case "skirt":
      return `
        <path d="M354 380 L546 380 L596 900 Q450 930 304 900 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M354 380 L340 410 H560 L546 380" fill="${dark}" opacity=".35" stroke="${stroke}" stroke-width="2"/>
        ${Array.from({ length: 9 }, (_, i) => {
          const x = 360 + i * 22;
          return `<path d="M${x} 410 L${310 + i * 35} 905" stroke="${fine}" stroke-width="1.4"/>`;
        }).join("")}
        <path d="M400 420 C390 620 380 780 372 890" stroke="${fold}" stroke-width="16" fill="none"/>
        <path d="M500 420 C510 620 520 780 528 890" stroke="${fold}" stroke-width="16" fill="none"/>
      `;
    case "shorts":
      return `
        <path d="M332 420 L568 420 L578 520 L560 700 L466 700 L462 560 L438 560 L434 700 L340 700 L322 520 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M334 464 H566" stroke="${stroke}" stroke-width="2"/>
        <path d="M450 464 V560" stroke="${stroke}" stroke-width="2"/>
        <path d="M360 486 Q390 510 404 540" fill="none" stroke="${fine}" stroke-width="2"/>
        <path d="M540 486 Q510 510 496 540" fill="none" stroke="${fine}" stroke-width="2"/>
      `;
    case "knit":
      return `
        <path d="M322 400 L238 470 L196 760 L238 786 L292 600 L300 900 Q300 918 318 918 L582 918 Q600 918 600 900 L608 600 L662 786 L704 760 L662 470 L578 400 Q540 440 450 440 Q360 440 322 400 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M334 400 Q390 462 450 462 Q510 462 566 400" fill="none" stroke="${dark}" stroke-width="3"/>
        <path d="M300 862 H600" stroke="${stroke}" stroke-width="2"/>
        <path d="M300 878 H600" stroke="${fine}" stroke-width="1.5"/>
        <path d="M240 750 L222 758 M660 750 L678 758" stroke="${fine}" stroke-width="1.5"/>
        ${Array.from({ length: 14 }, (_, i) => `<path d="M${310 + i * 21} 480 L${306 + i * 22} 860" stroke="${fold}" stroke-width="4"/>`).join("")}
      `;
    case "bag":
    case "backpack":
    case "crossbody":
      if (type === "bag") {
        return `
          <path d="M320 470 H580 L606 880 Q450 906 294 880 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
          <path d="M368 470 C368 330 532 330 532 470" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
          <path d="M368 470 C368 344 532 344 532 470" fill="none" stroke="${light}" stroke-width="1.5" opacity=".5"/>
          <path d="M340 500 H560" stroke="${fine}" stroke-width="1.5"/>
          <path d="M450 500 V868" stroke="${fold}" stroke-width="18"/>
          <path d="M470 520 L520 520 L520 610 L470 610 Z" fill="none" stroke="${stroke}" stroke-width="2" opacity=".55"/>
          <path d="M330 870 Q450 892 570 870" stroke="${fold}" stroke-width="10" fill="none"/>
        `;
      }
      if (type === "backpack") {
        return `
          <path d="M326 430 Q326 360 450 360 Q574 360 574 430 L592 850 Q450 884 308 850 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
          <path d="M386 366 C386 250 514 250 514 366" fill="none" stroke="${stroke}" stroke-width="6"/>
          <path d="M338 500 H562" stroke="${stroke}" stroke-width="2"/>
          <path d="M350 530 H550 V650 H350 Z" fill="none" stroke="${fine}" stroke-width="2"/>
          <path d="M450 530 V820" stroke="${fold}" stroke-width="24"/>
          <path d="M320 700 H580" stroke="${fine}" stroke-width="1.5"/>
          <path d="M300 760 Q286 812 312 860 M600 760 Q614 812 588 860" stroke="${stroke}" stroke-width="5" fill="none"/>
        `;
      }
      return `
        <path d="M300 640 H600 L590 820 Q450 850 310 820 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M300 640 Q450 600 600 640" fill="none" stroke="${stroke}" stroke-width="2"/>
        <path d="M450 640 V820" stroke="${fine}" stroke-width="1.5"/>
        <path d="M340 690 H420 V760 H340 Z" fill="none" stroke="${stroke}" stroke-width="2" opacity=".6"/>
        <path d="M330 640 C300 500 610 420 680 300" fill="none" stroke="${stroke}" stroke-width="8"/>
        <path d="M310 610 C290 500 600 410 678 292" fill="none" stroke="${fold}" stroke-width="2" opacity=".6"/>
      `;
    case "sneaker":
      return `
        <path d="M250 760 Q250 700 300 680 L350 660 L380 560 Q390 520 430 528 L470 540 Q520 560 550 620 L600 680 Q660 700 676 750 Q680 790 640 800 L300 800 Q250 790 250 760 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M250 780 Q450 816 676 780" stroke="${stroke}" stroke-width="2" fill="none"/>
        <path d="M250 792 Q450 826 676 792" stroke="${fine}" stroke-width="8" fill="none"/>
        <path d="M380 560 Q450 610 550 620" fill="none" stroke="${stroke}" stroke-width="2"/>
        ${Array.from({ length: 5 }, (_, i) => `<path d="M${400 + i * 24} ${570 + i * 10} L${430 + i * 24} ${602 + i * 10}" stroke="${stroke}" stroke-width="2.5"/>`).join("")}
        <path d="M620 700 Q660 720 668 760" fill="none" stroke="${fine}" stroke-width="2"/>
        <path d="M320 760 Q480 786 620 760" fill="none" stroke="${fold}" stroke-width="14"/>
      `;
    case "loafer":
      return `
        <path d="M250 770 Q250 720 300 700 L410 660 Q430 600 470 610 L560 660 Q640 690 664 740 Q676 780 630 792 L300 792 Q250 790 250 770 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M250 778 Q450 810 670 778" stroke="${stroke}" stroke-width="2" fill="none"/>
        <path d="M380 690 Q450 720 520 700" fill="none" stroke="${stroke}" stroke-width="2"/>
        <path d="M420 670 H500 L490 700 H430 Z" fill="none" stroke="${stroke}" stroke-width="2"/>
        <path d="M250 800 Q450 826 670 800" stroke="${fine}" stroke-width="7" fill="none"/>
      `;
    case "sandal":
      return `
        <path d="M260 770 Q450 720 660 770 L650 800 Q450 850 270 800 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M300 770 Q360 660 430 742" fill="none" stroke="${stroke}" stroke-width="12"/>
        <path d="M420 748 Q500 650 590 752" fill="none" stroke="${stroke}" stroke-width="12"/>
        <path d="M300 770 L330 700 M590 752 L620 700" stroke="${fine}" stroke-width="3"/>
        <path d="M300 700 Q310 690 320 700 M600 700 Q610 690 620 700" fill="none" stroke="${stroke}" stroke-width="3"/>
        <path d="M270 806 Q450 850 650 806" stroke="${fine}" stroke-width="7" fill="none"/>
      `;
    case "cap":
      return `
        <path d="M300 700 Q300 500 470 500 Q640 500 640 700 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M300 700 Q250 720 240 770 Q420 800 600 748 L640 700 Z" fill="${shade(c, -14)}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M470 500 V700" stroke="${fine}" stroke-width="2"/>
        <path d="M380 530 Q420 610 420 700 M560 530 Q520 610 520 700" stroke="${fine}" stroke-width="2"/>
        <circle cx="470" cy="500" r="7" fill="${shade(c, -30)}"/>
        <path d="M250 770 Q430 796 606 746" stroke="${fold}" stroke-width="10" fill="none"/>
      `;
    case "hat":
      return `
        <ellipse cx="450" cy="730" rx="250" ry="74" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M320 716 Q320 470 450 470 Q580 470 580 716 Q450 750 320 716 Z" fill="${shade(c, 8)}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M316 660 Q450 690 584 660 L582 700 Q450 730 318 700 Z" fill="${shade(c, -30)}" stroke="${stroke}" stroke-width="2"/>
        <path d="M340 560 Q450 590 560 560" fill="none" stroke="${fold}" stroke-width="14"/>
      `;
    case "sunglasses":
      return `
        <rect x="250" y="470" width="170" height="120" rx="52" fill="${c}" stroke="${stroke}" stroke-width="3"/>
        <rect x="480" y="470" width="170" height="120" rx="52" fill="${c}" stroke="${stroke}" stroke-width="3"/>
        <path d="M420 520 Q450 500 480 520" fill="none" stroke="${stroke}" stroke-width="8"/>
        <path d="M250 510 L180 470 M650 510 L720 470" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>
        <path d="M270 500 Q310 480 350 500" fill="none" stroke="${light}" stroke-width="5" opacity=".5"/>
        <path d="M500 500 Q540 480 580 500" fill="none" stroke="${light}" stroke-width="5" opacity=".5"/>
      `;
    case "belt":
      return `
        <path d="M260 520 H640 Q660 520 660 540 V580 Q660 600 640 600 H260" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M260 520 V600" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="610" y="500" width="90" height="120" rx="10" fill="none" stroke="${stroke}" stroke-width="8"/>
        <path d="M640 560 H700" stroke="${stroke}" stroke-width="6"/>
        ${[300, 340, 380, 420, 460, 500, 540].map((x) => `<circle cx="${x}" cy="560" r="6" fill="${fine}"/>`).join("")}
        <path d="M270 532 H600" stroke="${fold}" stroke-width="10"/>
      `;
    case "wallet":
      return `
        <rect x="280" y="420" width="340" height="240" rx="18" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M280 540 H620" stroke="${stroke}" stroke-width="2"/>
        <rect x="300" y="560" width="300" height="50" rx="6" fill="none" stroke="${fine}" stroke-width="2"/>
        <rect x="300" y="620" width="300" height="20" rx="4" fill="none" stroke="${fine}" stroke-width="2"/>
        <circle cx="470" cy="470" r="18" fill="none" stroke="${stroke}" stroke-width="2"/>
        <path d="M452 470 H488 M470 452 V488" stroke="${stroke}" stroke-width="2"/>
        <path d="M300 440 H600" stroke="${fold}" stroke-width="8"/>
      `;
    case "socks":
      return `
        <path d="M320 380 H470 L500 760 Q506 830 440 840 Q380 848 366 790 L320 470 Z" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M470 380 H620 L650 760 Q656 830 590 840 Q530 848 516 790 L470 470 Z" fill="${shade(c, -10)}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M320 420 H470 M470 420 H620" stroke="${stroke}" stroke-width="2"/>
        <path d="M330 450 H462 M480 450 H612" stroke="${fine}" stroke-width="6"/>
        <path d="M390 780 Q420 812 456 806 M540 780 Q570 812 606 806" fill="none" stroke="${stroke}" stroke-width="2"/>
      `;
    case "jewelry":
      return `
        <circle cx="380" cy="600" r="110" fill="none" stroke="${c}" stroke-width="16"/>
        <circle cx="380" cy="600" r="110" fill="none" stroke="${light}" stroke-width="4" opacity=".7"/>
        <circle cx="560" cy="660" r="84" fill="none" stroke="${c}" stroke-width="13"/>
        <circle cx="560" cy="660" r="84" fill="none" stroke="${light}" stroke-width="3" opacity=".7"/>
        <circle cx="380" cy="490" r="10" fill="${shade(c, -40)}"/>
        <circle cx="560" cy="576" r="8" fill="${shade(c, -40)}"/>
      `;
    default:
      return `<circle cx="450" cy="650" r="180" fill="${c}" stroke="${stroke}" stroke-width="2.5"/>`;
  }
}

function svg(type, colorName, hex) {
  const c = hex;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${labels[type]} in ${colorName}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#F2EDE4"/>
      <stop offset="1" stop-color="#E4DCCD"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
    </filter>
    <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2A2724" stop-opacity=".18"/>
      <stop offset="1" stop-color="#2A2724" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".24"/>
      <stop offset=".55" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <rect width="900" height="1200" filter="url(#grain)" opacity=".7"/>
  <rect x="52" y="52" width="796" height="1096" fill="none" stroke="#2A2724" stroke-opacity=".16"/>
  <ellipse cx="450" cy="960" rx="260" ry="58" fill="url(#shadow)"/><filter id="drop"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#201e1b" flood-opacity="0.22"/></filter>
  <g>
    ${garment(type, c)}
    <path d="M300 420 C420 450 560 450 660 420 L660 940 L300 940 Z" fill="url(#sheen)" opacity=".25" style="mix-blend-mode:screen"/>
  </g>
  <text x="88" y="1112" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="5" fill="#2A2724" fill-opacity=".62">DAYSHIFT</text>
  <text x="812" y="1112" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="13" letter-spacing="3" fill="#2A2724" fill-opacity=".5">${labels[type]}</text>
  <text x="88" y="88" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="4" fill="#2A2724" fill-opacity=".45">STUDIO / ${String(Object.keys(COLORS).indexOf(slug(colorName)) + 1).padStart(2, "0")}</text>
</svg>`;
}

await mkdir(outDir, { recursive: true });
let count = 0;
for (const type of Object.keys(labels)) {
  for (const [colorSlug, hex] of Object.entries(COLORS)) {
    const colorName = colorSlug.replace(/-/g, " ");
    await writeFile(join(outDir, `${type}-${colorSlug}.svg`), svg(type, colorName, hex), "utf8");
    count += 1;
  }
}
console.log(`Generated ${count} studio illustrations in apps/web/public/art`);
