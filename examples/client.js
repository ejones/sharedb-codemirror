var sharedb = require('sharedb/lib/client');
var otText = require('ot-text');
var CodeMirror = require('codemirror');
var ShareDBCodeMirror = require('..');

sharedb.types.map['json0'].registerSubtype(otText.type);

var editorElem = document.getElementById('editor');
var editor = CodeMirror.fromTextArea(editorElem, {
  mode: "text/plain"
});

var socket = new WebSocket("ws://" + location.host);
var shareConnection = new sharedb.Connection(socket);

var doc = shareConnection.get('users', 'jane');

ShareDBCodeMirror.attachDocToCodeMirror(doc, editor, {
  key: 'content',
  verbose: true
});

document.getElementById('monkey').onclick = function() {
  setInterval(monkeyType, 50);
};

function monkeyType() {
  var textLength = editor.getValue().length;
  var pos = Math.floor(Math.random() * textLength);
  var from = editor.posFromIndex(pos);
  var editLength = randomInt(10)
  if (Math.random() < 0.9) {
    // Add text
    var text = randomString(editLength);
    editor.replaceRange(text, editor.posFromIndex(pos));
  } else {
    var endIndex = Math.max(pos + editLength, textLength-1);
    var to = editor.posFromIndex(endIndex);
    editor.replaceRange('', from, to);
  }
}

function randomString(len) {
	var chars = "0123456789\nABCDEF\nGHIJKLM\nNOPQRSTUVWXTZ\nabcde\nfghiklmnop\nqrstuvwxyz";
	var result = '';
	for (var i = 0; i < len; i++) {
		var rnum = randomInt(chars.length);
		result += chars.substring(rnum, rnum + 1);
	}
  return result;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}
