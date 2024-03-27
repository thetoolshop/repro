#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")
PACKAGE_NAME=${1:-}

if [ "$PACKAGE_NAME" == "" ]; then
  echo "Usage: create-package.sh <name>"
  exit 1
fi

if [ -d "$BASE_PATH/packages/$PACKAGE_NAME" ]; then
  echo "Package already exists: $PACKAGE_NAME"
  exit 1
fi

cp -rn $BASE_PATH/scripts/package_template $BASE_PATH/packages/$PACKAGE_NAME
sed -i "s/%NAME%/$PACKAGE_NAME/" $BASE_PATH/packages/$PACKAGE_NAME/package.json

echo "Created package: $PACKAGE_NAME"
