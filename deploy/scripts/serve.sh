#!/bin/bash

# halt on any error
# set -e

. "$(dirname "$0")"/../config/config.sh

gcloud config set project $GCLOUD_PROJECT
gcloud container clusters get-credentials $SERVING_CLUSTER_NAME --zone=$GCLOUD_ZONE
kubectl config set-context $SERVING_CLUSTER
kubectl config set-cluster $SERVING_CLUSTER

echo "Project name is ${PROJECT_NAME}"
echo "Project environment is ${DEPLOYMENT_ENV}"
echo "Environment is ${PROJECT_ENVIRONMENT}"
echo "Images will be rebuilt: ${REBUILD_IMAGES}"
echo "Mongo disk set to: ${MONGO_DISK}"
echo "Readviz disk set to: ${READVIZ_DISK}"
echo "Mongo will be restarted: ${RESTART_MONGO}"
echo "Monitor loading cluster? ${MONITOR_LOADING}"

read -p "Are you sure you want to restart the ${DEPLOYMENT_ENV} server? (y/n) " input
if [[ $input = "n" ]]; then
  exit 0
fi

# read -p "Would you like to start/restart mongo? (y/n) " mongo_restart
# if [[ $mongo_restart = "n" ]]; then
#   exit 0
# fi

if [[ $REBUILD_IMAGES = "all" ]]; then
  "$(dirname "$0")"/images-build.sh
  "$(dirname "$0")"/images-push.sh
fi

if [[ $REBUILD_IMAGES = "specific" ]]; then
  echo "Rebuilding server image"
  docker build -f "deploy/dockerfiles/${SERVER_IMAGE_DOCKERFILE}" -t "${SERVER_IMAGE_TAG}" .
  gcloud docker push "${SERVER_IMAGE_TAG}"
fi

kubectl delete service $SERVER_REPLICATION_CONTROLLER_NAME
kubectl delete hpa $SERVER_REPLICATION_CONTROLLER_NAME
kubectl delete rc $SERVER_REPLICATION_CONTROLLER_NAME

if [[ $RESTART_MONGO = "true" ]]; then
  # Stop mongo
  kubectl delete service $MONGO_SERVICE_NAME
  kubectl delete rc $MONGO_REPLICATION_CONTROLLER
fi

if [[ $RESTART_MONGO = "true" ]]; then
  # Start mongo -- takes 20 seconds or so
  kubectl create -f deploy/config/$MONGO_SERVICE_CONFIG
  kubectl create -f deploy/config/$MONGO_CONTROLLER_CONFIG
  sleep 30
fi

# Start the server and expose to the internet w/ autoscaling & load balancing
kubectl create -f deploy/config/$SERVER_REPLICATION_CONTROLLER_CONFIG

kubectl expose rc $SERVER_REPLICATION_CONTROLLER_NAME \
--type="LoadBalancer" \
--load-balancer-ip="${EXTERNAL_IP}"

# kubectl create -f deploy/config/$SERVER_INGRESS_CONFIG

kubectl autoscale rc $SERVER_REPLICATION_CONTROLLER_NAME \
--min=$SERVING_AUTOSCALE_MINIMUM \
--max=$SERVING_AUTOSCALE_MAXIMUM \
--cpu-percent=$SERVING_AUTOSCALE_MAXIMUM_CPU

