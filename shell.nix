let
  nixpkgs.url = "https://github.com/NixOS/nixpkgs/archive/4d2b37a84fad1091b9de401eb450aae66f1a741e.tar.gz";
  nixpkgs.sha256 = "11w3wn2yjhaa5pv20gbfbirvjq6i3m7pqrq2msf0g7cv44vijwgw";
in
{ pkgs ? import <nixpkgs> {} }:

let
  # all binary requirements of pdf-extract npm package
  pdftk = pkgs.pdftk;
  pdftotext = pkgs.poppler;
  ghostscript = pkgs.ghostscript;
  tesseractjs = pkgs.tesseract4;
in

pkgs.stdenv.mkDerivation {
  name = "nix-shell-bza";

  buildInputs = [
    pkgs.nodejs
    pkgs.tmux

    # command line epub reader
    pkgs.epr
    # pkgs.xpdf marked insecure
    pkgs.mupdf

    # all binary requirements of pdf-extract npm package
    pdftk
    pdftotext
    ghostscript
    tesseractjs
  ];

  shellHook = ''
    alias bza=$(pwd)/bza.mjs
    bza --help
# TODO tmux commands to make two windows (also make it so you can turn off tmux)
    echo "Hi, it's bza time!\n some useful links: http://bropages.org/tmux\n To get started you could run something like "
  '';
}
