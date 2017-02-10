#!/bin/bash

"$(dirname "$0")"/takedown-load.sh
# "$(dirname "$0")"/images-build.sh
docker build -f deploy/dockerfiles/gnomadload.dockerfile -t gcr.io/exac-gnomad/gnomadload .
# "$(dirname "$0")"/images-push.sh
gcloud docker push gcr.io/exac-gnomad/gnomadload
"$(dirname "$0")"/load.sh
