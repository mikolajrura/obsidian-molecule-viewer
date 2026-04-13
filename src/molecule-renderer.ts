import type { RDKitModule, RDKitMol } from "./rdkit-loader";

const ATOM_COLOURS: Record<string, [number, number, number]> = {
  "1":  [0.75, 0.75, 0.75], // H  → light grey
  "6":  [1.0,  1.0,  1.0],  // C  → white
  "7":  [0.2,  0.4,  1.0],  // N  → blue
  "8":  [1.0,  0.2,  0.2],  // O  → red
  "9":  [0.2,  0.9,  0.2],  // F  → green
  "15": [1.0,  0.6,  0.0],  // P  → orange
  "16": [0.2,  0.9,  0.2],  // S  → green
  "17": [0.2,  0.9,  0.2],  // Cl → green
  "35": [0.6,  0.2,  0.0],  // Br → brown
  "53": [0.4,  0.0,  0.6],  // I  → purple
};

const DRAW_DETAILS = JSON.stringify({
  width: 650,
  height: 500,
  bondLineWidth: 1.2,
  backgroundColour: [0, 0, 0, 1],
  atomColourPalette: ATOM_COLOURS,
  addAtomIndices: false,
  addBondIndices: false,
  addStereoAnnotation: false,
  explicitMethyl: false,
  padding: 0.15,
});

function patchSvgBackground(svg: string): string {
  return svg
    .replace(/fill:#ffffff[^"]*"/gi, 'fill:#000000"')
    .replace(/fill:white[^"]*"/gi, 'fill:black"');
}

function autoSize(svg: string, containerWidth: number): string {
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  if (!vbMatch) return svg;
  const [, , , vw, vh] = vbMatch[1].split(" ").map(Number);
  const aspect = vw / vh;
  const w = Math.min(containerWidth, vw);
  const h = w / aspect;
  return svg
    .replace(/width="[^"]*"/, `width="${w}"`)
    .replace(/height="[^"]*"/, `height="${h}"`);
}

async function svgToPngBlob(svgEl: SVGSVGElement): Promise<Blob> {
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth * 2;
  canvas.height = img.naturalHeight * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

export function renderMolecule(
  source: string,
  container: HTMLElement,
  rdkit: RDKitModule
): void {
  container.empty();
  container.addClass("mol-container");

  const smiles = source.trim();
  if (!smiles) {
    container.createEl("p", { text: "Empty SMILES string.", cls: "mol-error" });
    return;
  }

  const svgWrapper = container.createDiv({ cls: "mol-svg-wrapper" });

  let mol: RDKitMol | null = null;
  try {
    mol = rdkit.get_mol(smiles);
    if (!mol || !mol.is_valid()) {
      svgWrapper.createEl("p", { text: `Invalid SMILES: ${smiles}`, cls: "mol-error" });
      return;
    }

    let svg = mol.get_svg_with_highlights(DRAW_DETAILS);
    svg = patchSvgBackground(svg);
    svg = autoSize(svg, svgWrapper.clientWidth || 600);
    svgWrapper.innerHTML = svg;
  } catch (e) {
    svgWrapper.createEl("p", { text: `Render error: ${(e as Error).message}`, cls: "mol-error" });
    return;
  } finally {
    mol?.delete();
  }

  // Copy button — bottom right
  const copyBtn = container.createEl("button", { cls: "mol-copy-btn", attr: { "aria-label": "Copy image" } });
  copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

  copyBtn.addEventListener("click", async () => {
    const svgEl = svgWrapper.querySelector("svg");
    if (!svgEl) return;
    try {
      const blob = await svgToPngBlob(svgEl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      copyBtn.addClass("mol-copy-btn--done");
      setTimeout(() => copyBtn.removeClass("mol-copy-btn--done"), 1200);
    } catch (e) {
      console.error("Molecule Viewer: copy failed", e);
    }
  });
}
