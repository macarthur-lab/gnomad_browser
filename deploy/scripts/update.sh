#!/bin/bash

# halt on any error
# set -e

. "$(dirname "$0")"/../config/config.sh

gcloud config set project $GCLOUD_PROJECT
gcloud container clusters get-credentials $SERVING_CLUSTER_NAME --zone=$GCLOUD_ZONE
kubectl config set-context $SERVING_CLUSTER
kubectl config set-cluster $SERVING_CLUSTER

echo "Project name is ${PROJECT_NAME}"
echo "Project environment is ${DEPLOYMENT_ENV}"
echo "Environment is ${PROJECT_ENVIRONMENT}"
echo "Images will be rebuilt: ${REBUILD_IMAGES}"
echo "Mongo disk set to: ${MONGO_DISK}"
echo "Readviz disk set to: ${READVIZ_DISK}"
echo "Mongo will be restarted: ${RESTART_MONGO}"
echo "Monitor loading cluster? ${MONITOR_LOADING}"

read -p "Are you sure you want to update ${DEPLOYMENT_ENV} server deployment? (y/n) " input
if [[ $input = "n" ]]; then
  exit 0
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

# Start the server and expose to the internet w/ autoscaling & load balancing
kubectl apply -f deploy/config/$SERVER_REPLICATION_CONTROLLER_CONFIG
