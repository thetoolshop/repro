#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")

echo $BASE_PATH

for d in "$BASE_PATH/npm-forks/*/"; do
  (cd $d; npm install)
done
