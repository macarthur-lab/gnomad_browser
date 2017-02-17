#!/bin/bash

# halt on any error
# set -e

. "$(dirname "$0")"/config.sh

# Set project
gcloud config set project $GCLOUD_PROJECT
kubectl config set-context $SERVING_CLUSTER

# Bring down previous replication controller
kubectl delete service $SERVER_REPLICATION_CONTROLLER_NAME
kubectl delete hpa $SERVER_REPLICATION_CONTROLLER_NAME
kubectl delete rc $SERVER_REPLICATION_CONTROLLER_NAME
kubectl delete service $MONGO_SERVICE_NAME
kubectl delete rc $MONGO_REPLICATION_CONTROLLER

# Delete the cluster
gcloud container clusters delete $SERVING_CLUSTER_NAME --zone $GCLOUD_ZONE
