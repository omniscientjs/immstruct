var chai = require('chai');
chai.should();

var immstruct = require('../');

var EventEmitter = require('eventemitter3').EventEmitter;

describe('immstruct', function () {

  afterEach(function () {
    immstruct.clear();
  });

  it('should return an EventEmitter3', function () {
    immstruct('customKey').should.be.instanceof(EventEmitter);
  });

  it('should create empty immutable structure and random key if no input', function () {
    var structure = immstruct();
    structure.current.toJS().should.be.an('object');
    structure.key.should.be.an('string');
  });

  it('should give structure with random key when js object given as only argument', function () {
    var structure = immstruct({ foo: 'hello' });
    structure.current.toJS().should.have.property('foo');
    structure.key.should.be.an('string');
  });

  it('should give structure with key and default object if only key is given and structure dont exist', function () {
    var structure = immstruct('customKey');
    structure.current.toJS().should.be.an('object');
    structure.key.should.equal('customKey');
  });

  it('should give structure with key and default object if only key is given and structure dont exist', function () {
    var structure = immstruct('customKey2');
    structure.current.toJS().should.be.an('object');
    structure.key.should.not.equal('customKey');
  });

  it('should be able to retrieve created structure with same key', function () {
    immstruct('customKey', { foo: 'hello' });
    immstruct('customKey').current.toJS().should.have.property('foo');
    immstruct('customKey').current.toJS().foo.should.equal('hello');
  });

  it('should clear all instances', function () {
    immstruct('customKey', { 'foo': 'hello' });
    immstruct('customKey').current.toJS().should.have.property('foo');
    immstruct.clear();
    immstruct('customKey').current.toJS().should.not.have.property('foo');
  });

})
