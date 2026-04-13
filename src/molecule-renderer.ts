import { ViewMode } from "./types";
import type { RDKitModule, RDKitMol } from "./rdkit-loader";

// Custom colour palette: black background, white bonds, coloured heteroatoms.
// RDKit colour values are in [0, 1] RGB range.
const ATOM_COLOURS: Record<string, [number, number, number]> = {
  "1":  [0.75, 0.75, 0.75], // H  → light grey
  "6":  [1.0,  1.0,  1.0],  // C  → white
  "7":  [0.2,  0.4,  1.0],  // N  → blue
  "8":  [1.0,  0.2,  0.2],  // O  → red
  "9":  [0.2,  0.9,  0.2],  // F  → green (like S for now)
  "15": [1.0,  0.6,  0.0],  // P  → orange
  "16": [0.2,  0.9,  0.2],  // S  → green
  "17": [0.2,  0.9,  0.2],  // Cl → green
  "35": [0.6,  0.2,  0.0],  // Br → brown
  "53": [0.4,  0.0,  0.6],  // I  → purple
};

function buildDrawDetails(mode: ViewMode): object {
  const base = {
    bondLineWidth: 2.5,
    backgroundColour: [0, 0, 0, 1] as [number, number, number, number],
    atomColourPalette: ATOM_COLOURS,
    addAtomIndices: false,
    addBondIndices: false,
    addStereoAnnotation: false,
    explicitMethyl: false,
    padding: 0.15,
  };

  if (mode === ViewMode.SemiStructural) {
    return { ...base, explicitMethyl: true, addStereoAnnotation: true };
  }

  return base;
}

function patchSvgBackground(svg: string): string {
  // RDKit sometimes emits a white background rect — replace with transparent
  // so our CSS black background shows through cleanly.
  return svg
    .replace(/fill:#ffffff[^"]*"/gi, 'fill:#000000"')
    .replace(/fill:white[^"]*"/gi, 'fill:black"');
}

function autoSize(svg: string, containerWidth: number): string {
  // Preserve aspect ratio while fitting the container width.
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  if (!vbMatch) return svg;
  const [, vx, vy, vw, vh] = vbMatch[1].split(" ").map(Number);
  const aspect = vw / vh;
  const w = Math.min(containerWidth, vw);
  const h = w / aspect;
  return svg
    .replace(/width="[^"]*"/, `width="${w}"`)
    .replace(/height="[^"]*"/, `height="${h}"`);
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

  // Controls row
  const controls = container.createDiv({ cls: "mol-controls" });
  const svgWrapper = container.createDiv({ cls: "mol-svg-wrapper" });

  let currentMode: ViewMode = ViewMode.Skeletal;

  const buttons: Record<ViewMode, HTMLButtonElement> = {
    [ViewMode.Skeletal]: controls.createEl("button", {
      text: "Szkieletowy",
      cls: "mol-btn mol-btn--active",
    }),
    [ViewMode.SemiStructural]: controls.createEl("button", {
      text: "Półstrukturalny",
      cls: "mol-btn",
    }),
    [ViewMode.Structural]: controls.createEl("button", {
      text: "Strukturalny",
      cls: "mol-btn",
    }),
  };

  function draw(mode: ViewMode) {
    svgWrapper.empty();

    let mol: RDKitMol | null = null;
    let molWithH: RDKitMol | null = null;

    try {
      mol = rdkit.get_mol(smiles);
      if (!mol || !mol.is_valid()) {
        svgWrapper.createEl("p", {
          text: `Invalid SMILES: ${smiles}`,
          cls: "mol-error",
        });
        return;
      }

      const details = JSON.stringify(buildDrawDetails(mode));
      let svg: string;

      if (mode === ViewMode.Structural) {
        molWithH = mol.add_hs();
        svg = molWithH.get_svg_with_highlights(details);
      } else {
        svg = mol.get_svg_with_highlights(details);
      }

      svg = patchSvgBackground(svg);
      svg = autoSize(svg, svgWrapper.clientWidth || 600);

      svgWrapper.innerHTML = svg;
    } catch (e) {
      svgWrapper.createEl("p", {
        text: `Render error: ${(e as Error).message}`,
        cls: "mol-error",
      });
    } finally {
      mol?.delete();
      molWithH?.delete();
    }
  }

  function switchMode(mode: ViewMode) {
    Object.entries(buttons).forEach(([m, btn]) => {
      btn.toggleClass("mol-btn--active", m === mode);
    });
    currentMode = mode;
    draw(mode);
  }

  buttons[ViewMode.Skeletal].addEventListener("click", () =>
    switchMode(ViewMode.Skeletal)
  );
  buttons[ViewMode.SemiStructural].addEventListener("click", () =>
    switchMode(ViewMode.SemiStructural)
  );
  buttons[ViewMode.Structural].addEventListener("click", () =>
    switchMode(ViewMode.Structural)
  );

  draw(currentMode);
}
