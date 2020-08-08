var http = require('http');
var path = require('path');
var express = require('express');
var ShareDB = require('sharedb');
var WebSocketServer = require('ws').Server;
var otText = require('ot-text');
var WebSocketJSONStream = require('websocket-json-stream');

ShareDB.types.map['json0'].registerSubtype(otText.type);

var shareDB = ShareDB();

var app = express();
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/../node_modules/codemirror/lib'));

var server = http.createServer(app);
server.listen(7007, function (err) {
  if (err) {
    throw err;
  }
  console.log('Listening on http://%s:%s', server.address().address, server.address().port);
});

var webSocketServer = new WebSocketServer({server: server});

webSocketServer.on('connection', function (socket) {
  var stream = new WebSocketJSONStream(socket);
  shareDB.listen(stream);
});
