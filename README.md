Immstruct [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]
======

A wrapper for [Immutable.js](https://github.com/facebook/immutable-js#cursors) to easily create cursors that notify if they
are updated. Handy for usage with immutable pure components for views,
like with [React.js](https://github.com/facebook/react).

## Example

```js
// someFile.js
var structure = require('immstruct')('myKey', { a: { b: { c: 1 } } });

structure.on('swap', function (url, obj) {
  console.log('Render new components');
  // e.g. with usage with React
  // React.renderComponent(
  //   App({
  //      cursor: structure.current()
  //   }),
  //   document.querySelector('body')
  // );
});

// Remember: is immutable. Update cursor.
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


### `Structure : EventEmitter`

A structure is the a wrapped Immutable.js structure. You can access the inner
structure by calling `myStructure.current`. A structure is an event emitter.
See [events](#structure-events)

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

See [Immutable.js cursors](https://github.com/facebook/immutable-js#cursors).

**Note:** You **probably never** want to use use `structure.current.cursor()`
directly, as this won't add event handlers for when the cursor is updated.


#### `Structure#forceHasSwapped() : void`

Force triggers the swap events. Useful when you want to force re-render
design components or view layers.

### Structure Events

A Structure object is an event emitter and emits the following events:

* `swap`: Emitted when cursor is updated (new information is set). Emits no values. One use case for this is to re-render design components.
* `change`: Emitted when data/value is updated and it existed before. Emits values: `newValue` and `oldValue`.
* `delete`: Emitted when data/value is removed. Emits value: `removedValue`.
* `add`: Emitted when new data/value is added. Emits value: `newValue`.

[See tests for event examples](./tests/immstruct_test.js)

[npm-url]: https://npmjs.org/package/immstruct
[npm-image]: http://img.shields.io/npm/v/immstruct.svg?style=flat

[travis-url]: http://travis-ci.org/omniscientjs/immstruct
[travis-image]: http://img.shields.io/travis/omniscientjs/immstruct.svg?style=flat

[depstat-url]: https://gemnasium.com/omniscientjs/immstruct
[depstat-image]: http://img.shields.io/gemnasium/omniscientjs/immstruct.svg?style=flat
