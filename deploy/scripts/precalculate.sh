#!/bin/bash

# halt on any error
# set -e

# Set project
gcloud config set project {{ GCLOUD_PROJECT }}

kubectl delete pod {{ PROJECT_NAME }}-precalculate-pod

docker build -f deploy/dockerfiles/gnomadprecalculate.dockerfile -t gcr.io/exac-gnomad/gnomadprecalculate .
gcloud docker push gcr.io/exac-gnomad/gnomadprecalculate

if [[ $REBUILD_IMAGES = "all" ]]; then
  "$(dirname "$0")"/images-build.sh
  "$(dirname "$0")"/images-push.sh
fi

# Create the replication controller
# kubectl create -f deploy/config/mongo-service.yaml
# kubectl create -f deploy/config/mongo-controller.yaml

# Wait for mongo to initialize
# sleep 120

# load data
kubectl create -f deploy/config/gnomad-precalculate-pod.yaml
