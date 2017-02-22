w#!/bin/bash

# halt on any error
# set -e

. "$(dirname "$0")"/../config/config.sh

# Set project
gcloud config set project $GCLOUD_PROJECT
kubectl config set-context $SERVING_CLUSTER

kubectl delete pod $LOADING_POD_NAME
kubectl delete pod $TABIX_POD_NAME
# kubectl delete service $MONGO_SERVICE_NAME
# kubectl delete rc $MONGO_REPLICATION_CONTROLLER

# Delete the cluster
gcloud container clusters delete $LOADING_CLUSTER_NAME --zone $GCLOUD_ZONE
