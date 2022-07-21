#!/bin/bash

set -e

mkdir -p ~/test/frontend
mkdir -p ~/test/backend
mkdir -p ~/test/objectserver1
mkdir -p ~/test/objectserver2
mkdir -p ~/test/objectserver3
mkdir -p ~/test/objectserver4
mkdir -p ~/test/objectserver5
mkdir -p ~/test/objectserver6

OBJECTSERVER_KEY=12345 docker compose -f docker-compose.dev.yml up
