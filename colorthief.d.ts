declare module "colorthief" {
  type RGB = [number, number, number];
  function getColor(img: Buffer | string, quality?: number): Promise<RGB>;
  function getPalette(img: Buffer | string, colorCount?: number, quality?: number): Promise<RGB[]>;
}
