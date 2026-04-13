import { Plugin, MarkdownPostProcessorContext } from "obsidian";
import { loadRDKit, RDKitModule } from "./rdkit-loader";
import { renderMolecule } from "./molecule-renderer";
import { MoleculeModal } from "./molecule-modal";

export default class MoleculeViewerPlugin extends Plugin {
  private rdkit: RDKitModule | null = null;
  private rdkitLoading: Promise<RDKitModule> | null = null;

  async onload() {
    console.log("Molecule Viewer: loading plugin");

    // Start loading RDKit in the background immediately
    this.rdkitLoading = loadRDKit().then((mod) => {
      this.rdkit = mod;
      console.log(`Molecule Viewer: RDKit loaded (${mod.version()})`);
      return mod;
    });

    this.addCommand({
      id: "open-molecule-viewer",
      name: "Otwórz podgląd molekuły (SMILES)",
      callback: async () => {
        if (!this.rdkit) await this.rdkitLoading;
        new MoleculeModal(this.app, this.rdkit!).open();
      },
    });

    this.registerMarkdownCodeBlockProcessor(
      "smiles",
      this.processBlock.bind(this)
    );
    this.registerMarkdownCodeBlockProcessor(
      "mol",
      this.processBlock.bind(this)
    );
  }

  async processBlock(
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext
  ) {
    if (!this.rdkit) {
      // Show loading indicator while WASM initialises
      const loading = el.createEl("p", {
        text: "Loading RDKit...",
        cls: "mol-loading",
      });

      try {
        await this.rdkitLoading;
        loading.remove();
      } catch (e) {
        loading.setText(
          "Failed to load RDKit. Check your internet connection."
        );
        loading.addClass("mol-error");
        return;
      }
    }

    renderMolecule(source, el, this.rdkit!);
  }

  onunload() {
    console.log("Molecule Viewer: unloading plugin");
  }
}
