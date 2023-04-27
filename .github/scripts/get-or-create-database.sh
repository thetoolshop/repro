#!/bin/bash

set -euo pipefail

# Find the branch id for the branch name
branch_id=$(curl --silent \
  "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${NEON_API_KEY}" \
  | jq -r .branches \
  | jq -c '.[] | select(.name == "'${BRANCH_NAME}'")' \
  | jq -r .id \
)

if [[ "$branch_id" == "" ]]; then
  # Create a new branch if it doesn't exist
  branch_id=$(curl --silent \
    "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches" \
    -X POST \
    --header "Accept: application/json" \
    --header "Content-Type: application/json" \
    --header "Authorization: Bearer ${NEON_API_KEY}" \
    --data "{\"branch\":{\"name\":\"${BRANCH_NAME}\"},\"endpoints\":[{\"type\":\"read_write\"}]}" \
    | jq -r .branch \
    | jq -r .id \
  )
fi

# Find the endpoint host for the branch
host=$(curl --silent \
  "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/endpoints" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${NEON_API_KEY}" \
  | jq -r .endpoints \
  | jq -c '.[] | select(.branch_id == "'${branch_id}'")' \
  | jq -r .host \
)

if [[ "$host" == "" ]]; then
  # Create a new endpoint if it doesn't exist
  host=$(curl --silent \
    "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/endpoints" \
    -X POST \
    --header "Accept: application/json" \
    --header "Content-Type: application/json" \
    --header "Authorization: Bearer ${NEON_API_KEY}" \
    --data "{\"branch_id\":\"${branch_id}\",\"type\":\"read_write\"}" \
    | jq -r .endpoints \
    | jq -c '.[] | select(.branch_id == "'${branch_id}'")' \
    | jq -r .host \
  )
fi

echo -n $host
