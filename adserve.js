var http = require('http'),
    express = require('express'),
    util = require('util');

var port = process.env.PORT || 3000;

var hypeUrl = process.env.HYPE_URI;
var adnetUrl = process.env.ADNET_URI;
util.log("Using adnet URL: " + adnetUrl);

var app = express();

app.get('/ad', function(request, response) {
  util.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
  var query = require('url').parse(request.url, true).query || {},
      appId = query.appId,
      userId = query.account;
  if (!appId || !userId) {
    response.writeHead(400);
    response.end('Missing required appId or account query-string params');
    return;
  }
  var url = hypeUrl + appId + "/" + userId;
  util.log(url);
  http.request(url, function(hype_response) {
    var body = "";
    hype_response.on('data', function (chunk) {
      body += chunk;
    });
    hype_response.on('end', function() {
      util.log("Demographics: " + body);
      var demographics = JSON.parse(body).demographics;
      var url = adnetUrl + require('querystring').stringify(demographics);
      util.log("Adnet URL: " + url);
      http.request(url, function(adnet_response) {
        response.writeHead(302, {'Location': adnet_response.headers["x-href"]});
        response.end();
      }).on('error', function(e) {
        util.log('Problem with request to adnet: ' + e.message);
      }).end();
    });
  }).end();
});

app.get('/adnet', function(request, response) {
  util.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
  response.writeHead(204, {'X-HREF': "http://placekitten.com/200/300"});
  response.end();
});

app.listen(port);
