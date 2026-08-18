#!/bin/sh
set -e

# Railway sets $PORT (default 80)
PORT="${PORT:-80}"

# Inject backend API base into every config.js copy that carries the
# marker (root + core/ bundles). Token stays untouched locally so normal
# origin-based resolution applies.
if [ -n "${API_BASE:-}" ]; then
    for f in $(find /usr/share/nginx/html -type f -name '*.js' -exec grep -l '__API_BASE__' {} + 2>/dev/null); do
        sed -i "s#__API_BASE__#${API_BASE//&/\\&}#g" "$f"
    done
fi

# Render nginx config with the real port
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

exec "$@"
