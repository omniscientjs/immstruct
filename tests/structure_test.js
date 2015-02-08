var chai = require('chai');
var expect = chai.expect;
chai.should();

var Immutable = require('immutable');
var Structure = require('../src/structure');

describe('structure', function () {


  describe('api', function () {

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

  })

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

  describe('events', function () {
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

    it('should trigger swap with keyPath', function (done) {
      var structure = new Structure({
        data: { 'foo': 'hello' }
      });

      structure.on('swap', function (newData, oldData, keyPath) {
        keyPath.should.eql(['foo']);
        done();
      });

      structure.cursor(['foo']).update(function () {
        return 'bar';
      });
    });

    it('should trigger swap with keyPath on forceHasSwapped', function (done) {
      var structure = new Structure({
        data: { 'foo': 'hello' }
      });

      structure.on('swap', function (newData, oldData, keyPath) {
        keyPath.should.eql(['foo']);
        done();
      });

      structure.forceHasSwapped(structure.current, structure.current, ['foo'])
    });

    it('should not emit events nor affect history when updating the structure does not actually change anything', function () {

      var calls = 0;
      var structure = new Structure({
        data: { foo: {}, bar: 42 },
        history: true
      });
      var original = structure.current;

      structure.on('swap', function() {
        calls++;
      });

      structure.on('change', function() {
        calls++;
      });

      var cursor = structure.cursor();
      var cursorBar = structure.cursor('bar');

      cursor.set('foo', Immutable.Map());

      calls.should.equal(0);

      cursorBar.update(function() {
        return 42;
      });

      calls.should.equal(0);
      original.should.equal(structure.current);

      // Ensure history is not affected
      structure.history.size.should.equal(1);

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

    describe('concurrency', function () {
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

          newRoot.toJS().should.eql({ foo: {a: 42}, bar: { b: "hello" } });
        });
        // This test case demonstrates the distinction between
        // .setIn(path, newRoot.getIn(path)) and
        // .updateIn(path, () => newRoot.getIn(path))
        bar.set('b', "hello");

        struct.current.toJS().should.eql({ foo: {a: 42}, bar: { b: "hello" } });
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

    });

  });

  describe('history', function () {

    it('should be able to undo default', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' },
        history: true
      });

      structure.cursor('foo').update(function () { return 'hello'; });
      structure.cursor('foo').deref().should.equal('hello');
      structure.undo();
      structure.cursor('foo').deref().should.equal('bar');
      structure.cursor('foo').update(function () { return 'hello2'; });
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

      structure.cursor('foo').update(function () { return 'hello'; });
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

      structure.cursor('foo').update(function () { return 'Change 1'; });
      structure.cursor('foo').update(function () { return 'Change 2'; });
      structure.cursor('foo').deref().should.equal('Change 2');

      structure.undo(2);
      structure.cursor('foo').deref().should.equal('bar');
    });

    it('should be able redo multiple steps', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' },
        history: true
      });

      structure.cursor('foo').update(function () { return 'Change 1'; });
      structure.cursor('foo').update(function () { return 'Change 2'; });
      structure.cursor('foo').update(function () { return 'Change 3'; });
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

      structure.cursor('foo').update(function () { return 'Change 1'; });
      structure.cursor('foo').deref().should.equal('Change 1');
      var change1 = structure.current;

      structure.cursor('foo').update(function () { return 'Change 2'; });
      structure.cursor('foo').deref().should.equal('Change 2');

      structure.undoUntil(change1);
      structure.cursor('foo').deref().should.equal('Change 1');
    });

  });


  describe('reference', function () {

    it('should expose API for creating reference', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' }
      });

      structure.should.have.property('reference');
    });

    it('should expose references with observe and unobserve functions', function () {
      var ref = new Structure({
        data: { 'foo': 'bar' }
      }).reference();

      ref.should.have.property('observe');
      ref.should.have.property('unobserveAll');
    });

    it('should create cursor for value', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' }
      });

      structure.reference('foo').cursor().deref().should.equal('bar');
    });

    it('should have a self-updating cursor', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' }
      });

      var ref = structure.reference('foo');
      var newCursor = ref.cursor().update(function () {
        return 'updated';
      });
      newCursor.deref().should.equal('updated');
      ref.cursor().deref().should.equal('updated');
    });

    it('should take cursor as argument', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' }
      });

      var ref = structure.reference(structure.cursor('foo'));
      var isCalled = false;
      var newCursor = ref.cursor().update(function () {
        isCalled = true;
        return 'updated';
      });
      newCursor.deref().should.equal('updated');
      ref.cursor().deref().should.equal('updated');
      isCalled.should.equal(true);
    });

    it('should have a self-updating cursor when changing from outside', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' }
      });

      var ref = structure.reference('foo');
      var newCursor = structure.cursor('foo').update(function () {
        return 'updated';
      });

      newCursor.deref().should.equal('updated');
      ref.cursor().deref().should.equal('updated');
    });

    it('should have a self-updating cursor on children', function () {
      var structure = new Structure({
        data: { 'foo': { 'bar': 1 } }
      });

      var ref = structure.reference('foo');
      var newCursor = ref.cursor().cursor('bar').update(function (state) {
        return 'updated';
      });
      newCursor.deref().should.equal('updated');
      ref.cursor().toJS().should.eql({
        'bar': 'updated'
      });
    });

    it('should support sub-cursor', function () {
      var structure = new Structure({
        data: { 'foo': { 'bar': 1 } }
      });

      var ref = structure.reference('foo');
      var newCursor = ref.cursor('bar').update(function (state) {
        return 'updated';
      });
      newCursor.deref().should.equal('updated');
      ref.cursor().toJS().should.eql({
        'bar': 'updated'
      });
    });


    it('should still be a reference after unobserve', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' }
      });

      var ref = structure.reference('foo');
      ref.unobserveAll();
      ref.cursor().update(function () { return 'updated'; });
      ref.cursor().deref().should.equal('updated');
    });

    it('should be destroyable', function () {
      var structure = new Structure({
        data: { 'foo': 'bar' }
      });

      var ref = structure.reference('foo');
      ref.destroy();
      (ref.cursor === void 0).should.equal(true);
      (ref.observe === void 0).should.equal(true);
      (ref.unobserveAll === void 0).should.equal(true);
    });

    describe('listeners', function () {

      it('should trigger change listener for reference', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');
        ref.observe(function () { done(); });
        ref.cursor().update(function () { return 'updated'; });
      });

      it('should trigger change listener for reference when changing cursor from outside', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');
        ref.observe(function () { done(); });
        structure.cursor('foo').update(function () { return 'updated'; });
      });

      it('should support nested paths', function () {
        var structure = new Structure({
          data: {
            someBox: { message: 'Hello World!' }
          }
        });

        var ref = structure.reference(['someBox', 'message']);
        var newCursor = ref.cursor().update(function () { return 'Hello, World!'; });
        ref.cursor().deref().should.equal(newCursor.deref());
      });

      it('should trigger only change events when specifying event type', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');
        ref.observe('delete', function () { expect('Should not be triggered').to.be.false(); });
        ref.observe('add', function () { expect('Should not be triggered').to.be.false(); });
        ref.observe('change', function () { done(); });
        structure.cursor('foo').update(function () { return 'updated'; });
      });

      it('should trigger only delete events when specifying event type', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');
        ref.observe('add', function () { expect('Should not be triggered').to.be.false(); });
        ref.observe('change', function () { expect('Should not be triggered').to.be.false(); });
        ref.observe('delete', function () { done(); });
        structure.cursor().remove('foo');
      });

      it('should trigger only add events when specifying event type', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('bar');
        ref.observe('delete', function () { expect('Should not be triggered').to.be.false(); });
        ref.observe('change', function () { expect('Should not be triggered').to.be.false(); });
        ref.observe('add', function () { done(); });
        structure.cursor(['bar']).update(function (state) {
          return 'baz';
        });
      });

      it('should trigger on every event type if listening to swap', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('bar');
        var i = 0;
        ref.observe('swap', function () { 
          i++;
          if (i === 3) done();
        });

        // Add
        structure.cursor(['bar']).update(function (state) {
          return 'baz';
        });

        // Change
        structure.cursor('bar').update(function () { return 'updated'; });

        // Delete
        structure.cursor().remove('bar');
      });

      it('should trigger on every event type if not specified event name', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('bar');
        var i = 0;
        ref.observe(function () { 
          i++;
          if (i === 3) done();
        });

        // Add
        structure.cursor(['bar']).update(function (state) {
          return 'baz';
        });

        // Change
        structure.cursor('bar').update(function () { return 'updated'; });

        // Delete
        structure.cursor().remove('bar');
      });

      it('should trigger multiple change listeners for reference', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');

        var i = 0;
        ref.observe(function () { i++; });
        ref.observe(function () { i++; });
        ref.observe(function () { if(i == 2) done(); });
        ref.cursor().update(function () { return 'updated'; });
      });

      it('should not trigger removed listener', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var i = 0;
        var ref = structure.reference('foo');
        var unsubscribe = ref.observe(function () { i++; });
        unsubscribe();

        ref.observe(function () { i++; });
        ref.observe(function () { if(i == 1) done(); });
        ref.cursor().update(function () { return 'updated'; });
      });

      it('should be able to call unsubscribe multiple times without effect', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');

        var i = 0;
        var unsubscribe = ref.observe(function () { i++; });
        unsubscribe();
        unsubscribe();
        unsubscribe();

        ref.observe(function () { i++; });
        ref.observe(function () { if(i == 1) done(); });
        ref.cursor().update(function () { return 'updated'; });
      });

      it('should be able to call add new listeners after unsubscribing all', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');

        var i = 0;
        ref.observe(function () { i++; });
        ref.unobserveAll();

        ref.observe(function () { i++; });
        ref.observe(function () { 
          i.should.equal(1);
          ref.cursor().deref().should.equal('updated');
          done();
        });
        ref.cursor().update(function () { return 'updated'; });
      });

      it('should not remove new listeners with old unsubscribers', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');
        var changed = false;
        var unsubscribe = ref.observe(function () { changed = true; });
        unsubscribe();

        ref.observe(function () { 
          changed.should.equal(false);
          done();
        });
        unsubscribe();
        ref.cursor().update(function () { return 'updated'; });
      });

      it('should not trigger multiple removed listener', function (done) {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var ref = structure.reference('foo');

        var i = 0;
        var unsubscribe = ref.observe(function () { i++; });
        unsubscribe();

        unsubscribe = ref.observe(function () { i++; });
        unsubscribe();

        ref.observe(function () { if(i == 0) done(); });
        ref.cursor().update(function () { return 'updated'; });
      });

      it('should unsubscribe all listeners for path', function () {
        var structure = new Structure({
          data: { 'foo': 'bar' }
        });

        var changed = false;
        var ref = structure.reference('foo');
        var cursor = ref.cursor();

        ref.observe(function () { changed = true; });
        ref.observe(function () { changed = true; });
        ref.observe(function () { changed = true; });

        ref.unobserveAll();
        cursor.update(function() { return 'changed'; });
        changed.should.equal(false);
      });

      it('should only remove listeners on given path', function () {
        var structure = new Structure({
          data: { 'foo': 'bar', 'bar': 'foo' }
        });

        var ref1 = structure.reference('foo');
        var ref2 = structure.reference('bar');
        var cursor1 = ref1.cursor();
        var cursor2 = ref2.cursor();

        var firstChange = false;
        var secondChange = false;

        ref1.observe(function () { firstChange = true; });
        ref1.observe(function () { firstChange = true; });
        ref1.observe(function () { firstChange = true; });

        ref2.observe(function () { secondChange = true; });

        ref1.unobserveAll();
        cursor1.update(function() { return 'changed'; });
        firstChange.should.equal(false);

        cursor2.update(function() { return 'changed'; });
        secondChange.should.equal(true);
      });

      it('should remove listeners for all local references', function () {
        var structure = new Structure({
          data: { 'foo': 'bar', 'bar': 'foo' }
        });

        var ref1 = structure.reference('foo');
        var ref2 = structure.reference('bar');
        var cursor1 = ref1.cursor();
        var cursor2 = ref2.cursor();

        var firstChange = false;
        var secondChange = false;

        ref1.observe(function () { firstChange = true; });
        ref1.observe(function () { firstChange = true; });
        ref1.observe(function () { firstChange = true; });

        ref2.observe(function () { secondChange = true; });

        ref1.unobserveAll();
        cursor1.update(function() { return 'changed'; });
        firstChange.should.equal(false);

        ref2.unobserveAll();
        cursor2.update(function() { return 'changed'; });
        secondChange.should.equal(false);
      });

    });

  });

});
