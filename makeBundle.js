#!/usr/bin/env node
var derequire = require('derequire');
var browserify = require('browserify');
var shim = require('browserify-shim');

var fs = require('fs');
var UglifyJS = require('uglify-js');
var pack = require('./package.json');

var inputFile = './index.js';
var outputFile = './dist/immstruct.js';
var outputMinifiedFile = './dist/immstruct.min.js';

var header = generateHeader();

var b = browserify({
  standalone: 'immstruct'
});
b.add(inputFile);
b.exclude('immutable');
b.transform(shim);
b.bundle(function(err, buf){
  var code = buf.toString();
  code = code.replace(/require\(('|")immutable('|")\)/ig, '(typeof window !== "undefined" ? window.Immutable : typeof global !== "undefined" ? global.Immutable : null)');
  code = header + derequire(code);
  fs.writeFileSync(outputFile, code);

  var minfied = UglifyJS.minify(outputFile);
  fs.writeFileSync(outputMinifiedFile, header + minfied.code);
});

function generateHeader() {
  var header = '';

  header = '/**\n';
  header += '* immstruct v' + pack.version + '\n';
  header += '* Authors: ' + pack.author + '\n';
  header += '***************************************/\n';

  return header;
}
