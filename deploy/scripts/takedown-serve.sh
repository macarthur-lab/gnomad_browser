#!/bin/bash

# halt on any error
set -e

# Set project
gcloud config set project gnomad-gnomad

# Bring down previous replication controller
kubectl delete service gnomad-serve
kubectl delete hpa gnomad-serve
kubectl delete service gnomad-mongo
kubectl delete rc gnomad-mongo-controller
kubectl delete rc gnomad-serve

# Delete the cluster
# gcloud container clusters delete exac-serving-cluster --zone us-east1-d
