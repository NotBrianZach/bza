{
  description = "bza — AI-powered bookmark and knowledge management (flake stub)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  # bza is packaged via a Cathedral tarball overlay in
  # system_config/my-overlays.nix. This flake exists only to satisfy
  # the `bza.url = "git://..."` input contract in system_config so
  # nix eval succeeds; the real package on PATH comes from the overlay.
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        packages.default = pkgs.writeTextDir "share/bza-stub/README" ''
          bza flake stub. Real overlay-built bza is on PATH; this
          output exists only to satisfy the flake input contract.
        '';
      });
}
