#!/bin/sh
docker run --rm -p 8090:8090 -v "$(pwd)/sample.yaml:/usr/app/values.yaml" ev-simulator:local