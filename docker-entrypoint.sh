#!/bin/sh

npx prisma migrate deploy

if [ "$ENABLE_PRISMA_STUDIO" == "true" ]; then
    echo "starting prisma studio"
    npx prisma studio &  # start prisma studio on :5555
fi
node server.js