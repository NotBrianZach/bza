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

    # html oepub to markdown
    pkgs.pandoc

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
    sudo dockerd &
    echo "installing parsr:docker pull axarev/parsr"
    wait && sudo docker pull axarev/parsr
    echo "installing parsr gui: docker pull axarev/parsr-ui-localhost"
    sudo docker pull axarev/parsr-ui-localhost
    echo "running parsr:docker run -p 3001:3001 axarev/parsr"
    sudo docker run -p 3001:3001 axarev/parsr &
    echo "running parsr gui: docker run -t -p 8080:80 axarev/parsr-ui-localhost:latest"
    sudo docker run -t -p 8080:80 axarev/parsr-ui-localhost:latest &

# some useful links: http://bropages.org/tmux
# TODO tmux commands to make two windows (also make it so you can turn off tmux)
    echo "It's bza time!"
  '';
}
