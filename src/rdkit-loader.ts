// Load RDKit WASM from the local plugin directory (no internet needed).
// RDKit_minimal.js and RDKit_minimal.wasm must sit next to main.js.

export interface RDKitMol {
  get_svg(): string;
  get_svg_with_highlights(details: string): string;
  add_hs(): RDKitMol;
  delete(): void;
  is_valid(): boolean;
}

export interface RDKitModule {
  get_mol(smiles: string): RDKitMol;
  version(): string;
}

let rdkitPromise: Promise<RDKitModule> | null = null;

export function loadRDKit(pluginDir: string): Promise<RDKitModule> {
  if (rdkitPromise) return rdkitPromise;

  rdkitPromise = (async () => {
    // Use Node.js fs to read the file, then eval in global scope.
    // This avoids Electron's patched require which resolves to its own asar.
    const nodeRequire = eval("require") as NodeRequire;
    const fs = nodeRequire("fs") as typeof import("fs");
    const path = nodeRequire("path") as typeof import("path");

    const rdkitJsPath = path.join(pluginDir, "RDKit_minimal.js");
    const wasmPath = path.join(pluginDir, "RDKit_minimal.wasm");

    console.log("Molecule Viewer: loading RDKit from", rdkitJsPath);

    // Read script and evaluate in global scope (indirect eval)
    const script = fs.readFileSync(rdkitJsPath, "utf-8");
    (0, eval)(script);

    // initRDKitModule is now a global var
    const initFn = (globalThis as any).initRDKitModule as (
      opts?: object
    ) => Promise<RDKitModule>;

    if (!initFn) {
      throw new Error("initRDKitModule not found after eval");
    }

    // Read WASM binary from disk and pass directly — avoids fetch()
    const wasmBinary = fs.readFileSync(wasmPath);
    const mod = await initFn({ wasmBinary });

    console.log("Molecule Viewer: RDKit ready, version", mod.version());
    return mod;
  })();

  return rdkitPromise;
}
