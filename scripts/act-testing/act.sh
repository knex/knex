#!/bin/bash -e

mkdir -p /tmp/artifacts

HERE="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

evtfile=""
if [ -f "$1" ]; then
  evtfile="$1"
elif [ -f "$HERE/$1.json" ]; then
  evtfile="$HERE/$1.json"
else
  echo "Usage: $0 <event jsonfile>"
  exit 1
fi

shift

act --artifact-server-path /tmp/artifacts -e "$evtfile" -W "$HERE/../../.github/workflows/publish.yml" "$@"
