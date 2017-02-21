#!/bin/bash

# halt on any error
set -e

. "$(dirname "$0")"/../config/config.sh

gcloud container clusters create $LOADING_CLUSTER_NAME \
--machine-type $LOADING_MACHINE_TYPE \
--zone $GCLOUD_ZONE \
--num-nodes 1 \
--project $GCLOUD_PROJECT
