const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { base64encode, base64decode } = require('nodejs-base64');

function generateToken(url) {
  const hash = crypto.createHash('sha256');
  hash.update(url);
  return hash.digest('hex');
}

async function downloadMedia(instagramUrl, mediaUrl) {
  const cdnUrl = "/cdn?token=";
  const urlParts = instagramUrl.split('/');
  const hashKey = urlParts[urlParts.length - 2];
  const mediaType = mediaUrl.includes('.mp4') ? 'videos' : 'images';
  const extension = mediaType === 'videos' ? 'mp4' : 'jpg';

  const reelFolderToken = base64encode(hashKey);
  const token = reelFolderToken + '.' + generateToken(mediaUrl) + '.' + base64encode(extension);
  const mediaFolder = "instaMedia";
  const dir = path.join(__dirname, mediaFolder, reelFolderToken, mediaType);
  const filePath = path.join(dir, `${token}`);

  // Check if the media file already exists
  if (fs.existsSync(filePath)) {
    return cdnUrl+token;
  }

  // Create the directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Download the media file
  const response = await axios.get(mediaUrl, { responseType: 'stream' });
  response.data.pipe(fs.createWriteStream(filePath));

  return cdnUrl+token;
}

function decodeToken(token) {
  const parts = token.split('.');
  const mediaToken = parts[0];
  const extension = base64decode(parts.pop());
  const filename = parts.join('.');
  return { mediaToken, filename, extension };
}

module.exports = {
  generateToken,
  downloadMedia,
  decodeToken,
};
