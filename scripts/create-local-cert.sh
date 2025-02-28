#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")
CERTS_DIR=$BASE_PATH/infra/certs

mkdir -p $CERTS_DIR

if [ -f "$CERTS_DIR/local.crt" ]; then
  echo "Local certificate already exists."
  exit 0
fi

echo "Generating CA root private key"

openssl genrsa \
  -out $CERTS_DIR/local-ca.key \
  2048

echo "Generating CA root certificate"

openssl req \
  -x509 \
  -new \
  -nodes \
  -key $CERTS_DIR/local-ca.key \
  -sha256 \
  -days 825 \
  -subj "/CN=localhost" \
  -out $CERTS_DIR/local-ca.pem

echo "Generating private key"

openssl genrsa \
  -out $CERTS_DIR/local.key \
  2048

echo "Generating certificate signing request"

openssl req \
  -new \
  -key $CERTS_DIR/local.key \
  -subj "/CN=*.repro.localhost" \
  -out $CERTS_DIR/local.csr

echo "Generating certificate"

openssl x509 \
  -req \
  -in $CERTS_DIR/local.csr \
  -CA $CERTS_DIR/local-ca.pem \
  -CAkey $CERTS_DIR/local-ca.key \
  -CAcreateserial \
  -out $CERTS_DIR/local.crt \
  -days 825 \
  -sha256 \
  -extfile $BASE_PATH/infra/local-cert-conf.ext

echo "Verifying certificate"

openssl verify \
  -CAfile $CERTS_DIR/local-ca.pem \
  -verify_hostname verify.repro.localhost \
  $CERTS_DIR/local.crt
