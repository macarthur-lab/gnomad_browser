#!/bin/bash

# halt on any error
set -e

kubectl delete pod gnomad-tabix-pod
# Set project
gcloud config set project exac-gnomad

# Create the disk, wait 5 minutes
# gcloud compute disks create --size=1000GB --zone=us-east1-d gnomad-tabix-temp

# "$(dirname "$0")"/start-load-cluster.sh
# docker build -f deploy/dockerfiles/gnomadbase.dockerfile -t gcr.io/exac-gnomad/gnomadbase .
docker build -f deploy/dockerfiles/gnomadtabix.dockerfile -t gcr.io/exac-gnomad/gnomadtabix .
# gcloud docker push gcr.io/exac-gnomad/gnomadbase
gcloud docker push gcr.io/exac-gnomad/gnomadtabix

# sleep 60

# start pod
kubectl config set-context gke_exac-gnomad_us-east1-d_gnomad-loading-cluster
kubectl create -f deploy/config/gnomad-tabix-pod.json

# takedown pod
# kubectl delete pod gnomad-tabix-pod

# Delete
# gcloud compute disks delete gnomad-tabix-temp --zone=us-east1-d

# takedown cluster
# "$(dirname "$0")"/takedoamwn-load.sh
