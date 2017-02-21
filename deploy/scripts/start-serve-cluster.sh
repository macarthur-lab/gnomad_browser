#!/bin/bash

# halt on any error
set -e

. "$(dirname "$0")"/../config/config.sh

gcloud container clusters create $SERVING_CLUSTER_NAME \
--machine-type $SERVER_MACHINE_TYPE \
--zone $GCLOUD_ZONE \
--num-nodes $SERVING_NODES \
--project $GCLOUD_PROJECT