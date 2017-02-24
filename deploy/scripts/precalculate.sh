#!/bin/bash

. "$(dirname "$0")"/../config/config.sh

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

read -p "Are you sure you want to start precalculate metrics? y/n" input
if [[ $input = n ]]; then
  exit 0
fi

kubectl delete pod gnomad-precalculate-pod

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
