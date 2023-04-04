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
    export OPENAI_API_KEY=$OPENAI_API_KEY
    export bzaDir=$(pwd)
    alias bza="DB_PATH=$bzaDir/db/bookmarks.sq3 $(pwd)/bza.mjs"
    function pullUrl() {
      url=$1
      # mkdir -p "$folder_name"
      wget --recursive --no-clobber --level 1 --accept html,js,tmp,jpg,jpeg,png,gif,css --directory-prefix="dled" "$url"
    }

    alias html2md="$(pwd)/tools/html2md.sh"
    alias url2md="$(pwd)/tools/url2md.sh"
    alias gptClean="$(pwd)/tools/gptClean.sh"
    # alias vmd="./node_modules/.bin/vmd"
    # function mdview {
    # pandoc "$1" -f markdown -t html | lynx -stdin
    # }
    bza --help
    export IS_DEV=true

# some useful links: http://bropages.org/tmux
# TODO tmux commands to make two windows (also make it so you can turn off tmux)
    echo "It's bza time!"
  '';
}
# { pkgs ? import <nixpkgs> {} }:

# pkgs.mkShell {
#   name = "my-postgres-shell";
#   buildInputs = [ pkgs.postgresql ];

#   shellHook = ''
#     export PGDATA=${toString ./my-db-dir}
#     export PGPORT=5432
#     export PGHOST=localhost
#     export PGUSER=myuser
#     export PGPASSWORD=mypassword

#     mkdir -p $PGDATA
#     if [ ! -e $PGDATA/PG_VERSION ]; then
#       echo "Initializing PostgreSQL database in $PGDATA"
#       initdb --auth=md5 --username=$PGUSER --pwfile=<(echo $PGPASSWORD)
#     fi

#     pg_ctl start
#     trap "pg_ctl stop" EXIT
#   '';
# }

