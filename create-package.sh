#!/bin/bash

set -u

PACKAGE_NAME=${1:-}

if [ "$PACKAGE_NAME" == "" ]; then
  echo "Usage: create-package.sh <name>"
  exit 1
fi

if [ -d "packages/$PACKAGE_NAME" ]; then
  echo "Package already exists: $PACKAGE_NAME"
fi

cp -rn package_template packages/$PACKAGE_NAME
sed -i "s/%NAME%/$PACKAGE_NAME/" packages/$PACKAGE_NAME/package.json

echo "Created package: $PACKAGE_NAME"
