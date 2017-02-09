#!/bin/bash

# halt on any error
set -e

# Set project
gcloud config set project exac-gnomad

# Push docker images
gcloud docker push gcr.io/exac-gnomad/gnomadbase
gcloud docker push gcr.io/exac-gnomad/gnomadload
gcloud docker push gcr.io/exac-gnomad/gnomadserve
gcloud docker push gcr.io/exac-gnomad/gnomadprecalculate
