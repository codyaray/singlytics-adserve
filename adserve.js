var http = require('http'),
    express = require('express'),
    util = require('util');

var port = process.env.PORT || 3000;

var hypeUrl = process.env.HYPE_URI;
var adnetUrl = process.env.ADNET_URI;
util.log("Using adnet URL: " + adnetUrl);

var app = express();

app.get('/ad', function(request, response) {
  logRequest(request);
  var params = parseQuery(request.url);
  if (invalidateRequest(params, response)) {
    return;
  }
  var url = hypeUrl + params.appId + "/" + params.userId;
  http.request(url, handleHyperionResponse(doAdnetRequest(redirectToAd(response)))).end();
});

app.get('/adnet', function(request, response) {
  util.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
  response.writeHead(204, {'X-HREF': "http://placekitten.com/200/300"});
  response.end();
});

app.listen(port);

function invalidateRequest(params, response) {
  if (!params.appId || !params.userId) {
    response.writeHead(400);
    response.end('Missing required appId or account query-string params');
    return true;
  }
  return false;
}

function parseQuery(url) {
  var query = require('url').parse(url, true).query || {},
      appId = query.appId,
      userId = query.account;
  return { "appId": appId, "userId": userId };
}

function logRequest(request) {
  util.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
}

function handleHyperionResponse(callback) {
  return function(hype_response) {
    var body = "";
    hype_response.on('data', function(chunk) {
      body += chunk;
    });
    hype_response.on('end', function() {
      callback(body);
    });
  };
}

function doAdnetRequest(callback) {
  return function(body) {
    var demographics = JSON.parse(body).demographics;
    var url = adnetUrl + require('querystring').stringify(demographics);
    util.log("Adnet URL: " + url);
    var adnet_request = http.request(url, callback).on('error', function(e) {
      util.log('Problem with request to adnet: ' + e.message);
    }).end();
  };
}

function redirectToAd(response) {
  return function(adnet_response) {
    response.writeHead(302, {'Location': adnet_response.headers["x-href"]});
    response.end();
  };
}