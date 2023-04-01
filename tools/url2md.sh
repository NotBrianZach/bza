#!/usr/bin/env bash

usage() {
  echo "Usage: $0 -u <URL> [-o <output_file>] [-f <URLs_file>] [-l <local_html_file>]"
  exit 1
}

# Parse command line options
while getopts ":u:o:f:l:" opt; do
  case $opt in
    u) URL="$OPTARG";;
    o) OUTPUT_FILE="$OPTARG";;
    f) URLS_FILE="$OPTARG";;
    l) LOCAL_HTML_FILE="$OPTARG";;
    \?) usage;;
  esac
done

if [ -z "$URL" ] && [ -z "$URLS_FILE" ] && [ -z "$LOCAL_HTML_FILE" ]; then
  usage
fi

convert_to_markdown() {
  local input="$1"
  local output_file="$2"
  local is_url="$3"

  if [ "$is_url" = "true" ]; then
    # Download the webpage and convert to Markdown
    wget -O- "$input" | pandoc -f html -t gfm -o "$output_file" -
  else
    # Convert local HTML file to Markdown
      pandoc -f html -t gfm -o "$output_file" "$input"
  fi

  # Replace img tags with image URLs in Markdown format
  sed -i 's/\!\[\(.*\)\](\(.*\))/\[\1\]\(\2\)/g' "$output_file"

  echo "Converted input to Markdown: $output_file"
}

# Convert single URL
if [ ! -z "$URL" ]; then
  if [ -z "$OUTPUT_FILE" ]; then
    OUTPUT_FILE="$(echo "$URL" | sed 's/.*\/\/\([^/]*\).*/\1/').md"
  fi

  convert_to_markdown "$URL" "$OUTPUT_FILE" true
fi

# Batch convert URLs from file
if [ ! -z "$URLS_FILE" ]; then
  while IFS= read -r url; do
    output_file="$(echo "$url" | sed 's/.*\/\/\([^/]*\).*/\1/').md"
    convert_to_markdown "$url" "$output_file" true
  done < "$URLS_FILE"
fi

# Convert local HTML file
if [ ! -z "$LOCAL_HTML_FILE" ]; then
  if [ -z "$OUTPUT_FILE" ]; then
    OUTPUT_FILE="$(basename "$LOCAL_HTML_FILE" .html).md"
  fi

  convert_to_markdown "$LOCAL_HTML_FILE" "$OUTPUT_FILE" false
fi
