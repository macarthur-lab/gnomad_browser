#!/bin/bash

# set -e

. "$(dirname "$0")"/../config/config.sh

# Takedown pod if already running
kubectl delete pod $TABIX_POD_NAME

# Set project
gcloud config set project $GCLOUD_PROJECT
gcloud container clusters get-credentials $LOADING_CLUSTER_NAME --zone=$GCLOUD_ZONE
kubectl config set-context $LOADING_CLUSTER
kubectl config set-cluster $LOADING_CLUSTER

echo "Project name is ${PROJECT_NAME}"
echo "Project environment is ${DEPLOYMENT_ENV}"
echo "Environment is ${PROJECT_ENVIRONMENT}"
echo "Images will be rebuilt: ${REBUILD_IMAGES}"
echo "Mongo disk set to: ${MONGO_DISK}"
echo "Readviz disk set to: ${READVIZ_DISK}"
echo "Mongo will be restarted: ${RESTART_MONGO}"
echo "Monitor loading cluster? ${MONITOR_LOADING}"

read -p "Are you sure you want to start tabix? y/n" input
if [[ $input = n ]]; then
  exit 0
fi

# Create the disk
# gcloud compute disks create --size=1000GB --zone=us-east1-d gnomad-tabix-temp

# "$(dirname "$0")"/start-load-cluster.sh

if [[ $REBUILD_IMAGES = "specific" ]]; then
  docker build -f deploy/dockerfiles/$TABIX_IMAGE_DOCKERFILE -t $TABIX_IMAGE_TAG .
  gcloud docker push $TABIX_IMAGE_TAG
fi

# start pod
kubectl create -f deploy/config/$TABIX_POD_CONFIG

# Delete
# gcloud compute disks delete gnomad-tabix-temp --zone=us-east1-d

# takedown cluster
# "$(dirname "$0")"/takedown-load.sh
