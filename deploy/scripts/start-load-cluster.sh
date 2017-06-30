#!/bin/bash

# halt on any error
set -e

python deploy/scripts/render.py
. "$(dirname "$0")"/../config/config.sh

gcloud container clusters create $LOADING_CLUSTER_NAME \
--machine-type $LOADING_MACHINE_TYPE \
--zone $GCLOUD_ZONE \
--num-nodes 1 \
--project $GCLOUD_PROJECT

# gcloud container clusters create gnomad-loading-cluster \
# --machine-type n1-highmem-32 \
# --zone us-east1-d \
# --num-nodes 1 \
# --project exac-gnomad
