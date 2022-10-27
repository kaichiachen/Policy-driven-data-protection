#!/bin/bash

set -e

mkdir -p ./test/frontend
mkdir -p ./test/backend
mkdir -p ./test/objectserver1
mkdir -p ./test/objectserver2
mkdir -p ./test/objectserver3
mkdir -p ./test/objectserver4
mkdir -p ./test/objectserver5
mkdir -p ./test/objectserver6

touch ./test/objectserver1/flag
touch ./test/objectserver2/flag
touch ./test/objectserver3/flag
touch ./test/objectserver4/flag
touch ./test/objectserver5/flag
touch ./test/objectserver6/flag

OBJECTSERVER_KEY=12345 docker compose -f docker-compose.dev.yml up
