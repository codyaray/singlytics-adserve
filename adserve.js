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
  http.request(url, handleHyperionResponse(doAdnetRequest(bodyParser(function(body) {
    response.end(body);
  })))).end();
});

app.get('/adnet', function(request, response) {
  logRequest(request);
  response.writeHead(200, {'X-HREF': "http://placekitten.com/200/300"});
  var data = {"image": "http://placekitten.com/200/300", "href": "http://en.wikipedia.org/wiki/Kitten"};
  response.end(JSON.stringify(data));
});

app.get('/ad/img', function(request, response) {
  logRequest(request);
  var params = parseQuery(request.url);
  if (invalidateRequest(params, response)) {
    return;
  }
  var url = hypeUrl + params.appId + "/" + params.userId;
  http.request(url, handleHyperionResponse(doAdnetRequest(bodyParser(function(body) {
    var data = JSON.parse(body);
    response.writeHead(302, {'Location': data.image});
    response.end();
  })))).end();
});

app.get('/ad/href', function(request, response) {
  logRequest(request);
  var params = parseQuery(request.url);
  if (invalidateRequest(params)) {
    return;
  }
  var url = hypeUrl + params.appId + "/" + params.userId;
  http.request(url, handleHyperionResponse(doAdnetRequest(bodyParser(function(body) {
    var data = JSON.parse(body);
    response.writeHead(302, {'Location': data.href});
    response.end();
  })))).end();
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
    var parsedBody = JSON.parse(body)
    var demographics = parsedBody.demographics;
    var url = adnetUrl + require('querystring').stringify(demographics) + '&keywords=' + parsedBody.keywords.join();
    util.log("Adnet URL: " + url);
    var adnet_request = http.request(url, callback).on('error', function(e) {
      util.log('Problem with request to adnet: ' + e.message);
    }).end();
  };
}

function bodyParser(callback) {
  return function(adnet_response) {
    var body = "";
    adnet_response.on('data', function(chunk) {
      body += chunk;
    });
    adnet_response.on('end', function() {
      callback(body);
    });
  };
}
