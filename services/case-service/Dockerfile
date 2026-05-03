FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY services/case-service/package*.json services/case-service/
COPY packages packages
COPY services/case-service services/case-service
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4100
CMD ["npm", "--workspace", "@udyogsetu/case-service", "start"]
