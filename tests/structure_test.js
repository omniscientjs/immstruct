var chai = require('chai');
chai.should();

var Immutable = require('immutable');
var Structure = require('../src/structure');

describe('structure', function () {

  it('should trigger swap when structure is changed with new and old data', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello' }
    });
    structure.on('swap', function (newData, oldData) {
      newData.toJS().should.eql({'foo': 'bar'});
      oldData.toJS().should.eql({'foo': 'hello'});
      done();
    });

    structure.cursor(['foo']).update(function () {
      return 'bar';
    });
  });

  it('should set correct structure when modifying it during a swap event', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello' }
    });
    var i = 0;
    structure.on('swap', function (newData, oldData) {
      i++;
      if(i == 2) {
        structure.cursor().toJS().should.eql({'foo': 'bar', 'bar': 'world'});
        done();
      }
    });
    structure.once('swap', function (newData, oldData) {
      structure.cursor('bar').update(function() {
        return 'world';
      });
    });
    structure.cursor(['foo']).update(function () {
      return 'bar';
    });
  });

  it('should be able to force trigger swap', function (done) {
    var structure = new Structure();
    structure.on('swap', function () {
      done();
    });
    structure.forceHasSwapped();
  });

  it('should trigger change with data when existing property is changed', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello' }
    });

    structure.on('change', function (path, newValue, oldValue) {
      path.should.eql(['foo']);
      oldValue.should.equal('hello');
      newValue.should.equal('bar');
      done();
    });

    structure.cursor(['foo']).update(function () {
      return 'bar';
    });

    structure.current.toJS().should.eql({
      foo: 'bar'
    });
  });

  it('should set correct structure when modifying it during a change event', function (done) {
    var structure = new Structure({
      data: { 'subtree': {} }
    });
    var i = 0;
    structure.on('swap', function (newData, oldData) {
      i++;
      if(i == 2) {
        structure.cursor().toJS().should.eql({ subtree: { foo: 'bar', hello: 'world' } });
        done();
      }
    });
    structure.once('change', function (path, newValue, oldValue) {
      structure.cursor('subtree').update('hello',function() {
        return 'world';
      });
    });
    structure.cursor().update('subtree', function () {
      return Immutable.fromJS({
          foo: 'bar'
      });
    });
  });

  it('should trigger add with data when existing property is added', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello' }
    });

    structure.on('add', function (path, newValue) {
      path.should.eql(['bar']);
      newValue.should.equal('baz');
      done();
    });

    structure.cursor(['bar']).update(function (state) {
      return 'baz';
    });
    structure.current.toJS().should.eql({
      foo: 'hello',
      bar: 'baz'
    });
  });

  it('should set correct structure when modifying it during an add event', function (done) {
    var structure = new Structure({
      data: { }
    });
    var i = 0;
    structure.on('swap', function (newData, oldData) {
      i++;
      if(i == 2) {
        structure.cursor().toJS().should.eql({ subtree: { foo: 'bar', hello: 'world' } });
        done();
      }
    });
    structure.once('add', function (path, newValue, oldValue) {
      structure.cursor('subtree').update('hello',function() {
        return 'world';
      });
    });
    structure.cursor().update('subtree', function () {
      return Immutable.fromJS({
          foo: 'bar'
      });
    });
  });

  it('should trigger delete with data when existing property is removed', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello', 'bar': 'world' }
    });

    structure.on('swap', function() {
      structure.cursor().toJS().should.eql({ 'bar': 'world' });
      done();
    });

    structure.on('delete', function (path, oldValue) {
      path.should.eql(['foo']);
      oldValue.should.equal('hello');
    });

    structure.cursor().remove('foo');
  });

  it('should set correct structure when modifying it during a delete event', function (done) {
    var structure = new Structure({
      data: { 'subtree': { } }
    });
    var i = 0;
    structure.on('swap', function (newData, oldData) {
      i++;
      if(i == 2) {
        structure.cursor().toJS().should.eql({ subtree: { hello: 'world' } });
        done();
      }
    });
    structure.once('delete', function (path, newValue, oldValue) {
      structure.cursor('subtree').update('hello',function() {
        return 'world';
      });
    });
    structure.cursor().delete('subtree');
  });

  it('should expose immutable.js cursor', function () {
    var structure = new Structure({
      data: { 'foo': 'hello' }
    });

    var cursor = structure.cursor(['foo']);
    cursor.deref().should.equal('hello');
    cursor = cursor.update(function () {
      return 'bar';
    });
    cursor.deref().should.equal('bar');
  });

  describe('existing immutable structure', function () {

    it('should accept existing immutable maps', function () {
      var immutableObj = Immutable.fromJS({
        foo: 'hello'
      });

      var structure = new Structure({
        data: immutableObj
      });

      var cursor = structure.cursor(['foo']);
      cursor.deref().should.equal('hello');
      cursor = cursor.update(function () {
        return 'bar';
      });
      cursor.deref().should.equal('bar');
    });

    it('should accept existing immutable list', function () {
      var immutableObj = Immutable.List.of('hello');

      var structure = new Structure({
        data: immutableObj
      });

      var cursor = structure.cursor(['0']);

      cursor.deref().should.equal('hello');
      cursor = cursor.update(function () {
        return 'bar';
      });
      cursor.deref().should.equal('bar');
    });

  });

  describe('undo/redo', function () {

    it('should be able to undo default', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' },
        history: true
      });

      structure.cursor('foo').update(function () { return 'hello'; });
      structure.cursor('foo').deref().should.equal('hello');
      structure.undo();
      structure.cursor('foo').deref().should.equal('bar');
      structure.cursor('foo').update(function () { return 'hello2'; });
      structure.cursor('foo').deref().should.equal('hello2');
      structure.history.toJS().should.eql([
        { 'foo': 'bar' },
        { 'foo': 'hello2' }
      ]);
    });

    it('should be able to redo default', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' },
        history: true
      });

      structure.cursor('foo').update(function () { return 'hello'; });
      structure.cursor('foo').deref().should.equal('hello');
      structure.undo();
      structure.cursor('foo').deref().should.equal('bar');
      structure.redo();
      structure.cursor('foo').deref().should.equal('hello');
    });

    it('should be able undo multiple steps', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' },
        history: true
      });

      structure.cursor('foo').update(function () { return 'Change 1'; });
      structure.cursor('foo').update(function () { return 'Change 2'; });
      structure.cursor('foo').deref().should.equal('Change 2');

      structure.undo(2);
      structure.cursor('foo').deref().should.equal('bar');
    });

    it('should be able redo multiple steps', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' },
        history: true
      });

      structure.cursor('foo').update(function () { return 'Change 1'; });
      structure.cursor('foo').update(function () { return 'Change 2'; });
      structure.cursor('foo').update(function () { return 'Change 3'; });
      structure.cursor('foo').deref().should.equal('Change 3');

      structure.undo(3);
      structure.cursor('foo').deref().should.equal('bar');

      structure.redo(2);
      structure.cursor('foo').deref().should.equal('Change 2');
    });

    it('should be able undo until object passed as argument', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' },
        history: true
      });

      structure.cursor('foo').update(function () { return 'Change 1'; });
      structure.cursor('foo').deref().should.equal('Change 1');
      var change1 = structure.current;

      structure.cursor('foo').update(function () { return 'Change 2'; });
      structure.cursor('foo').deref().should.equal('Change 2');

      structure.undoUntil(change1);
      structure.cursor('foo').deref().should.equal('Change 1');
    });

  });

});
