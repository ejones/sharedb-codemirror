var http = require('http');
var path = require('path');
var Duplex = require('stream').Duplex;
var inherits = require('util').inherits;
var express = require('express');
var ShareDB = require('sharedb');
var WebSocketServer = require('ws').Server;
var otText = require('ot-text');

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
  var stream = new WebsocketJSONOnWriteStream(socket);
  shareDB.listen(stream);
});

function WebsocketJSONOnWriteStream(socket) {
  Duplex.call(this, {objectMode: true});

  this.socket = socket;
  var stream = this;

  socket.on('message', function(data) {
    stream.push(data);
  });

  socket.on("close", function() {
    stream.push(null);
  });

  this.on("error", function(msg) {
    console.warn('WebsocketJSONOnWriteStream error', msg);
    socket.close();
  });

  this.on("end", function() {
    socket.close();
  });
}
inherits(WebsocketJSONOnWriteStream, Duplex);

WebsocketJSONOnWriteStream.prototype._write = function(value, encoding, next) {
  this.socket.send(JSON.stringify(value));
  next();
};

WebsocketJSONOnWriteStream.prototype._read = function() {};
