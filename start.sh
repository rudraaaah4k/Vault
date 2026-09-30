#!/bin/sh
set -e

echo "Starting etcd..."
mkdir -p /data/etcd /data/n1 /data/n2 /data/n3 /data/gateway
etcd --name=meta1 \
  --listen-client-urls=http://127.0.0.1:2379 \
  --advertise-client-urls=http://127.0.0.1:2379 \
  --initial-cluster=meta1=http://127.0.0.1:2380 \
  --initial-advertise-peer-urls=http://127.0.0.1:2380 \
  --listen-peer-urls=http://127.0.0.1:2380 \
  --data-dir=/data/etcd &

# Wait for etcd
sleep 3

echo "Starting storage nodes..."
export NODE_TOKEN="monolith-token"
export ADMIN_TOKEN="monolith-admin"
export HOST=0.0.0.0

DATA_DIR=/data/n1 PORT=7401 NODE_ID=n1 node services/storage.mjs &
DATA_DIR=/data/n2 PORT=7402 NODE_ID=n2 node services/storage.mjs &
DATA_DIR=/data/n3 PORT=7403 NODE_ID=n3 node services/storage.mjs &

sleep 2

echo "Starting gateway..."
export ETCD_ENDPOINTS="http://127.0.0.1:2379"
export STORAGE_NODES='[{"id":"n1","url":"http://127.0.0.1:7401","domain":"n1"},{"id":"n2","url":"http://127.0.0.1:7402","domain":"n2"},{"id":"n3","url":"http://127.0.0.1:7403","domain":"n3"}]'
export DATA_DIR=/data/gateway
export PORT=${PORT:-7400}

exec node services/gateway.mjs
