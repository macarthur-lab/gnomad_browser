#!/bin/bash

# halt on any error
# set -e

# Takedown pod if already running
kubectl delete pod gnomad-tabix-pod

# Set project
gcloud config set project exac-gnomad
kubectl config set-context gke_exac-gnomad_us-east1-d_gnomad-loading-cluster

# Create the disk, wait 5 minutes
# gcloud compute disks create --size=1000GB --zone=us-east1-d gnomad-tabix-temp

# "$(dirname "$0")"/start-load-cluster.sh

if [[ $1 = "rebuild" ]]; then
  docker build -f deploy/dockerfiles/gnomadtabix.dockerfile -t gcr.io/exac-gnomad/gnomadtabix .

  gcloud docker push gcr.io/exac-gnomad/gnomadtabix
fi


# sleep 60

# start pod
kubectl create -f deploy/config/gnomad-tabix-pod.json

# takedown pod
# kubectl delete pod gnomad-tabix-pod

# Delete
# gcloud compute disks delete gnomad-tabix-temp --zone=us-east1-d

# takedown cluster
# "$(dirname "$0")"/takedown-load.sh
