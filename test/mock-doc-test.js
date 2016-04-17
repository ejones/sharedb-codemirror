var assert = require('assert');
var MockDoc = require('./mocks/mock-doc');

describe('MockDoc', function () {
  var doc;

  beforeEach(function () {
    doc = new MockDoc('abcdefg');
  });

  it('can be created', function () {
    doc.type = null;
    doc.create('', 'text');
    assert.equal('text', doc.type && doc.type.name);
  });

  it('can insert at the beginning', function () {
    doc.submitOp(['123']);
    assert.equal('123abcdefg', doc.data);
  });

  it('can insert in the middle', function () {
    doc.submitOp([2, '123']);
    assert.equal('ab123cdefg', doc.data);
  });

  it('can insert at the end', function () {
    doc.submitOp([doc.data.length, '123']);
    assert.equal('abcdefg123', doc.data);
  });

  it('can remove from the beginning', function () {
    doc.submitOp([{d: 2}]);
    assert.equal('cdefg', doc.data);
  });

  it('can remove from the middle', function () {
    doc.submitOp([2, {d: 3}]);
    assert.equal('abfg', doc.data);
  });

  it('can remove from the end', function () {
    doc.submitOp([doc.data.length - 2, {d: 2}]);
    assert.equal('abcde', doc.data);
  });

  it('can error out subscribe', function (done) {
    var errorOnSubscribe = doc.errorOnSubscribe = new Error("Bleh");
    doc.subscribe(function(err) {
      assert.equal(errorOnSubscribe, err);
      done();
    });
  });
});
