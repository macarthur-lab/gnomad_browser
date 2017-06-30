#!/bin/bash

# halt on any error
# set -e
python deploy/scripts/render.py
. "$(dirname "$0")"/../config/config.sh

gcloud config set project $GCLOUD_PROJECT
gcloud container clusters get-credentials $LOADING_CLUSTER_NAME --zone=$GCLOUD_ZONE
kubectl config set-context $LOADING_CLUSTER
kubectl config set-cluster $LOADING_CLUSTER

echo "Project name is ${PROJECT_NAME}"
echo "Project environment is ${DEPLOYMENT_ENV}"
echo "Environment is ${PROJECT_ENVIRONMENT}"
echo "Images will be rebuilt: ${REBUILD_IMAGES}"
echo "Mongo disk set to: ${MONGO_DISK}"
echo "Readviz disk set to: ${READVIZ_DISK}"
echo "Mongo will be restarted: ${RESTART_MONGO}"
echo "Monitor loading cluster? ${MONITOR_LOADING}"

read -p "Are you sure you want to load data? y/n" input
if [[ $input = n ]]; then
  exit 0
fi

kubectl delete pod $LOADING_POD_NAME

if [[ $RESTART_MONGO = "true" ]]; then
  # Stop mongo
  kubectl delete service $MONGO_SERVICE_NAME
  kubectl delete deployment $MONGO_REPLICATION_CONTROLLER
fi

if [[ $REBUILD_IMAGES = "all" ]]; then
  "$(dirname "$0")"/images-build.sh
  "$(dirname "$0")"/images-push.sh
elif [[ $REBUILD_IMAGES = "specific" ]]; then
  echo "Rebuilding loading image"
  docker build -f "deploy/dockerfiles/${LOADING_IMAGE_DOCKERFILE}" -t "${LOADING_IMAGE_TAG}" .
  gcloud docker -- push "${LOADING_IMAGE_TAG}"
elif [[ $REBUILD_IMAGES = "exac" ]]; then
  echo "Rebuilding loading image"
  docker build -f "${EXACV1_SRC_DIR}/deploy/dockerfiles/${LOADING_IMAGE_DOCKERFILE}" \
    -t "${LOADING_IMAGE_TAG}" "${EXACV1_SRC_DIR}"
  gcloud docker -- push "${LOADING_IMAGE_TAG}"
fi

if [[ $RESTART_MONGO = "true" ]]; then
  # Start mongo -- takes 20 seconds or so
  kubectl create -f deploy/config/$MONGO_SERVICE_CONFIG --validate=false
  kubectl create -f deploy/config/$MONGO_CONTROLLER_CONFIG --validate=false
  sleep 30
fi

kubectl create -f deploy/config/$LOADING_POD_CONFIG --validate=false
