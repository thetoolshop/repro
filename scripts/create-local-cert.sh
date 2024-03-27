#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")

mkdir -p $BASE_PATH/certs

if [ -f "$BASE_PATH/certs/local.crt" ]; then
  echo "Local certificate already exists."
  exit 0
fi

echo "Generating CA root private key"

openssl genrsa \
  -out $BASE_PATH/certs/local-ca.key \
  2048

echo "Generating CA root certificate"

openssl req \
  -x509 \
  -new \
  -nodes \
  -key $BASE_PATH/certs/local-ca.key \
  -sha256 \
  -days 825 \
  -subj "/CN=localhost" \
  -out $BASE_PATH/certs/local-ca.pem

echo "Generating private key"

openssl genrsa \
  -out $BASE_PATH/certs/local.key \
  2048

echo "Generating certificate signing request"

openssl req \
  -new \
  -key $BASE_PATH/certs/local.key \
  -subj "/CN=localhost" \
  -out $BASE_PATH/certs/local.csr

echo "Generating certificate"

openssl x509 \
  -req \
  -in $BASE_PATH/certs/local.csr \
  -CA $BASE_PATH/certs/local-ca.pem \
  -CAkey $BASE_PATH/certs/local-ca.key \
  -CAcreateserial \
  -out $BASE_PATH/certs/local.crt \
  -days 825 \
  -sha256 \
  -extfile $BASE_PATH/scripts/local-cert-conf.ext

echo "Verifying certificate"

openssl verify \
  -CAfile $BASE_PATH/certs/local-ca.pem \
  -verify_hostname localhost \
  $BASE_PATH/certs/local.crt
