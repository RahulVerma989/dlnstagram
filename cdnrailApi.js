const axios = require('axios');
const config = require('./config');

const cdnrailApi = {
  // This function takes in an object with 'mediaUrl', and returns a Promise
  // that resolves to the URL of the media file on cdnrail.com.
  getMediaUrl: (mediaUrl) => {
    const cdnrailUrl = `https://${config.cdnrail}/api/v1/media?url=${mediaUrl}`;
    console.log("Making request to cdnrail using url: " + cdnrailUrl);
    return axios.get(cdnrailUrl)
      .then(response => {
        // Extract the media URL from the response and return it.
        console.log("Got response from cdnrail:");
        console.log(response.data);
        return response.data;
      })
      .catch(error => {
        // If an error occurs, return a rejected Promise with the error message.
        console.log("Got an error in getMediaUrl(): "+ error.message);
        return Promise.reject(error.message);
      });
  }
};

module.exports = cdnrailApi;
