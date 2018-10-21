#!/bin/bash

SSH="ssh pi@lightening.local"
WC="lightening"
TAG="lightening"
CONTAINER="lightening"

(
  set -ex
  $SSH "cd $WC && git pull"
  $SSH "cd $WC && docker build -t $TAG ."
  $SSH "docker stop $CONTAINER"
  $SSH "docker rm $CONTAINER"
  $SSH "source $WC/.env && docker run --name $CONTAINER -d -p 80:8080 -p 8081:8081 --env LIGHTENING_TRADFRI_HOSTNAME --env LIGHTENING_TRADFRI_IDENTITY --env LIGHTENING_TRADFRI_PSK $TAG"
)

echo
echo "✅  Success"
echo
