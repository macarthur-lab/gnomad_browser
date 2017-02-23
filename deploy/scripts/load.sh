#!/bin/bash

# halt on any error
# set -e

. "$(dirname "$0")"/../config/config.sh

gcloud config set project $GCLOUD_PROJECT
kubectl config set-context $LOADING_CLUSTER

read -p "Are you sure you want to load the data? y/n" input

if [[ $input = y ]]; then
  continue
else
  exit 0
fi

kubectl delete pod $LOADING_POD_NAME

if [[ $RESTART_MONGO = "true" ]]; then
  # Stop mongo
  kubectl delete service $MONGO_SERVICE_NAME
  kubectl delete rc $MONGO_REPLICATION_CONTROLLER
fi

if [[ $REBUILD_IMAGES = "all" ]]; then
  "$(dirname "$0")"/images-build.sh
  "$(dirname "$0")"/images-push.sh
fi

if [[ $REBUILD_IMAGES = "specific" ]]; then
  docker build -f "deploy/dockerfiles/${LOADING_IMAGE_DOCKERFILE}" -t "${LOADING_IMAGE_TAG}" .
  gcloud docker push "${LOADING_IMAGE_TAG}"
fi

if [[ $RESTART_MONGO = "true" ]]; then
  # Start mongo -- takes 20 seconds or so
  kubectl create -f deploy/config/$MONGO_SERVICE_CONFIG --validate=false
  kubectl create -f deploy/config/$MONGO_CONTROLLER_CONFIG --validate=false
  sleep 30
fi

kubectl create -f deploy/config/$LOADING_POD_CONFIG --validate=false