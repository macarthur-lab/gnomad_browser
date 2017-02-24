#!/bin/bash

# halt on any error
set -e

. "$(dirname "$0")"/../config/config.sh

# Set project
gcloud config set project $GCLOUD_PROJECT
gcloud container clusters get-credentials $LOADING_CLUSTER_NAME --zone=$GCLOUD_ZONE
kubectl config set-context $LOADING_CLUSTER
kubectl config set-cluster $LOADING_CLUSTER

# Create the disk, wait 5 minutes
# gcloud compute disks create --size=1000GB --zone=us-east1-d gnomad-readviz-exons-gpd

# "$(dirname "$0")"/start-load-cluster.sh

echo "Environment is ${DEPLOYMENT_ENV}"

read -p "Are you sure you want to start copy readviz? y/n" input
if [[ $input = n ]]; then
  exit 0
fi

# kubectl delete pod gnomad-copyreadviz

docker build -f deploy/dockerfiles/gnomadcopyreadviz.dockerfile -t gcr.io/exac-gnomad/gnomadcopyreadviz .
gcloud docker push gcr.io/exac-gnomad/gnomadcopyreadviz

# sleep 60

# start pod
kubectl config set-context gke_exac-gnomad_us-east1-d_gnomad-loading-cluster
kubectl create -f deploy/config/gnomad-copy-readviz-pod.yaml

# takedown pod
# kubectl delete pod gnomad-copyreadviz

# Delete
# gcloud compute disks delete gnomad-readviz-exons --zone=us-east1-d

# takedown cluster
# "$(dirname "$0")"/takedoamwn-load.sh
