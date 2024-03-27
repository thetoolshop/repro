#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")
SESSIONNAME=repro

tmux has-session -t $SESSIONNAME &> /dev/null

if [ $? != 0 ]; then
  tmux new-session -s $SESSIONNAME -n workspace -c $BASE_PATH/apps/workspace -d
  tmux split-window -c $BASE_PATH/apps/workspace -h "npm run serve; bash -i"
  tmux select-pane -t 0

  tmux new-window -n capture -c $BASE_PATH/apps/capture
  tmux split-window -c $BASE_PATH/apps/capture -h "npm run watch; bash -i"
  tmux select-pane -t 0

  tmux new-window -n api-server -c $BASE_PATH/apps/api-server
  tmux split-window -c $BASE_PATH/apps/api-server -h "npm run watch; bash -i"
  tmux select-pane -t 0

  tmux select-window -t workspace
fi

tmux attach -t $SESSIONNAME
