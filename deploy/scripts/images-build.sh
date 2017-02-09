#!/bin/bash

# halt on any error
set -e

# Build docker images
docker build -f deploy/dockerfiles/gnomadbase.dockerfile -t gcr.io/exac-gnomad/gnomadbase .
docker build -f deploy/dockerfiles/gnomadserve.dockerfile -t gcr.io/exac-gnomad/gnomadserve .
docker build -f deploy/dockerfiles/gnomadload.dockerfile -t gcr.io/exac-gnomad/gnomadload .
docker build -f deploy/dockerfiles/gnomadprecalculate.dockerfile -t gcr.io/exac-gnomad/gnomadprecalculate .
