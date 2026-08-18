# Stage 1: Build — prepare the static site (API base injection)
# Lives at repo root because Railpack v0.22+ ignores subdirectory
# Dockerfiles (acceptChildOfRepoRoot:false). Build context = repo root.
FROM nginx:1.27-alpine

# Copy static frontend
COPY fullstack/Frontend /usr/share/nginx/html/

# Nginx site config (listens on $PORT for Railway)
COPY fullstack/Frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint injects the backend API base into config.js at boot
COPY fullstack/Frontend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:${PORT:-80}/ || exit 1

# Railway exposes the app via the $PORT env var
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]