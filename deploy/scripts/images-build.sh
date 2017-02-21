#!/bin/bash

# halt on any error
set -e

# Build docker images
docker build -f deploy/dockerfiles/${BASE_IMAGE_DOCKERFILE} -t "${BASE_IMAGE_TAG}" .
docker build -f deploy/dockerfiles/${SERVER_IMAGE_DOCKERFILE} -t "${LOADING_IMAGE_TAG}" .
docker build -f deploy/dockerfiles/${LOADING_IMAGE_DOCKERFILE} -t "${SERVER_IMAGE_TAG}" .
