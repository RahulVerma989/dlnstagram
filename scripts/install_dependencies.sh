#!/bin/bash

# Update package lists
sudo apt-get update

# Install Node.js and NPM
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install application dependencies
cd /home/ec2-user/dlnstagram
npm install