#!/bin/sh

# Start backend services
cd /app/backend
npm start &

# Start nginx
nginx -g "daemon off;" &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?