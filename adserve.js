var http = require('http'),
    express = require('express'),
    util = require('util');

var port = process.env.PORT || 3000;

var adnetUrl = process.env.ADNET_URI;
util.log("Using adnet URL: " + adnetUrl);

var app = express();

app.get('/ad', function(request, response) {
  util.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
  http.request(adnetUrl, function(adnet_response) {
    response.writeHead(302, {'Location': adnet_response.headers["x-href"]});
    response.end();
  }).on('error', function(e) {
    util.log('Problem with request to adnet: ' + e.message);
  }).end();
});

app.get('/adnet', function(request, response) {
  util.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
  response.writeHead(204, {'X-HREF': "http://placekitten.com/200/300"});
  response.end();
});

app.listen(port);
