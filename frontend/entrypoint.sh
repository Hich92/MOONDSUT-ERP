#!/bin/sh
# Fix uploads directory ownership when Docker named volume mounts as root
chown -R nextjs:nodejs /app/uploads 2>/dev/null || true
chmod 755 /app/uploads 2>/dev/null || true
exec su-exec nextjs node server.js
