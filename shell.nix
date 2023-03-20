{ pkgs ? import <nixpkgs> {} }:

pkgs.stdenv.mkDerivation {
  name = "nix-shell-bza";

  buildInputs = [
    pkgs.nodejs-18_x

    pkgs.sqlite
    # pkgs.electron
    pkgs.lynx

    # use this to fuzzy search db results
    pkgs.fzf

    # TODO (possibly) settle on multiplexing solution
    # pkgs.screen
    # pkgs.tmux

    # epub to markdown
    pkgs.pandoc

    # (used for installing parsr)
    pkgs.docker
  ];

  shellHook = ''
    alias bza="DB_PATH=$(pwd)/db/bookmarks.sq3 $(pwd)/bza.mjs"
    alias percollate="./node_modules/.bin/percollate"
    alias vmd="./node_modules/.bin/vmd"
# rmd () {
#   pandoc $1 | lynx -stdin
# }
# function mdview {
# pandoc "$1" -f markdown -t html | lynx -stdin
# }
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
