FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY services/orchestration-service/package*.json services/orchestration-service/
COPY packages packages
COPY services/orchestration-service services/orchestration-service
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4101
CMD ["npm", "--workspace", "@udyogsetu/orchestration-service", "start"]
