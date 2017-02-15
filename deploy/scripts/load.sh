#!/bin/bash

# halt on any error
# set -e

"$(dirname "$0")"/start-load-cluster.sh

# Set project
gcloud config set project exac-gnomad
kubectl config set-context gke_exac-gnomad_us-east1-d_gnomad-loading-cluster

# Create the replication controller
kubectl create -f deploy/config/mongo-service.yaml
kubectl create -f deploy/config/mongo-controller.yaml

# Wait for mongo to initialize
sleep 30

# load data
kubectl create -f deploy/config/gnomad-load-pod.json

# copy readviz files
# kubectl create -f deploy/config/copygnomadreadviz-pod.json
