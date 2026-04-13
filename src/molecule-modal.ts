import { App, Editor, MarkdownView, Modal } from "obsidian";
import { RDKitModule } from "./rdkit-loader";
import { renderMolecule } from "./molecule-renderer";

export class MoleculeModal extends Modal {
  private rdkitReady: Promise<RDKitModule>;

  constructor(app: App, rdkitReady: Promise<RDKitModule>) {
    super(app);
    this.rdkitReady = rdkitReady;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("mol-modal-container");
    contentEl.addClass("mol-modal");

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Wklej SMILES…",
      cls: "mol-modal-input",
    });

    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const smiles = input.value.trim();
      if (!smiles) return;

      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) return;

      const editor = view.editor;
      const cursor = editor.getCursor();
      const block = `\n\`\`\`smiles\n${smiles}\n\`\`\`\n`;
      editor.replaceRange(block, cursor);
      editor.setCursor({ line: cursor.line + 4, ch: 0 });

      this.close();
    });

    input.focus();
  }

  onClose() {
    this.contentEl.empty();
  }
}
