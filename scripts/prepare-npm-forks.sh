#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")

# Skip build if we have a cache hit in CI
if [ "${CI_NPM_FORKS_CACHE_HIT:-}" = "true" ]; then
  echo "Skipping prepare-npm-forks due to cache hit"
  exit 0
fi

echo $BASE_PATH

for d in "$BASE_PATH/npm-forks/*/"; do
  (cd $d; npm install)
done
