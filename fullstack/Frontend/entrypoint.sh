#!/bin/sh
set -e

# Railway sets $PORT (default 80)
PORT="${PORT:-80}"

# Inject backend API base into config.js when provided.
# Token stays untouched locally so normal origin-based resolution applies.
if [ -n "${API_BASE:-}" ]; then
    sed -i "s#__API_BASE__#${API_BASE//&/\\&}#g" /usr/share/nginx/html/assets/js/config.js
fi

# Render nginx config with the real port
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

exec "$@"
