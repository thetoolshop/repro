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

host=$(curl --silent \
  "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/endpoints" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${NEON_API_KEY}" \
  | jq -r .endpoints \
  | jq -c '.[] | select(.branch_id == "'${branch_id}'")' \
  | jq -r .host \
)

echo "host=${host}" >> $GITHUB_OUTPUT
