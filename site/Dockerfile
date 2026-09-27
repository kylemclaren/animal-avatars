# The site is built on the host first (`bun run build`: it compiles the
# library from ../src, outside this context), so the image only serves dist/.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
