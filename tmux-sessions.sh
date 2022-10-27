#!/bin/bash

set -u

SESSIONNAME=repro

tmux has-session -t $SESSIONNAME &> /dev/null

if [ $? != 0 ]; then
  tmux new-session -s $SESSIONNAME -n client -c apps/client -d
  tmux split-window -c apps/client -h "npm run watch:capture; bash -i"
  tmux split-window -c apps/client -v "npm run serve:report; bash -i"
  tmux select-pane -t 0

  tmux new-window -n api-client -c packages/api-client
  tmux split-window -c packages/api-client -h "npm run watch; bash -i"
  tmux select-pane -t 0

  tmux new-window -n api-server -c apps/api-server
  tmux split-window -c apps/api-server -h "npm run watch; bash -i"
  tmux select-pane -t 0

  tmux select-window -t client
fi

tmux attach -t $SESSIONNAME
