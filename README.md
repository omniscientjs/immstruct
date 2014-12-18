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
  // React.render(App({ cursor: structure.current() }), document.body);
});

// Remember: Cursor is immutable. Update cursor.
var cursor = structure.cursor(['a', 'b', 'c']).update(function (x) {
  return x + 1;
});

console.log(cursor.deref()); //=> 2
```


```js
// anotherFile.js
var immstruct = require('immstruct');
var structure = immstruct('myKey');

var cursor = structure.cursor(['a', 'b', 'c']);
cursor = cursor.update(function (x) {
  return x + 1;
});
// Will trigger `swap` in somefile.js

console.log(cursor.deref()); //=> 3
```

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
