// Name: Brandon Manke
// Thanks to https://github.com/bnned
// Web Scraper using node, cheerio, and phantom to scrape prnt.sc
// Licenses: Cheerio (MIT), Phantom (ISC)

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var phantom = require('phantom');
var cheerio = require('cheerio');

// Generates a random prnt.sc url
function generateRandomURL () {
  var url = 'http://prnt.sc/';
  var randomURL = '0123456789abcdefghijklmnopqrstuvwxyz';

  // from 0 to 5-6 characters in length
  for (var i = 0; i < Math.floor(Math.random() * (6 - 5 + 1)) + 5; i++) {
    url += randomURL.charAt(Math.floor(Math.random() * randomURL.length));
  }
  return url;
}

/**
* @param {string} url that is passed into the filter. In this case it is always passed by generateRandomURL()
*/
function filterURL (url) {
  var filter = '8tdUI8N.png';
  var imageShackFilter = 'http://img'; // might need to specify this more or change it

  // filters out images that are removed/do not exist
  if (url.substring(19, 30).valueOf() === filter || url.substring(0, 10).valueOf() === imageShackFilter) {
    return false;
  } else {
    return true;
  }
}

// Uses headless webkit Phantom to load the entire non-static page
function parseUrl () {
  /** @param {object} ph - creating phantom object ph */
  phantom.create().then(function (ph) {
    /** @param {object} page - creating page to proxy all functions sent to phantom object */
    ph.createPage().then(function (page) {
      // pass random url to page
      page.open(generateRandomURL()).then(function (status) {
        // loads all content of the page via 'content' property
        page.property('content').then(function (content) {
          // cheerio parsing html once page is loaded
          var $ = cheerio.load(content);
          var img = $('#screenshot-image').attr('src'); // looks for 'screenshot-image'
          // filtering image
          if (filterURL(img)) {
              io.emit('update-image', img);
          } else {
            console.log('Image not found. Please wait while next url is parsed.. \n');
          }
          ph.exit(); // Exiting webkit process
          parseUrl();
        });
      });
    });
  });
}

app.get('*', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(80, function() {
    console.log('Starting scraper, please wait while page is being loaded. (Ctrl+C to terminate)');
    parseUrl();
});