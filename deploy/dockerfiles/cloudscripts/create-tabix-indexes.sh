#!/bin/bash

if [[ ! $BUCKET_PATH ]]; then
  echo "Please define BUCKET_PATH"
fi

echo "Cleaning up" && \
rm -rf /var/data/tabixtemp/*

echo "Copying VCF files from ${BUCKET_PATH}"
gsutil -m cp $BUCKET_PATH/* /var/data/tabixtemp/

echo "Files copied:"
ls /var/data/tabixtemp

echo "Creating tabix index..."
`for i in /var/data/tabixtemp/*gz; do tabix -f -p vcf $i & done`;

echo "Done creating indexes for: "
ls /var/data/tabixtemp

echo "Copying files to storage bucket ${BUCKET_PATH}"
gsutil -m cp /var/data/tabixtemp/*tbi $BUCKET_PATH/

echo "Cleaning up" && \
rm -rf /var/data/tabixtemp/*

echo "Exiting"
