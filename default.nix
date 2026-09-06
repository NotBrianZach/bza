{ pkgs ? import <nixpkgs> {} }:

pkgs.buildNpmPackage rec {
  pname = "bza";
  version = "0.1.0";

  src = ./.;

  # Use Node.js 20 for better compatibility with better-sqlite3
  nodejs = pkgs.nodejs_20;

  # Use the existing package-lock.json
  npmDepsHash = "sha256-CjoA4FddI1Y62qGqDABbbM7CorVYUUuZNfHTF2qa8No=";

  # Don't run npm audit
  # Use ignore-scripts to skip postinstall scripts that require network
  npmFlags = [ "--legacy-peer-deps" "--ignore-scripts" ];

  # Build dependencies needed for better-sqlite3 native module
  nativeBuildInputs = with pkgs; [
    python3
    pkg-config
  ];

  buildInputs = with pkgs; [
    sqlite
  ];

  # Skip puppeteer chromium download
  PUPPETEER_SKIP_DOWNLOAD = "1";

  # We need to manually build better-sqlite3 since we're using --ignore-scripts
  npmBuildScript = "rebuild better-sqlite3";

  # Override to manually build better-sqlite3
  buildPhase = ''
    runHook preBuild

    # Manually rebuild better-sqlite3 native module
    if [ -d node_modules/better-sqlite3 ]; then
      cd node_modules/better-sqlite3
      ${pkgs.nodejs_20}/bin/npm run install --ignore-scripts=false || true
      cd ../..
    fi

    runHook postBuild
  '';

  installPhase = ''
    mkdir -p $out/bin
    mkdir -p $out/lib/bza

    # Copy all application files (excluding development artifacts)
    cp -r . $out/lib/bza/

    # Remove development artifacts that shouldn't be in the package
    rm -rf $out/lib/bza/bzaenv
    rm -rf $out/lib/bza/.venv
    rm -rf $out/lib/bza/result
    rm -rf $out/lib/bza/.direnv
    rm -rf $out/lib/bza/.envrc

    # Copy node_modules from the build
    rm -rf $out/lib/bza/node_modules
    cp -r node_modules $out/lib/bza/

    # Create wrapper script
    cat > $out/bin/bza <<EOF
#!/usr/bin/env bash
cd $out/lib/bza
exec ${pkgs.nodejs_20}/bin/node bza.mjs "\$@"
EOF
    chmod +x $out/bin/bza

    # Create symlink for bza-lite
    ln -s $out/bin/bza $out/bin/bza-lite
  '';

  meta = with pkgs.lib; {
    description = "BZA - AI-powered bookmark and knowledge management system";
    homepage = "https://github.com/NotBrianZach/gptbook2quiz";
    license = licenses.isc;
    platforms = platforms.unix;
    maintainers = [ ];
  };
}
