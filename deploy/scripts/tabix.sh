#!/bin/bash

# set -e

. "$(dirname "$0")"/config.sh

# Takedown pod if already running
kubectl delete pod $TABIX_POD_NAME

# Set project
gcloud config set project $GCLOUD_PROJECT
kubectl config set-context $LOADING_CLUSTER

# Create the disk
# gcloud compute disks create --size=1000GB --zone=us-east1-d gnomad-tabix-temp

# "$(dirname "$0")"/start-load-cluster.sh

if [[ $REBUILD_IMAGE = "specific" ]]; then
  docker build -f deploy/dockerfiles/$TABIX_IMAGE_DOCKERFILE -t $TABIX_IMAGE_TAG .
  gcloud docker push $TABIX_IMAGE_TAG
fi

# start pod
kubectl create -f deploy/config/$TABIX_POD_CONFIG

# Delete
# gcloud compute disks delete gnomad-tabix-temp --zone=us-east1-d

# takedown cluster
# "$(dirname "$0")"/takedown-load.sh
