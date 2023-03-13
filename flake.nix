{
  flake-name = "nix-shell-pdftk-pdftotext-ghostscript-tesseractjs";

  inputs.nixpkgs.url = "https://github.com/NixOS/nixpkgs/archive/{nixpkgs.ref}.tar.gz";
  inputs.nixpkgs.ref = "stable";

  outputs = { self, nixpkgs }: {
    shell = self.stdenv.mkDerivation {
      name = "nix-shell-pdftk-pdftotext-ghostscript-tesseractjs";

      buildInputs = [
        nixpkgs.nodejs

        # reading list util
        nixpkgs.jq


        # all binary requirements of pdf-extract npm package
        nixpkgs.pdftk
        nixpkgs.poppler
        nixpkgs.ghostscript
        nixpkgs.tesseract4
      ];
    };
  };
}
