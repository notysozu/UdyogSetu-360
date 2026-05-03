FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/department-portal/package*.json apps/department-portal/
COPY packages packages
COPY apps/department-portal apps/department-portal
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4002
CMD ["npm", "--workspace", "@udyogsetu/department-portal", "start"]
