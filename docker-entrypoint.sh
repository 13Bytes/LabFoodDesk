#!/bin/sh

npx prisma migrate deploy &
# if [ "$DATABASE" = "postgres" ]
# then
#     echo "Waiting for postgres..."

#     while ! nc -z $SQL_HOST $SQL_PORT; do
#       sleep 0.1
#     done

#     echo "##########"
#     echo "PostgreSQL started"
# fi
node server.js &
exec "$@"

wait -n
exit $?
