FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_RAZORPAY_KEY
ENV VITE_RAZORPAY_KEY=${VITE_RAZORPAY_KEY}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV API_GATEWAY_URL=http://api-gateway:8080
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
