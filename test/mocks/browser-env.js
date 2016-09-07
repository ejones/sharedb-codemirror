/**
 * @fileoverview Creates a browser environment for CodeMirror.
 */

var jsdom = require("jsdom");

global.document = jsdom.jsdom('<html><body></body></html>');
global.window = document.parentWindow;
global.navigator = {};

// Add some missing stuff in jsdom that CodeMirror wants
window.HTMLElement.prototype.createTextRange = function () {
  return {
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
  };
};
