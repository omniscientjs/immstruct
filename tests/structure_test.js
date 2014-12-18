var chai = require('chai');
var expect = chai.expect;
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
      structure.cursor().toJS().should.eql({ 'foo': 'bar' });
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
      if(i == 1) {
        newData.toJS().should.eql({ 'foo': 'bar' });
        oldData.toJS().should.eql({ 'foo': 'hello' });
        structure.cursor().toJS().should.eql({ 'foo': 'bar' });
      }
      if(i == 2) {
        newData.toJS().should.eql({ 'foo': 'bar', 'bar': 'world' });
        oldData.toJS().should.eql({ 'foo': 'bar' });
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
      structure.current.toJS().should.eql({
        foo: 'bar'
      });
      done();
    });

    structure.cursor(['foo']).update(function () {
      return 'bar';
    });
  });

  it('should set correct structure when modifying it during a change event', function (done) {
    var structure = new Structure({
      data: { 'subtree': {} }
    });
    var i = 0;
    structure.on('swap', function (newData, oldData) {
      i++;
      if(i == 1) {
        newData.toJS().should.eql({ subtree: { foo: 'bar' } });
        oldData.toJS().should.eql({ subtree: {} });
      }
      if(i == 2) {
        newData.toJS().should.eql({ subtree: { foo: 'bar', hello: 'world' } });
        oldData.toJS().should.eql({ subtree: { foo: 'bar' } });
        structure.cursor().toJS().should.eql({ subtree: { foo: 'bar', hello: 'world' } });
        done();
      }
    });
    structure.once('change', function (path, newValue, oldValue) {
      path.should.eql(['subtree']);
      newValue.toJS().should.eql({ foo: 'bar' });
      oldValue.toJS().should.eql({});
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

  it('should trigger change with data when existing property is changed to falsey value', function (done) {
    var structure = new Structure({
      data: { 'foo': true }
    });
    var i = 0;
    structure.on('change', function (path, newValue, oldValue) {
      path.should.eql(['foo']);
      switch(i) {
        case 0:
          oldValue.should.equal(true);
          expect(newValue).to.be.undefined();
          break;
        case 1:
          expect(oldValue).to.be.undefined();
          expect(newValue).to.be.false();
          break;
        case 2:
          expect(oldValue).to.be.false();
          expect(newValue).to.be.null();
          done();
          break;
      }
      i++;
    });

    structure.cursor(['foo']).update(function () {
      return void 0;
    });

    structure.cursor(['foo']).update(function () {
      return false;
    });

    structure.cursor(['foo']).update(function () {
      return null;
    });
  });

  it('should resync immutable collection when a stale cursor changed existing property', function() {

    var struct = new Structure({
      data: { foo: 42, bar: 24 }
    });

    var foo = struct.cursor('foo');
    var bar = struct.cursor('bar');
    var current = struct.current;

    struct.once('swap', function(newRoot, oldRoot) {
      oldRoot.toJS().should.eql({ foo: 42, bar: 24 });
      current.should.equal(oldRoot);
      foo._rootData.should.equal(current);

      newRoot.toJS().should.eql({ foo: 43, bar: 24 });
      struct.current.toJS().should.eql(newRoot.toJS());
    });

    foo.update(function(val) {
      val.should.equal(42);
      return val + 1;
    });

    struct.current.toJS().should.eql({ foo: 43, bar: 24 });

    current = struct.current;
    struct.once('swap', function(newRoot, oldRoot) {
      oldRoot.toJS().should.eql({ foo: 42, bar: 24 });
      bar._rootData.should.equal(oldRoot);

      current.toJS().should.not.eql(oldRoot.toJS());
      current.toJS().should.not.eql(newRoot.toJS());
      newRoot.toJS().should.not.eql(oldRoot.toJS());

      newRoot.toJS().should.eql({ foo: 43, bar: 25 });
    });

    bar.update(function(val) {
        val.should.equal(24);
        return val + 1;
    });

    struct.current.toJS().should.eql({ foo: 43, bar: 25 });
  });

  it('should trigger add with data when a new property is added', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello' }
    });

    structure.on('add', function (path, newValue) {
      path.should.eql(['bar']);
      newValue.should.equal('baz');
      structure.current.toJS().should.eql({
        foo: 'hello',
        bar: 'baz'
      });
      done();
    });

    structure.cursor(['bar']).update(function (state) {
      return 'baz';
    });
  });

  it('should set correct structure when modifying it during an add event', function (done) {
    var structure = new Structure({
      data: { }
    });
    var i = 0;
    structure.on('swap', function (newData, oldData) {
      i++;
      if(i == 1) {
        newData.toJS().should.eql({ subtree: { foo: 'bar' } });
        oldData.toJS().should.eql({});
        structure.cursor().toJS().should.eql({ subtree: { foo: 'bar' } });
      }
      if(i == 2) {
        structure.cursor().toJS().should.eql({ subtree: { foo: 'bar', hello: 'world' } });
        done();
      }
    });
    structure.once('add', function (path, newValue, oldValue) {
      path.should.eql(['subtree']);
      newValue.toJS().should.eql({ foo: 'bar' });
      expect(oldValue).to.be.undefined();
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

  it('should trigger add with data when a new property added is a falsey value', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello' }
    });
    var i = 1;
    structure.on('add', function (path, newValue) {
      path.should.eql([i+'']);
      switch(i) {
        case 1:
          expect(newValue).to.be.false();
          break;
        case 2:
          expect(newValue).to.be.null();
          break;
        case 3:
          expect(newValue).to.be.undefined();
          done();
          break;
      }
      i++;
    });

    structure.cursor(['1']).update(function () {
      return false;
    });

    structure.cursor(['2']).update(function () {
      return null;
    });

    structure.cursor().set('3', void 0);
  });

  it('should resync immutable collection when a stale cursor adds new property', function() {

    var struct = new Structure({
      data: { foo: {}, bar: {} }
    });

    var foo = struct.cursor('foo');
    var bar = struct.cursor('bar');
    var current = struct.current;

    struct.once('swap', function(newRoot, oldRoot) {
      oldRoot.toJS().should.eql({ foo: {}, bar: {} });
      current.should.equal(oldRoot);
      foo._rootData.should.equal(current);

      newRoot.toJS().should.eql({ foo: { a: 42 }, bar: {} });
      struct.current.toJS().should.eql(newRoot.toJS());
    });

    foo.update('a', function() {
      return 42;
    });

    struct.current.toJS().should.eql({ foo: {a: 42}, bar: {} });

    current = struct.current;
    struct.once('swap', function(newRoot, oldRoot) {
      oldRoot.toJS().should.eql({ foo: {}, bar: {} });
      bar._rootData.should.equal(oldRoot);

      current.toJS().should.not.eql(oldRoot.toJS());
      current.toJS().should.not.eql(newRoot.toJS());
      newRoot.toJS().should.not.eql(oldRoot.toJS());

      newRoot.toJS().should.eql({ foo: {a: 42}, bar: {b: undefined} });
    });
    // This test case demonstrates the distinction between
    // .setIn(path, newRoot.getIn(path)) and
    // .updateIn(path, () => newRoot.getIn(path))
    bar.set('b', void 0);

    struct.current.toJS().should.eql({ foo: {a: 42}, bar: {b: undefined} });
  });

  it('should trigger delete with data when existing property is removed', function (done) {
    var structure = new Structure({
      data: { 'foo': 'hello', 'bar': 'world' }
    });

    structure.on('delete', function (path, oldValue) {
      path.should.eql(['foo']);
      oldValue.should.equal('hello');
      structure.cursor().toJS().should.eql({ 'bar': 'world' });
      done();
    });

    structure.cursor().remove('foo');
  });

  it('should set correct structure when modifying it during a delete event', function (done) {
    var structure = new Structure({
      data: { 'subtree': {} }
    });
    var i = 0;
    structure.on('swap', function (newData, oldData) {
      i++;
      if(i == 1) {
        newData.toJS().should.eql({});
        oldData.toJS().should.eql({ subtree: {} });
      }
      if(i == 2) {
        newData.toJS().should.eql({ subtree: { hello: 'world'} });
        oldData.toJS().should.eql({});
        structure.cursor().toJS().should.eql({ subtree: { hello: 'world' } });
        done();
      }
    });
    structure.once('delete', function (path, newValue) {
      path.should.eql(['subtree']);
      newValue.toJS().should.eql({});
      structure.cursor('subtree').update('hello',function() {
        return 'world';
      });
    });
    structure.cursor().delete('subtree');
  });

  it('should resync immutable collection when a stale cursor deletes existing property', function() {

    var struct = new Structure({
      data: { foo: { a: 42 }, bar: { b: 24 } }
    });

    var foo = struct.cursor('foo');
    var bar = struct.cursor('bar');
    var current = struct.current;

    struct.once('swap', function(newRoot, oldRoot) {
      oldRoot.toJS().should.eql({ foo: { a: 42 }, bar: { b: 24 } });
      current.should.equal(oldRoot);
      foo._rootData.should.equal(current);

      newRoot.toJS().should.eql({ foo: {}, bar: { b: 24 } });
      struct.current.toJS().should.eql(newRoot.toJS());
    });

    foo.delete('a');

    struct.current.toJS().should.eql({ foo: {}, bar: {b: 24} });

    current = struct.current;
    struct.once('swap', function(newRoot, oldRoot) {
      oldRoot.toJS().should.eql({ foo: { a: 42 }, bar: { b: 24 } });
      bar._rootData.should.equal(oldRoot);

      current.toJS().should.not.eql(oldRoot.toJS());
      current.toJS().should.not.eql(newRoot.toJS());
      newRoot.toJS().should.not.eql(oldRoot.toJS());

      newRoot.toJS().should.eql({ foo: {}, bar: {} });
    });

    bar.delete('b');

    struct.current.toJS().should.eql({ foo: {}, bar: {} });
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
