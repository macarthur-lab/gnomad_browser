#!/bin/bash

# Update configuration
python deploy/scripts/render.py

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
echo "Image tag: ${SERVER_IMAGE_TAG}"
echo "Monitor loading cluster? ${MONITOR_LOADING}"

read -p "Are you sure you want copyreadviz on ${DEPLOYMENT_ENV} server? (y/n) " input
if [[ $input = "n" ]]; then
  exit 0
fi

# Create the disk, wait 5 minutes
# gcloud compute disks create --size=1000GB --zone=us-east1-d gnomad-readviz-exons-gpd

kubectl delete pod gnomad-d-copyreadviz

docker build -f deploy/dockerfiles/gnomadcopyreadviz.dockerfile -t gcr.io/exac-gnomad/gnomadcopyreadviz .
gcloud docker push gcr.io/exac-gnomad/gnomadcopyreadviz

kubectl create -f deploy/config/gnomad-d-copy-readviz-pod.yaml
