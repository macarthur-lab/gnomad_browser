#!/bin/bash

if [[ ! $BUCKET_PATH ]]; then
  echo "Please define BUCKET_PATH"
fi

echo "Cleaning up" && \
# rm -rf /var/data/tabixtemp/*

echo "Copying VCF files from ${BUCKET_PATH}"
gsutil -m cp $BUCKET_PATH/* /var/data/tabixtemp/

sleep 88888888888888888888

gsutil -m cp gs://gnomad-browser/exomes/sept-2017-release-202/* /var/data/tabixtemp/