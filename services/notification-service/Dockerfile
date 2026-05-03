FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY services/notification-service/package*.json services/notification-service/
COPY packages packages
COPY services/notification-service services/notification-service
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4103
CMD ["npm", "--workspace", "@udyogsetu/notification-service", "start"]
