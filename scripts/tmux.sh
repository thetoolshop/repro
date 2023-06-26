#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")
SESSIONNAME=repro

tmux has-session -t $SESSIONNAME &> /dev/null

if [ $? != 0 ]; then
  tmux new-session -s $SESSIONNAME -n client -c $BASE_PATH/apps/client -d
  tmux split-window -c $BASE_PATH/apps/client -h "npm run watch:capture; bash -i"
  tmux split-window -c $BASE_PATH/apps/client -v "npm run serve:main; bash -i"
  tmux select-pane -t 0

  tmux new-window -n api-server -c $BASE_PATH/apps/api-server
  tmux split-window -c $BASE_PATH/apps/api-server -h "npm run watch; bash -i"
  tmux split-window -c $BASE_PATH/apps/api-server -v "npm run dev-resources:start; bash -i"
  tmux select-pane -t 0

  tmux select-window -t client
fi

tmux attach -t $SESSIONNAME
