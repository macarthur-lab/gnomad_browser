#!/bin/bash

# halt on any error
set -e

# Set project
gcloud config set project exac-gnomad

# Create the disk, wait 5 minutes
gcloud compute disks create --size=3000GB --zone=us-east1-d gnomad-readviz

docker build -f deploy/dockerfiles/copygnomadreadviz.dockerfile -t gcr.io/exac-gnomad/copygnomadreadviz .
gcloud docker push gcr.io/exac-gnomad/copygnomadreadviz

sleep 300

# start pod
kubectl create -f deploy/config/copygnomadreadviz-pod.json

# takedown pod
kubectl delete pod exac-copygnomadreadviz

# Delete
gcloud compute disks delete gnomad-readviz --zone=us-east1-d

# takedown cluster
"$(dirname "$0")"/takedown-load.sh
