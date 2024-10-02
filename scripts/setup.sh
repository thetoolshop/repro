#!/bin/bash

set -u

# Install mailpit (mock SMTP server)
sudo bash < <(curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh)
