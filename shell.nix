{ pkgs ? import <nixpkgs> {} }:

pkgs.stdenv.mkDerivation {
  name = "nix-shell-bza";

  buildInputs = [
    pkgs.nodejs-18_x

    pkgs.sqlite

    # use this to fuzzy search db results
    pkgs.fzf

    # TODO (possibly) settle on multiplexing solution
    # pkgs.screen
    # pkgs.tmux

    # epub to markdown
    pkgs.pandoc

    # markdown reader
    pkgs.glow

    # (used for installing parsr)
    pkgs.docker
  ];

  shellHook = ''
    alias bza="DB_PATH=$(pwd)/bookmarks.sq3 $(pwd)/bza.mjs"
    # alias perco="./node_modules/.bin/percollate"
    bza --help
    export IS_DEV=true
    echo "html to markdown"
    echo "curl https://example.com | percollate md -o ./library/my.md -u https://example.com -"
    echo "epub to markdown"
    echo "TODO"
# some useful links: http://bropages.org/tmux
# TODO tmux commands to make two windows (also make it so you can turn off tmux)
    echo "It's bza time!"
  '';
}
