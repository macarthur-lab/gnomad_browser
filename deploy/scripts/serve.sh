#!/bin/bash

# halt on any error
# set -e

. "$(dirname "$0")"/config.sh

gcloud config set project $GCLOUD_PROJECT
kubectl config set-context $SERVING_CLUSTER

kubectl delete service $SERVER_REPLICATION_CONTROLLER_NAME
kubectl delete hpa $SERVER_REPLICATION_CONTROLLER_NAME
kubectl delete rc $SERVER_REPLICATION_CONTROLLER_NAME

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
  echo "Rebuilding server image"
  docker build -f "deploy/dockerfiles/${SERVER_IMAGE_DOCKERFILE}" -t "${SERVER_IMAGE_TAG}" .
  gcloud docker push "${SERVER_IMAGE_TAG}"
fi

if [[ $RESTART_MONGO = "true" ]]; then
  # Start mongo -- takes 20 seconds or so
  kubectl create -f deploy/config/$MONGO_SERVICE_CONFIG
  kubectl create -f deploy/config/$MONGO_CONTROLLER_CONFIG
  sleep 30
fi

# Start the server and expose to the internet w/ autoscaling & load balancing
kubectl create -f deploy/config/$SERVER_REPLICATION_CONTROLLER_CONFIG
kubectl expose rc $SERVER_REPLICATION_CONTROLLER_NAME --type="LoadBalancer" --load-balancer-ip="${LOAD_BALANCER_IP}"

kubectl autoscale rc $SERVER_REPLICATION_CONTROLLER_NAME --min=1 --max=1 --cpu-percent=80
