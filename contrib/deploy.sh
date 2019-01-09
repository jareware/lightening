#!/bin/bash

# First-time setup for a fresh Raspberry Pi:
# 1. sudo apt-get update && apt-get install -y curl vim git
# 1. sudo raspi-config # and set hostname to "lightening"
# 1. curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
# 1. sudo gpasswd -a pi docker
# 1. git clone https://github.com/jareware/lightening.git
# 1. vim .env # and add some secrets

SSH="ssh pi@lightening.local"
WC="lightening"
TAG="lightening"
CONTAINER="lightening"

(
  set -ex
  # Make sure we have a clean working copy
  if [[ "$(git diff-index HEAD)" != "" ]]; then echo "Please run again with a clean working copy"; exit 1; fi
  # Run basic QA steps
  npm run lint
  # Run the builds locally, because they're a LOT faster than on the Pi
  npm run client-build
  npm run server-build
  # Copy relevant files to the Pi
  $SSH "rm -rf $WC && mkdir $WC"
  scp -r pi.Dockerfile src package*.json "pi@lightening.local:$WC"
  # Clean up locally
  find src -name "*.js" | xargs rm
  # Build a new Docker image
  $SSH "cd $WC && docker build --file pi.Dockerfile --tag $TAG ."
  # Relaunch the Docker container
  $SSH "docker stop $CONTAINER"
  $SSH "docker rm $CONTAINER"
  $SSH "source .env && docker run --name $CONTAINER -d -p 80:8080 -p 8081:8081 --restart always --env LIGHTENING_TRADFRI_HOSTNAME --env LIGHTENING_TRADFRI_IDENTITY --env LIGHTENING_TRADFRI_PSK $TAG"
)

if [ "$?" = "0" ]; then
  echo
  echo "✅  Success"
  echo
fi
