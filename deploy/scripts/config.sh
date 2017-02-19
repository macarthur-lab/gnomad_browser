#!/bin/bash

# gcloud resource config
export GCLOUD_PROJECT=exac-gnomad
export GCLOUD_ZONE=us-east1-d
export LOADING_CLUSTER_NAME=gnomad-loading-cluster
export LOADING_CLUSTER=gke_exac-gnomad_us-east1-d_gnomad-loading-cluster
export SERVING_CLUSTER_NAME=gnomad-serving-cluster
export SERVING_CLUSTER=gke_exac-gnomad_us-east1-d_gnomad-serving-cluster

# Options:
export REBUILD_IMAGES=specific # Which images to rebuild: none, all, specific?
export RESTART_MONGO=true # Restart mongo on every script launch?
export MONITOR_LOADING=true # Start server on the loading cluster rather than serving cluster.

# Mongo config
export MONGO_CONTROLLER_CONFIG=mongo-controller.yaml
export MONGO_SERVICE_CONFIG=mongo-service.yaml
export MONGO_SERVICE_NAME=gnomad-mongo
export MONGO_REPLICATION_CONTROLLER=gnomad-mongo-controller

# Loading config
export LOADING_IMAGE_PREFIX="gcr.io/exac-gnomad/gnomadload"
export LOADING_IMAGE_RELEASE=
export LOADING_IMAGE_TAG=$LOADING_IMAGE_PREFIX
export LOADING_IMAGE_DOCKERFILE="gnomadload.dockerfile"
export LOADING_POD_NAME=gnomad-load
export LOADING_POD_CONFIG=gnomad-load-pod.json

# Server config
export SERVER_IMAGE_PREFIX="gcr.io/exac-gnomad/gnomadserve"
export SERVER_IMAGE_RELEASE=
export SERVER_IMAGE_TAG="${SERVER_IMAGE_PREFIX}"
export SERVER_IMAGE_DOCKERFILE="gnomadserve.dockerfile"
export SERVER_REPLICATION_CONTROLLER_NAME=gnomad-serve
export SERVER_REPLICATION_CONTROLLER_CONFIG=gnomad-serve-rc-with-readviz.json

if [[ $MONITOR_LOADING = "true" ]]; then
  export SERVING_CLUSTER=$LOADING_CLUSTER
fi

# Tabix config
export TABIX_IMAGE_PREFIX="gcr.io/exac-gnomad/gnomadtabix"
export TABIX_IMAGE_RELEASE=
export TABIX_IMAGE_TAG=$TABIX_IMAGE_PREFIX
export TABIX_IMAGE_DOCKERFILE="gnomadtabix.dockerfile"
export TABIX_POD_NAME=gnomad-tabix-pod
export TABIX_POD_CONFIG=gnomad-tabix-pod.json
