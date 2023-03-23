#!/usr/bin/env bash

DB_PATH=$(pwd)/bookmarks.sq3 node dbSchema.mjs
DB_PATH=$(pwd)/bookmarks.sq3 node dbExamples.mjs
