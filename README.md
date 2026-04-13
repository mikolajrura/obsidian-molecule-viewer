# Molecule Embeds

Obsidian plugin that renders **SMILES** strings as beautiful 2D skeletal molecular graphs, powered by [RDKit.js](https://github.com/rdkit/rdkit).

- Black background, white bonds
- Heteroatoms coloured: O = red, N = blue, S = green
- Copy molecule as PNG with one click
- Works fully **offline** — no internet required

## Usage

Paste a SMILES string in a code block:

````
```smiles
CC(=O)OC1=CC=CC=C1C(=O)O
```
````

Or use the command palette (`Ctrl+P` → *Otwórz podgląd molekuły*), type SMILES and press **Enter** to embed it in the current note.

## Install

```bash
bash <(curl -sL https://raw.githubusercontent.com/mikolajrura/molecule-embeds/master/install.sh) /path/to/vault
```

Then: Obsidian → Settings → Community plugins → enable **Molecule Embeds**.

## Dev

```bash
git clone https://github.com/mikolajrura/molecule-embeds
cd molecule-embeds
npm install
npm run build
```
