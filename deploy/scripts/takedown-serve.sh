#!/bin/bash

# halt on any error
# set -e

# Set project
gcloud config set project exac-gnomad
kubectl config set-context gke_exac-gnomad_us-east1-d_gnomad-serving-cluster

# Bring down previous replication controller
kubectl delete service gnomad-serve
kubectl delete hpa gnomad-serve
kubectl delete service gnomad-mongo
kubectl delete rc gnomad-mongo-controller
kubectl delete rc gnomad-serve

# Delete the cluster
# gcloud container clusters delete gnomad-serving-cluster --zone us-east1-d
