FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/public-portal/package*.json apps/public-portal/
COPY packages packages
COPY apps/public-portal apps/public-portal
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4003
CMD ["npm", "--workspace", "@udyogsetu/public-portal", "start"]
