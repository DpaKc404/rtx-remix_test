#!/bin/bash
# Linux equivalent of install_file_in_dir.bat
# $1 = source file(s) (supports glob)
# $2 = destination directory

SRC="$1"
DST_DIR="$2"

mkdir -p "$DST_DIR" || { echo "ERROR: failed to create $DST_DIR" >&2; exit 1; }
cp -f $SRC "$DST_DIR/" || { echo "ERROR: failed to copy $SRC to $DST_DIR" >&2; exit 1; }
