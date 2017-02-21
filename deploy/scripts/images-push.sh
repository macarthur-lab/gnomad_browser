#!/bin/bash

# halt on any error
set -e

. "$(dirname "$0")"/../config/config.sh

# Set project
gcloud config set project ${GCLOUD_PROJECT}

# Push docker images
gcloud docker push "${BASE_IMAGE_TAG}"
gcloud docker push "${LOADING_IMAGE_TAG}"
gcloud docker push "${SERVER_IMAGE_TAG}"
