// Singleton RDKit WASM module loader.
// RDKit is heavy (~10MB WASM), load once and reuse.

declare global {
  interface Window {
    initRDKitModule: () => Promise<RDKitModule>;
    RDKit: RDKitModule | null;
  }
}

export interface RDKitMol {
  get_svg(): string;
  get_svg_with_highlights(details: string): string;
  add_hs(): RDKitMol;
  delete(): void;
  is_valid(): boolean;
}

export interface RDKitModule {
  get_mol(smiles: string): RDKitMol;
  get_mol_from_smiles(smiles: string): RDKitMol;
  version(): string;
}

let rdkitPromise: Promise<RDKitModule> | null = null;

export async function loadRDKit(): Promise<RDKitModule> {
  if (rdkitPromise) return rdkitPromise;

  rdkitPromise = new Promise((resolve, reject) => {
    // RDKit bundles a self-contained WASM init function.
    // We load it from the CDN since bundling WASM into Obsidian plugins is complex.
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@rdkit/rdkit/Code/MinimalLib/dist/RDKit_minimal.js";
    script.onload = async () => {
      try {
        const mod = await (window as any).initRDKitModule();
        (window as any).RDKit = mod;
        resolve(mod);
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error("Failed to load RDKit script"));
    document.head.appendChild(script);
  });

  return rdkitPromise;
}
