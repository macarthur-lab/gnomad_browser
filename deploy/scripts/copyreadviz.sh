#!/bin/bash

# halt on any error
set -e

# kubectl delete pod gnomad-copyreadviz
# Set project
gcloud config set project exac-gnomad

# Create the disk, wait 5 minutes
gcloud compute disks create --size=350GB --zone=us-east1-d gnomad-readviz-exons

"$(dirname "$0")"/start-load-cluster.sh

# docker build -f deploy/dockerfiles/copygnomadreadviz.dockerfile -t gcr.io/exac-gnomad/copygnomadreadviz .
# gcloud docker push gcr.io/exac-gnomad/copygnomadreadviz

sleep 300

# start pod
kubectl config set-context gke_exac-gnomad_us-east1-d_gnomad-loading-cluster
kubectl create -f deploy/config/copygnomadreadviz-pod.json

# takedown pod
# kubectl delete pod gnomad-copyreadviz

# Delete
# gcloud compute disks delete gnomad-readviz-exons --zone=us-east1-d

# takedown cluster
# "$(dirname "$0")"/takedoamwn-load.sh
