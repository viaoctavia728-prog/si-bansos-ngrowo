# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Public backend URL embedded into the Vite build
ARG VITE_API_URL=http://localhost:8000
ARG VITE_FIREBASE_API_KEY=
ARG VITE_FIREBASE_AUTH_DOMAIN=
ARG VITE_FIREBASE_PROJECT_ID=
ARG VITE_FIREBASE_STORAGE_BUCKET=
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=
ARG VITE_FIREBASE_APP_ID=
ARG VITE_FIREBASE_VAPID_KEY=
ENV VITE_API_URL=$VITE_API_URL \
	VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
	VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
	VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
	VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
	VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
	VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
	VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY

# Build production bundle
RUN npm run build

# ---- Production Stage ----
FROM nginx:alpine

# Copy built assets to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for React SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
