#!/bin/sh

trigger_cron_api() {
    while true; do
    sleep 60
    wget http://labfooddesk:3000/api/cron/trigger 2>/dev/null >/dev/null
    done
}

npx prisma migrate deploy

if [ "$ENABLE_PRISMA_STUDIO" == "true" ]; then
    echo "starting prisma studio"
    npx prisma studio &  # start prisma studio on :5555
fi

trigger_cron_api &
node server.js