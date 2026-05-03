FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/gateway/package*.json apps/gateway/
COPY packages packages
COPY apps/gateway apps/gateway
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4000
CMD ["npm", "--workspace", "@udyogsetu/gateway", "start"]
