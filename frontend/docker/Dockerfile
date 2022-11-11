#https://jsramblings.com/dockerizing-a-react-app/
#https://www.youtube.com/watch?v=3xDAU5cvi5E
# ==== CONFIGURE =====
# Use a Node 16 base image
FROM node 
# Set the working directory to /app inside the container
WORKDIR /app
# Copy app files here can also use . to replace /app 
COPY ./package.json /app
RUN npm install
#optimization skip nstall if package unchanged
COPY . .
# Expose the port on which the app will be running (3000 is the default that `serve` uses)
EXPOSE 3000
# Start the app
CMD ["npm", "run", "start"]