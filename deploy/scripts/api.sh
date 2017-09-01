#!/bin/bash

# halt on any error
# set -e

# Update configuration
python deploy/scripts/render.py
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
echo "Mongo will be restarted: ${RESTART_MONGO}"
echo "Monitor loading cluster? ${MONITOR_LOADING}"
echo "Image tag: ${GRAPHQL_IMAGE_TAG}"
echo "Service will: ${UPDATE_OR_RESTART}"

if [[ $DEPLOYMENT_ENV = 'production' ]]; then
  read -p "Are you sure you want to start grapqhql on ${DEPLOYMENT_ENV} server? (y/n) " input
  if [[ $input = "n" ]]; then
    exit 0
  fi
fi

if [[ $REBUILD_IMAGES = "specific" ]]; then
  echo "Rebuilding server image"
  docker build -f "${GRAPHQL_SRC_DIR}/deploy/dockerfiles/${GRAPHQL_IMAGE_DOCKERFILE}" \
    -t "${GRAPHQL_IMAGE_TAG}" "${GRAPHQL_SRC_DIR}"
  gcloud docker -- push "${GRAPHQL_IMAGE_TAG}"
fi

if [[ $REBUILD_IMAGES = "base" ]]; then
  echo "Rebuilding graphql image"
  docker build -f "${GRAPHQL_SRC_DIR}/deploy/dockerfiles/${GRAPHQLBASE_IMAGE_DOCKERFILE}" \
    -t "${GRAPHQL_IMAGE_PREFIX}base" "${GRAPHQL_SRC_DIR}"
  docker build -f "${GRAPHQL_SRC_DIR}/deploy/dockerfiles/${GRAPHQL_IMAGE_DOCKERFILE}" \
    -t "${GRAPHQL_IMAGE_TAG}" "${GRAPHQL_SRC_DIR}"
  gcloud docker -- push "${GRAPHQL_IMAGE_PREFIX}base"
  gcloud docker -- push "${GRAPHQL_IMAGE_TAG}"
fi

if [[ $RESTART_MONGO = "true" ]]; then
  # Stop mongo
  kubectl delete service $MONGO_SERVICE_NAME
  kubectl delete deployment $MONGO_REPLICATION_CONTROLLER
  # Start mongo -- takes 20 seconds or so
  kubectl create -f deploy/config/$MONGO_SERVICE_CONFIG
  kubectl create -f deploy/config/$MONGO_CONTROLLER_CONFIG
  sleep 30
fi

if [[ $UPDATE_OR_RESTART = "restart" ]]; then
  kubectl delete service $GRAPHQL_DEPLOYMENT_NAME
  kubectl delete deployment $GRAPHQL_DEPLOYMENT_NAME
  kubectl create -f deploy/config/$GRAPHQL_DEPLOYMENT_CONFIG
  kubectl expose deployment $GRAPHQL_DEPLOYMENT_NAME \
  --type="LoadBalancer" \
  --load-balancer-ip="${API_EXTERNAL_IP}"
elif [[ $UPDATE_OR_RESTART = "update" ]]; then
  kubectl apply -f deploy/config/$GRAPHQL_DEPLOYMENT_CONFIG
fi
