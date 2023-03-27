const express = require("express");
const path = require('path');
const config = require('./config');
const cdnrailApi = require('./cdnrailApi');
const bodyParser = require('body-parser');
const multer  = require('multer');
const upload = multer();
const app = express();

const port = process.env.PORT || config.port;

app.use(express.json());
// parse incoming form data
app.use(bodyParser.urlencoded({ extended: true }));

//set headers for the whole website
app.use((req, res, next) => {
    // Allow all origins to access this resource
    res.setHeader('Access-Control-Allow-Origin', '*');
  
    // // Allow the following HTTP methods
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
    // Allow the following headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
    // Set the cache control max age to 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400');
  
    next();
});

// Set the view engine
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Specify the views directory
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'public', 'pages')
]);

//deliver media files
app.get('/media/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  res.sendFile(path.join(__dirname, 'public', 'media', fileName));
});

//deliver media files
app.get('/favicon/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  res.sendFile(path.join(__dirname, 'public', 'favicon', fileName));
});

//deliver media files
app.get('/stylesheets/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  res.sendFile(path.join(__dirname, 'public', 'stylesheets', fileName));
});

// handle requests to /reel/:mediaId and /p/:mediaId
app.get('/reels/:mediaId', handleMediaRequest);
app.get('/p/:mediaId', handleMediaRequest);

// handle requests to /reel/:mediaId and /p/:mediaId
function handleMediaRequest(req, res) {

  const mediaId = req.params.mediaId;
  const platform = "instagram";
  let mediaUrl = "https://instagram.com"+req.url;

  // validate the input
  if (!platform || !mediaId) {
    return res.status(400).json({ message: 'Invalid URL'});
  }
  // call cdnrail API to get media URL
  cdnrailApi.getMediaUrl(mediaUrl)
    .then(response => {
      // send the response back to page
      // if (response.postType == 'SingleVideo' || response.postType == 'SingleImage') {
        res.render('reel', response);
      // } else if (response.postType == 'MultiplePost') {
        // res.render('reel', response);
      // }
    })
    .catch(error => {
      res.status(500).json({ message: 'Failed to get media URL' });
    });
}

function getPlatform(url) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const pathname = urlObj.pathname;

  if (hostname === 'www.instagram.com' || hostname === 'instagram.com') {
    if (pathname.startsWith('/reels/') || pathname.startsWith('/p/')) {
      return 'instagram';
    }
  } else if (hostname === 'www.tiktok.com' || hostname === 'tiktok.com') {
    return 'tiktok';
  } else if (hostname === 'www.facebook.com' || hostname === 'facebook.com') {
    return 'facebook';
  } else if (hostname === 'www.twitter.com' || hostname === 'twitter.com') {
    return 'twitter';
  } else if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
    return 'youtube';
  } else if (hostname === 'localhost' || hostname === 'localhost:'+config.port) {
    return 'instagram';
  } else {
    return null;
  }
}

function parseUrl(url) {
  const platform = getPlatform(url);
  let mediaId = "";
  let type = "";
  const mediaUrl = url;

  // Extract mediaId from URL
  const match = url.match(/\/(reels|p)\/([\w\-]+)/);
  if (match) {
    mediaId = match[2];
    if (match[1] === "reels") {
      type = "videos";
    } else {
      type = "images";
    }
  }

  return { platform, mediaId, type , mediaUrl};
}

// Add route for handling form submit
app.post('/api/instagram', upload.none(), (req, res) => {
  const mediaUrl = req.body.url;
  // Validate the URL
  if (!mediaUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // get the data from the url
  const data = parseUrl(mediaUrl);

  // validate the input
  if (!data.platform || !data.mediaId) {
    console.log("Invalid url")
    return res.status(400).json({ message: 'Invalid URL' });
  }
  // call cdnrail API to get media URL
  cdnrailApi.getMediaUrl(mediaUrl)
    .then(response => {
      console.log("Got response from cdnrail!")
      res.json(response);
    })
    .catch(error => {
      res.status(500).json({ message: 'Failed to get media URL' });
    });
});

// render the index form
app.get('/', (req, res) => {
  res.render('instagram-form', { config });
});

  // render the instagram form
app.get('/instagram', (req, res) => {
  res.render('instagram-form', { config });
});

// render the twitter form
app.get('/twitter', (req, res) => {
  res.render('instagram-form', { config });
});

// render the twitter form
app.get('/facebook', (req, res) => {
  res.render('instagram-form', { config });
});

// render the twitter form
app.get('/youtube', (req, res) => {
  res.render('instagram-form', { config });
});

// render the pages
app.get('/pages/:page', (req, res) => {
  const pageName = req.params.page
  res.render(pageName, { config: config });
});


app.listen(config.port, () => {
    console.log('Server listening on port '+ port);  
});

