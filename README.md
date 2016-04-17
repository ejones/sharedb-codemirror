# ShareDB-CodeMirror [![Build Status](https://secure.travis-ci.org/ejones/sharedb-codemirror.png)](http://travis-ci.org/ejones/sharedb-codemirror) [![Dependencies](https://david-dm.org/ejones/sharedb-codemirror.png)](https://david-dm.org/ejones/sharedb-codemirror) [![devDependency Status](https://david-dm.org/ejones/sharedb-codemirror/dev-status.png)](https://david-dm.org/ejones/sharedb-codemirror#info=devDependencies)
CodeMirror bindings for ShareDB.

## Usage

```javascript
var CodeMirror = require('codemirror');
var ShareDBCodeMirror = require('sharedb-codemirror');

// ...

var codeMirror = CodeMirror.fromTextArea(elem);
ShareDBCodeMirror.attachDocToCodeMirror(shareDBDoc, codeMirror);
```

That's it. You now have two-way sync between ShareDB and CodeMirror. A full
example is available in [examples/](https://github.com/ejones/sharedb-codemirror/tree/master/examples).

## Install with NPM

```
npm install sharedb-codemirror
```

## Try it out

```
npm install
npm start
# in a couple of browsers...
open http://localhost:7007
```

Try clicking the infinite monkeys button. Do it in both browsers.
Wait for poetry to appear.

## Run tests

```
npm install
npm test
```

With test coverage:

```
npm run test-cover
open coverage/lcov-report/index.html
```
