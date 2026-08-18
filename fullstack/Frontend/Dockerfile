# Stage 1: Build — prepare the static site (API base injection)
FROM nginx:1.27-alpine

# Copy static frontend
COPY . /usr/share/nginx/html/

# Nginx site config (listens on $PORT for Railway)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint injects the backend API base into config.js at boot
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:${PORT:-80}/ || exit 1

# Railway exposes the app via the $PORT env var
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
