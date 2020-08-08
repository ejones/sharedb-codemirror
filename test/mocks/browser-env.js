/**
 * @fileoverview Creates a browser environment for CodeMirror.
 */

var jsdom = require("jsdom");

global.window = new jsdom.JSDOM('<html><body></body></html>').window;
global.document = window.document;
global.navigator = {};

// Add some missing stuff in jsdom that CodeMirror wants
Object.assign(window.Range.prototype, {
  moveToElementText: function () {
  },
  collapse: function () {
  },
  moveEnd: function () {
  },
  moveStart: function () {
  },
  getBoundingClientRect: function () {
    return {};
  },
  getClientRects: function () {
    return [];
  },
});
