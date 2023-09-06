#!/bin/bash

set -u

BASE_PATH=$(realpath "$(dirname $BASH_SOURCE[0])/..")
SESSIONNAME=repro

tmux has-session -t $SESSIONNAME &> /dev/null

if [ $? != 0 ]; then
  tmux new-session -s $SESSIONNAME -n workspace -c $BASE_PATH/apps/repro/workspace -d
  tmux split-window -c $BASE_PATH/apps/repro/workspace -h "npm run serve; bash -i"
  tmux select-pane -t 0

  tmux new-window -n capture -c $BASE_PATH/apps/repro/capture
  tmux split-window -c $BASE_PATH/apps/repro/capture -h "npm run watch; bash -i"
  tmux select-pane -t 0

  tmux new-window -n api-server -c $BASE_PATH/apps/repro/api-server
  tmux split-window -c $BASE_PATH/apps/repro/api-server -h "npm run watch; bash -i"
  tmux split-window -c $BASE_PATH/apps/repro/api-server -v "npm run dev-resources:start; bash -i"
  tmux select-pane -t 0

  tmux select-window -t workspace
fi

tmux attach -t $SESSIONNAME
