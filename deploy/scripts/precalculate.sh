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

if [[ $RESTART_MONGO = "true" ]]; then
  # Stop mongo
  kubectl delete service $MONGO_SERVICE_NAME
  kubectl delete deployment $MONGO_REPLICATION_CONTROLLER
  kubectl create -f deploy/config/$MONGO_SERVICE_CONFIG
  kubectl create -f deploy/config/$MONGO_CONTROLLER_CONFIG
  sleep 30
fi

kubectl delete pod gnomad-d-precalculate

if [[ $REBUILD_IMAGES = "specific" ]]; then
  echo "Rebuilding precalculate image"
  docker build -f deploy/dockerfiles/gnomadprecalculate.dockerfile -t gcr.io/exac-gnomad/gnomadprecalculate .
  gcloud docker push gcr.io/exac-gnomad/gnomadprecalculate
fi

kubectl create -f deploy/config/gnomad-d-precalculate-pod.yaml
