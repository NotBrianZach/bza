let
pkgs = import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/4d2b37a84fad1091b9de401eb450aae66f1a741e.tar.gz";
    # If desired, you can add a hash to ensure the fetched tarball matches the expected content:
    # how to get hash: nix-prefetch-url --unpack https://github.com/NixOS/nixpkgs/archive/4d2b37a84fad1091b9de401eb450aae66f1a741e.tar.gz
    sha256 = "11w3wn2yjhaa5pv20gbfbirvjq6i3m7pqrq2msf0g7cv44vijwgw";
  }) {};
in

pkgs.stdenv.mkDerivation {
  name = "bza-nix-shell";

  buildInputs = [
    pkgs.nodejs-18_x
    pkgs.python39
    pkgs.ffmpeg

    pkgs.sqlite

    # use this to fuzzy search db results
    pkgs.jq

    # use this to fuzzy search db results (maybe)
    pkgs.fzf
    (pkgs.postgresql_15.withPackages(ps: [ pkgs.postgresql15Packages.pgvector ]))

    # TODO (possibly) settle on multiplexing solution
# some useful links: http://bropages.org/tmux
# TODO tmux commands to make two windows (also make it so you can turn off tmux)
    # pkgs.screen
    # pkgs.tmux

    # html oepub to markdown
    pkgs.pandoc
  ];

  shellHook = ''
    export OPENAI_API_KEY=$OPENAI_API_KEY
    export bzaDir=$(pwd)

# sed -i "s|^#port.*$|port = 5433|" $PGDATA/postgresql.conf

    function pullUrl() {
      url=$1
      # mkdir -p "$folder_name"
      wget --recursive --no-clobber --level 1 --accept html,js,tmp,jpg,jpeg,png,gif,css --directory-prefix="dled" "$url"
    }

    function openUrl() {
       local URL="$1";
       xdg-open $URL || sensible-browser $URL || x-www-browser $URL || gnome-open $URL;
    }
    function mdview {
      pandoc "$1" -f markdown -t html -o .tmp.html
      openUrl .tmp.html
    }
    # alias mdview=mdview

    #BEGIN POSTGRES
    # https://github.com/toraritte/shell.nixes
    # Define the default port number
    PGPORT=5432
    export PGNAME="bzadb"
    export PGHOST=localhost
    export PGUSER=$(whoami)
    export PGPASSWORD=bza
    PGURL=postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGNAME
    #######################################################################
    # If database is  not initialized (i.e., $PGDATA  directory does not  #
    # exist), then set  it up. handy when one had to force reboot the iron#
    #######################################################################

    export PGDATA=${toString ./db/postgres}
    mkdir -p $PGDATA
    #############################################################
    # Init PostgreSQL                                           #
    #                                                           #
    # NOTE `initdb (create directory)` vs `createdb (create db)`#
    #                                                           #
    # + What's the difference between initdb and createdb       #
    #   https://stackoverflow.com/questions/50210158/           #
    #                                                           #
    # + https://www.postgresql.org/docs/current/app-initdb.html #
    #                                                           #
    #############################################################


    function start_postgres {
        pg_ctl                                                \
        -D $PGDATA                                            \
        -l $PGDATA/postgres.log                               \
        -o "-c unix_socket_directories='$PGDATA'"             \
        -o "-c listen_addresses='*'"                          \
        -o "-c log_destination='stderr'"                      \
        -o "-c logging_collector=on"                          \
        -o "-c log_directory='log'"                           \
        -o "-c log_filename='postgresql-%Y-%m-%d_%H%M%S.log'" \
        -o "-c log_min_messages=info"                         \
        -o "-c log_min_error_statement=info"                  \
        -o "-c log_connections=on"                            \
        start

        trap "pg_ctl stop" EXIT
    }

    function change_postgresql_port {
      current_port=$1
      # checks if there is a service listening on the specified current_port on the local machine (localhost).
      is_port_in_use=$(netstat -tuln | grep -q "$current_port" && echo -n 1 || echo -n 0)
      if [ $is_port_in_use -eq 1 ]; then
        echo "Something is running on port $current_port."
        # If the current port is in use, pick a new one
        new_port=$(( $current_port + 1 ))
        # Call the function recursively to check if the new port is in use
        change_postgresql_port $new_port
      else
        if [ ! -e $PGDATA/PG_VERSION ]; then
          echo "Initializing PostgreSQL database in $PGDATA"
          initdb -D $PGDATA --auth=md5 --username=$PGUSER --pwfile=<(echo $PGPASSWORD)
        fi
        export PGPORT=$current_port
        export PGURL=postgres://$PGUSER:$PGPASSWORD@$PGHOST:$current_port/$PGNAME
        # Update the PostgreSQL configuration file with the new port
        sed -i "s|^port.*$|port = $current_port|" $PGDATA/postgresql.conf

        echo "Changed PostgreSQL port to $current_port."
        ########################################################################
        # Configure and start PostgreSQL                                       #
        # ==================================================================== #
        #                                                                      #
        # Setting all  necessary configuration  options via  `pg_ctl` (which   #
        # is  basically  a wrapper  around  `postgres`)  instead of  editing   #
        # `postgresql.conf` directly with `sed`. See docs:                     #
        #                                                                      #
        # + https://www.postgresql.org/docs/current/app-pg-ctl.html            #
        # + https://www.postgresql.org/docs/current/app-postgres.html          #
        #                                                                      #
        # See more on the caveats at                                           #
        # https://discourse.nixos.org/t/how-to-configure-postgresql-declaratively-nixos-and-non-nixos/4063/1
        # but recapping out of paranoia:                                       #
        #                                                                      #
        # > use `SHOW`  commands to  check the  options because  `postgres -C` #
        # > "_returns values  from postgresql.conf_" (which is  not changed by #
        # > supplying  the  configuration options  on  the  command line)  and #
        # > "_it does  not reflect  parameters supplied  when the  cluster was #
        # > started._"                                                         #
        #                                                                      #
        # OPTION SUMMARY                                                       #
        # -------------------------------------------------------------------- #
        #                                                                      #
        #  + `unix_socket_directories`                                         #
        #                                                                      #
        #    PostgreSQL  will  attempt  to create  a  pidfile  in              #
        #    `/run/postgresql` by default, but it will fail as it              #
        #    doesn't exist. By  changing the configuration option              #
        #    below, it will get created in $PGDATA.                            #
        #                                                                      #
        #   + `listen_addresses`                                               #
        #                                                                      #
        #     In   tandem  with   edits   in  `pg_hba.conf`   (see             #
        #     `HOST_COMMON`  below), it  configures PostgreSQL  to             #
        #     allow remote connections (otherwise only `localhost`             #
        #     will get  authorized  and  the  rest  of the traffic             #
        #     will be discarded).                                              #
        #                                                                      #
        #     NOTE: the  edit  to  `pga_hba.conf`  needs  to  come             #
        #           **before**  `pg_ctl  start`  (or  the  service             #
        #           needs to be restarted otherwise), because then             #
        #           the changes are not being reloaded.                        #
        #                                                                      #
        #     More info  on setting up and  troubleshooting remote             #
        #     PosgreSQL connections (these are  all mirrors of the             #
        #     same text; again, paranoia):                                     #
        #                                                                      #
        #       * connect to postgres server on google compute engine          #
        #         https://stackoverflow.com/questions/24504680/                #
        #                                                                      #
        #       * How to connect to remote PostgreSQL server on google         #
        #         compute engine?                                              #
        #         https://stackoverflow.com/questions/47794979/                #
        #                                                                      #
        #       * https://medium.com/scientific-breakthrough-of-the-afternoon/configure-postgresql-to-allow-remote-connections-af5a1a392a38
        #                                                                      #
        #       * https://gist.github.com/toraritte/f8c7fe001365c50294adfe8509080201#file-configure-postgres-to-allow-remote-connection-md
        #                                                                      #
        #   + `log*`                                                           #
        #                                                                      #
        #     Setting up basic logging,  to see remote connections             #
        #     for example.                                                     #
        #                                                                      #
        #     See the docs for more:                                           #
        #     https://www.postgresql.org/docs/current/runtime-config-logging.html
        ########################################################################

        # !!!!!!!!!!!! These are only suitable for development.
        # ! INSECURE ! (Not sure if running a production server
        # !!!!!!!!!!!!  from `nix-shell` is a good idea anyway:)

        HOST_COMMON="host\s\+all\s\+all"
        sed -i "s|^$HOST_COMMON.*127.*$|host all all 0.0.0.0/0 trust|" $PGDATA/pg_hba.conf
        sed -i "s|^$HOST_COMMON.*::1.*$|host all all ::/0 trust|"      $PGDATA/pg_hba.conf
        start_postgres

        # Create the pgvector extension in the database
        createdb $PGNAME || true
        psql -d $PGNAME -c "CREATE EXTENSION IF NOT EXISTS vector";
      fi
    }

    if [ ! -f ./db/postgres/postgresql.conf ]; then
      change_postgresql_port $PGPORT
      ./db/dbSchema.mjs
      ./db/dbExamples.mjs
    else
      start_postgres
      export PGPORT
      export PGURL
    fi
    alias bzaT="bza print | jq '.[] | {bTitle, tStamp}'"
    alias bza="$(pwd)/bza.mjs"
    alias html2md="$(pwd)/tools/html2md.sh"
    alias url2md="$(pwd)/tools/url2md.sh"
    alias gptClean="$(pwd)/tools/gptClean.sh"
    export MarkdownViewerPort=8675


    #END POSTGRES
    source bzaenv/bin/activate
    pip install -r requirements.txt


    bza --help
    export IS_DEV=true

    echo "It's bza time!"
  '';
}
