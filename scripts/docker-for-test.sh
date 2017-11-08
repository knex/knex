#!/usr/bin/env bash

if [ -n "$(docker info)" ]; then
    DOCKER_IMAGES=("mysql:5.7" "postgres:9.6")
    for image in ${DOCKER_IMAGES[@]}; do
        if [ -z "$(docker images -q ${image})" ]; then
            echo "Installing Docker image ${image}"
            docker pull ${image}
        else
            echo "Docker image ${image} found!"
        fi
    done
fi

