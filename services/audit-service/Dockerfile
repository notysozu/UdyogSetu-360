FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY services/audit-service/package*.json services/audit-service/
COPY packages packages
COPY services/audit-service services/audit-service
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4104
CMD ["npm", "--workspace", "@udyogsetu/audit-service", "start"]
