Immstruct [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]
======

A wrapper for [Immutable.js](https://github.com/facebook/immutable-js/tree/master/contrib/cursor) to easily create cursors that notify if they
are updated. Handy for usage with immutable pure components for views,
like with [Omniscient](https://github.com/omniscientjs/omniscient) or [React.js](https://github.com/facebook/react).

## Usage

```js
// someFile.js
var immstruct = require('immstruct');
var structure = immstruct('myKey', { a: { b: { c: 1 } } });

// Use event `swap` or `next-animation-frame`
structure.on('swap', function (newStructure, oldStructure) {
  console.log('Subpart of structure swapped.');
  console.log('New structure:', newStructure.toJSON());

  // e.g. with usage with React
  // React.render(App({ cursor: structure.cursor() }), document.body);
});

var cursor = structure.cursor(['a', 'b', 'c']);

// Update the value at the cursor. As cursors are immutable, this returns a new cursor that points to the new data
var newCursor = cursor.update(function (x) {
  return x + 1;
});

// The value of the old `cursor` to is still `1`
console.log(cursor.deref()); //=> 1

// `newCursor` points to the new data
console.log(newCursor.deref()); //=> 2
```


```js
// anotherFile.js
var immstruct = require('immstruct');
var structure = immstruct('myKey');

var cursor = structure.cursor(['a', 'b', 'c']);

var updatedCursor = cursor.update(function (x) { // triggers `swap` in somefile.js
  return x + 1;
});

console.log(updatedCursor.deref()); //=> 3
```

## Reference Cursors

With immstruct, you can create references to cursors, allowing you to have
access to cursors which will always be fresh. Normal cursors in Immutable.js
is immutable values and holds references to the structure at the time the
cursor was created. This is not to be confused with the `reference cursors`
term used in Om, but can allow for similar usage with
[Omniscient](https://github.com/omniscientjs/omniscient). It's best explained
by example:

```js
var structure = immstruct({
  someBox: { message: 'Hello World!' }
});

// Create a reference to 'message':
var ref = structure.reference(['someBox', 'message']);

// Get cursor from reference:
ref.cursor();

// Update cursor
var newCursor = ref.cursor().update(function () { return 'Hello, World!'; });

// Get cursor again, and it's updated:
console.log(ref.cursor().deref());
//=> Hello, World!

// Also
console.log(ref.cursor().deref() === newCursor.deref());
```

This is also true, even if you change a cursor without it's reference:

```js

var structure = immstruct({ 'foo': 'bar' });

var ref = structure.reference('foo');
structure.cursor('foo').update(function () { return 'updated'; });

console.log(ref.cursor().deref()) //=> 'updated'
```

Reference coursors will also allow for listening on alterations on specific
paths:

```js
// Create a reference to 'message':
var ref = structure.reference(['someBox']);

var unobserve = ref.observe(function () {
  // Will be updated when 'someBox' is changed, or
  // if ['someBox', 'message'] is changed.
});

// Do some updates
ref.cursor().update(function () { return 'updated'; });

// When you want to remove listener:
unobserve();
```

**Note: The parents change listeners are called when sub-cursors are changed.**

Also note, cursors are still immutable. If you store a cursor from `reference.cursor()`
it will get "old", and you can rewrite newer information.

## Usage Undo/Redo

```js
var structure = immstruct.withHistory({ 'foo': 'bar' });
console.log(structure.cursor('foo').deref()); //=> 'bar'

structure.cursor('foo').update(function () { return 'hello'; });
console.log(structure.cursor('foo').deref()); //=> 'hello'

structure.undo();
console.log(structure.cursor('foo').deref()); //=> 'bar'

structure.redo();
console.log(structure.cursor('foo').deref()); //=> 'hello'

```

## API

### `immstruct([name : String][jsStructure : Object]) : Structure`

Creates or retrieves [structures](#structure--eventemitter).

See examples:

```js
var structure = immstruct('someKey', { some: 'jsObject' })
// Creates new structure with someKey
```


```js
var structure = immstruct('someKey')
// Get's the structure named `someKey`.
```

**Note:** if someKey doesn't exist, an empty structure is created

```js
var structure = immstruct({ some: 'jsObject' })
var randomGeneratedKey = structure.key;
// Creates a new structure with random key
// Used if key is not necessary
```


```js
var structure = immstruct()
var randomGeneratedKey = structure.key;
// Create new empty structure with random key
```

You can also create your own instance of Immstruct, isolating the
different instances of structures:

```js
var localImmstruct = new immstruct.Immstruct()
var structure = localImmstruct.get('someKey', { my: 'object' });
```

#### Methods and accessers

##### `immstruct#clear()`

Removes all instances.

##### `immstruct#remove(name : String) : bool`

Removes specified instance. Returns result of the delete operation.

##### `immstruct#instances : Structure[]`

Access the instances internals.

### `Structure : EventEmitter`

You can create a bare-bone `Structure` without using the instance management
of the `immstruct` function call. Require the structure directly:

```js
var Structure = require('immstruct/structure');
var s = new Structure({
  key: 'foo', // default random string
  data: someObject, // default empty object
  withHistory: true // default `false`
})
```

A structure is the a wrapped Immutable.js instance. You can access the inner
immutable data by calling `myStructure.current`. A structure is an
event emitter. See [events](#structure-events)

#### `Structure#key : String`
Returns the access key for structure. Can be used to get the instance by using
`immstruct(givenKey)`. If you don't use a key while creating the structure with
immstruct, a random key will be generated. In that case, you can use this
property to retrieve the used key.

#### `Structure#current : Immutable.js`

Returns the internal Immutable.js structure.

See [Immutable.js](https://github.com/facebook/immutable-js).

#### `Structure#cursor([path : Array<string>]) : Cursor (Immutable.js)`

Creates a cursor to a part of a Immutable.js structure based on a array
of paths. If no path is given the top node is used.

Example:
```js
var cursor = structure.cursor(['some', 'path', 'here']);
cursor.get('subPath').update(updateFunction);
```

See [Immutable.js cursors](https://github.com/facebook/immutable-js/tree/master/contrib/cursor).

**Note:** You **probably never** want to use use `structure.current.cursor()`
directly, as this won't add event handlers for when the cursor is updated.

#### `Structure#reference([path : Array<string>]) : CursorReference`

Creates a [reference cursor](#reference-cursors) for having access to
cursors which are always up to date with the latest structure.

Example:
```js
var ref = structure.reference(['some', 'path', 'here']);
var cursor = ref.cursor();
```

##### CursorReference#cursor([path : Array<string>]) : Cursor (Immutable.js)

Creates a (sub-)cursor from the reference. If path is provided, a sub-cursor
is created, without a path, the latest and greatest cursor of the path
provided to the reference is created.

##### CursorReference#observe([eventType : String, ]listener : Function) : unobserve : Function

Add a listener for when the data the cursor (or any sub-cursors) in the reference
changes.

Optional `eventType` will define what type of change to listen for; `swap`, `add`, `change` and `delete.
Same as [Structure Events as defined below](#structure-events). If no event is passed, `swap` is used, which
means every change.

Returns a function to remove observer.

##### CursorReference#unobserveAll()

Remove all observers for this reference.

##### CursorReference#destroy()

Clean up all, remove all listeners and unset all loose variables to clear up
memory.

#### `Structure#forceHasSwapped() : void`

Force triggers the swap events. Useful when you want to force re-render
design components or view layers.


### With History

Instantiate structure using `withHistory` instead of default constructor:

```
var structure = immstruct.withHistory({ 'foo': 'bar' });
```

Same signature as normal constructor:

```
immstruct.withHistory([name : String][jsStructure : Object]) : Structure
```

#### `Structure#undo(steps: int) : Structure`

Undo number of steps. Step defaults to one step. Returns structure.

#### `Structure#undoUntil(obj: Structure) : Structure`

Undo number until structure passed as argument. Returns structure.

#### `Structure#redo(steps: int) : Structure`

Redo number of steps. Step defaults to one step. Returns structure.

### Structure Events

A Structure object is an event emitter and emits the following events:

* `swap`: Emitted when cursor is updated (new information is set). Emits no values. One use case for this is to re-render design components. Callback is passed arguments: `newStructure`, `oldStructure`.
* `next-animation-frame`: Same as `swap`, but only emitted on animation frame. Could use with many render updates and better performance. Callback is passed arguments: `newStructure`, `oldStructure`.
* `change`: Emitted when data/value is updated and it existed before. Emits values: `path`, `newValue` and `oldValue`.
* `delete`: Emitted when data/value is removed. Emits value: `path` and `removedValue`.
* `add`: Emitted when new data/value is added. Emits value: `path` and `newValue`.

**NOTE:** If you update cursors via `Cursor.update` or `Cursor.set`, and if the underlying Immutable collection is not inherently changed, `swap` and `changed` events will not be emitted, neither will the history (if any) be applied.

[See tests for event examples](./tests/structure_test.js)

[npm-url]: https://npmjs.org/package/immstruct
[npm-image]: http://img.shields.io/npm/v/immstruct.svg?style=flat

[travis-url]: http://travis-ci.org/omniscientjs/immstruct
[travis-image]: http://img.shields.io/travis/omniscientjs/immstruct.svg?style=flat

[depstat-url]: https://gemnasium.com/omniscientjs/immstruct
[depstat-image]: http://img.shields.io/gemnasium/omniscientjs/immstruct.svg?style=flat


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
