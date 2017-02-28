#!/bin/bash

mongo exac --host gnomad-d-mongo:27017 --eval "db.genome_metrics.drop()"

mongoimport -j 4 \
--host gnomad-d-mongo:27017 \
--collection genome_metrics \
--db exac \
--file /data/metrics/genome_precalculated_metrics.json \
--jsonArray

mongo exac --host gnomad-d-mongo:27017 --eval "db.exome_metrics.drop()"

mongoimport -j 4 \
--host gnomad-d-mongo:27017 \
--collection exome_metrics \
--db exac \
--file /data/metrics/exome_precalculated_metrics.json \
--jsonArray

exit 0