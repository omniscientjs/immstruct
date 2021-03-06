var chai = require('chai');
chai.should();

var immstruct = require('../');

var EventEmitter = require('eventemitter3');

describe('immstruct', function () {

  afterEach(function () {
    immstruct.clear();
  });

  it('should return an EventEmitter3', function () {
    immstruct('customKey').should.be.instanceof(EventEmitter);
  });

  it('should expose Structure', function () {
    immstruct.should.have.property('Structure');
  });

  it('should expose instancible Immstruct', function () {
    immstruct.should.have.property('Immstruct');
  });

  it('should support creating a new immstruct structure without new (to be safe)', function () {
    (immstruct.Immstruct()).should.be.instanceof(immstruct.Immstruct);
  });

  it('should create empty immutable structure and random key if no input', function () {
    var structure = immstruct();
    structure.current.toJS().should.be.an('object');
    structure.key.should.be.an('string');
  });

  it('should create empty immutable structure and random key if no input on local instance', function () {
    var local = new immstruct.Immstruct();
    var structure = local.get();
    structure.current.toJS().should.be.an('object');
    structure.key.should.be.an('string');
  });

  it('local instance and global instance should not share instances', function () {
    var local = new immstruct.Immstruct();
    var structure = local.get();
    var stdStructure = immstruct();

    local.instance(structure.key).should.not.equal(stdStructure);

    local.instance().should.be.an('object');
    stdStructure.should.be.an('object');
    structure.should.be.an('object');
  });

  it('should be able to create structure with history', function () {
    var structure = immstruct.withHistory({ foo: 'bar' });
    structure.current.toJS().should.be.an('object');
    structure.history.get(0).toJS().should.eql({ foo: 'bar' });
  });

  it('should be able to create structure with history and key', function () {
    var structure = immstruct.withHistory('histAndKey', { foo: 'bar' });
    structure.current.toJS().should.be.an('object');
    structure.history.get(0).toJS().should.eql({ foo: 'bar' });
    var structureRef = immstruct('histAndKey');
    structureRef.history.get(0).toJS().should.eql({ foo: 'bar' });
  });

  it('should be able to create structure with history and key on instance', function () {
    var localImmstruct = new immstruct.Immstruct();
    var structure = localImmstruct.withHistory('histAndKey', { foo: 'bar' });
    structure.current.toJS().should.be.an('object');
    structure.history.get(0).toJS().should.eql({ foo: 'bar' });
    var structureRef = localImmstruct.instance('histAndKey');
    structureRef.history.get(0).toJS().should.eql({ foo: 'bar' });
  });

  it('should be able to create structure with capped history', function () {
    var limit = 1; // only keep this many history refs
    var structure = immstruct.withHistory(limit, { foo: 'bar' });
    structure.current.toJS().should.be.an('object');
    structure.history.get(0).toJS().should.eql({ foo: 'bar' });
    structure.cursor('foo').update(function () { return 'cat'; });
    structure.history.size.should.eql(1);
    structure.history.get(0).toJS().should.eql({ foo: 'cat' });
  });

  it('should be able to create structure with capped history and key', function () {
    var limit = 1; // only keep this many history refs
    var structure = immstruct.withHistory('histLimitKey', limit, { foo: 'bar' });
    structure.current.toJS().should.be.an('object');
    structure.history.get(0).toJS().should.eql({ foo: 'bar' });
    structure.cursor('foo').update(function () { return 'cat'; });
    structure.history.size.should.eql(1);
    structure.history.get(0).toJS().should.eql({ foo: 'cat' });
    var structureRef = immstruct('histLimitKey');
    structureRef.history.get(0).toJS().should.eql({ foo: 'cat' });
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

  it('should delete structure', function () {
    immstruct('customKey', { 'foo': 'hello' });
    immstruct('customKey').current.toJS().should.have.property('foo');
    immstruct.remove('customKey').should.equal(true);
    immstruct('customKey').current.toJS().should.not.have.property('foo');
  });

  it('should expose the instances internals', function () {
    immstruct('customKey', { 'foo': 'hello' });
    immstruct.instance('customKey').current.toJS().should.have.property('foo');
  });

  it('should expose all instances', function () {
    immstruct('customKey', { 'foo': 'hello' });
    immstruct.instance().customKey.current.toJS().should.have.property('foo');
  });

})
