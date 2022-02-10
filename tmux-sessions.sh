#!/bin/bash

set -u

SESSIONNAME=repro

tmux has-session -t $SESSIONNAME &> /dev/null

if [ $? != 0 ]; then
  tmux new-session -s $SESSIONNAME -n client -c packages/client -d
  tmux split-window -c packages/client -h "npm run watch:chrome-extension"
  tmux split-window -c packages/client -v "npm run serve:standalone-devtools"
  tmux select-pane -t 0

  tmux new-window -n public-backend -c packages/public-backend
  tmux split-window -c packages/public-backend -h "npm run watch"
  tmux select-pane -t 0

  tmux select-window -t client
fi

tmux attach -t $SESSIONNAME
