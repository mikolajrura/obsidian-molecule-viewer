export enum ViewMode {
  Skeletal = "skeletal",
  SemiStructural = "semi",
  Structural = "structural",
}

export interface DrawOptions {
  addAtomIndices: boolean;
  addBondIndices: boolean;
  explicitMethyl: boolean;
  addStereoAnnotation: boolean;
  bondLineWidth: number;
  backgroundColour: [number, number, number, number];
  atomColourPalette: Record<string, [number, number, number]>;
}
