import { App, Modal } from "obsidian";
import { RDKitModule } from "./rdkit-loader";
import { renderMolecule } from "./molecule-renderer";

export class MoleculeModal extends Modal {
  private rdkit: RDKitModule;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(app: App, rdkit: RDKitModule) {
    super(app);
    this.rdkit = rdkit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("mol-modal");

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Wklej SMILES…",
      cls: "mol-modal-input",
    });

    const preview = contentEl.createDiv({ cls: "mol-modal-preview" });

    input.addEventListener("input", () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const smiles = input.value.trim();
        if (smiles) renderMolecule(smiles, preview, this.rdkit);
        else preview.empty();
      }, 300);
    });

    // Focus immediately so user can paste right away
    input.focus();
  }

  onClose() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.contentEl.empty();
  }
}
