FROM node:10.9.0
RUN mkdir -p /usr/src/app/dist
WORKDIR /usr/src/app/dist
RUN openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout /root/key.pem -out /root/cert.pem -subj '/CN=localhost/O=localhost/C=US'
RUN yarn global add http-server
CMD [ "http-server", "/usr/src/app/dist", "-S", "-C", "/root/cert.pem", "-K", "/root/key.pem" ]
