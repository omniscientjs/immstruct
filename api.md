
### `Immstruct`

Creates a new instance of Immstruct, having it's own list
of Structure instances.

### Examples:

    var ImmstructInstance = require('immstruct').Immstruct;
    var immstruct = new ImmstructInstance();
    var structure = immstruct.get({ data: });


### Properties

| property    | type  | description                      |
| ----------- | ----- | -------------------------------- |
| `instances` | Array | Array of `Structure` instances.  |



**Returns** `Immstruct`, 


### `immstruct.get([key], [data])`

Gets or creates a new instance of {Structure}. Provide optional
key to be able to retrieve it from list of instances. If no key
is provided, a random key will be generated.

### Examples:
```js
var immstruct = require('immstruct');
var structure = immstruct.get('myStruct', { foo: 'Hello' });
```

### Parameters

| param    | type             | description                             |
| -------- | ---------------- | --------------------------------------- |
| `[key]`  | String           | _optional:_ - defaults to random string |
| `[data]` | Object,Immutable | _optional:_ - defaults to empty data    |



**Returns** `Structure`, 


### `immstruct.getInstances([name])`

Get list of all instances created.


### Parameters

| param    | type   | description                                                                |
| -------- | ------ | -------------------------------------------------------------------------- |
| `[name]` | String | _optional:_ - Name of the instance to get. If undefined get all instances  |



**Returns** `Array`, 


### `immstruct.clear`

Clear the entire list of `Structure` instances from the Immstruct
instance. You would do this to start from scratch, freeing up memory.

### Examples:

    var immstruct = require('immstruct');
    immstruct.clear();



### `immstruct.remove(key)`

Remove one `Structure` instance from the Immstruct instances list.
Provided by key

### Examples:

    var immstruct = require('immstruct');
    immstruct('myKey', { foo: 'hello' });
    immstruct.remove('myKey');


### Parameters

| param | type   | description |
| ----- | ------ | ----------- |
| `key` | String |             |



**Returns** `Boolean`, 


### `immstruct.withHistory([key], [limit], [data])`

Gets or creates a new instance of `Structure` with history (undo/redo)
activated per default. Same usage and signature as regular `Immstruct.get`.

Provide optional key to be able to retrieve it from list of instances.
If no key is provided, a random key will be generated.

Provide optional limit to cap the last number of history references
that will be kept. Once limit is reached, a new history record
shifts off the oldest record. The default if omitted is Infinity.
Setting to 0 is the as not having history enabled in the first place.

### Examples:

    var immstruct = require('immstruct');
    var structure = immstruct.withHistory('myStruct', 10, { foo: 'Hello' });
    var structure = immstruct.withHistory(10, { foo: 'Hello' });
    var structure = immstruct.withHistory('myStruct', { foo: 'Hello' });
    var structure = immstruct.withHistory({ foo: 'Hello' });


### Parameters

| param     | type             | description                             |
| --------- | ---------------- | --------------------------------------- |
| `[key]`   | String           | _optional:_ - defaults to random string |
| `[limit]` | Number           | _optional:_ - defaults to Infinity      |
| `[data]`  | Object,Immutable | _optional:_ - defaults to empty data    |



**Returns** `Structure`, 


### `immstruct([key], [data])`

This is a default instance of `Immstruct` as well as a shortcut for
creating `Structure` instances (See `Immstruct.get` and `Immstruct`).
This is what is returned from `require('immstruct')`.

From `Immstruct.get`:
Gets or creates a new instance of {Structure} in the default Immstruct
instance. A link to `immstruct.get()`. Provide optional
key to be able to retrieve it from list of instances. If no key
is provided, a random key will be generated.

### Examples:

    var immstruct = require('immstruct');
    var structure = immstruct('myStruct', { foo: 'Hello' });
    var structure2 = immstruct.withHistory({ bar: 'Bye' });
    immstruct.remove('myStruct');
    // ...


### Parameters

| param    | type             | description                             |
| -------- | ---------------- | --------------------------------------- |
| `[key]`  | String           | _optional:_ - defaults to random string |
| `[data]` | Object,Immutable | _optional:_ - defaults to empty data    |



**Returns** `Structure,Function`, 


### `Structure([options])`

Creates a new `Structure` instance. Also accessible through
`Immstruct.Structre`.

A structure is also an EventEmitter object, so it has methods as
`.on`, `.off`, and all other EventEmitter methods.

### Examples:

    var Structure = require('immstruct/structure');
    var s = new Structure({ data: { foo: 'bar' }});

    // Or:
    // var Structure = require('immstruct').Structure;

### Events

* `swap`: Emitted when cursor is updated (new information is set). Emits no
  values. One use case for this is to re-render design components. Callback
  is passed arguments: `newStructure`, `oldStructure`, `keyPath`.
* `next-animation-frame`: Same as `swap`, but only emitted on animation frame.
  Could use with many render updates and better performance. Callback is passed
  arguments: `newStructure`, `oldStructure`, `keyPath`.
* `change`: Emitted when data/value is updated and it existed before. Emits
  values: `newValue`, `oldValue` and `path`.
* `delete`: Emitted when data/value is removed. Emits value:  `removedValue` and `path`.
* `add`: Emitted when new data/value is added. Emits value: `newValue` and `path`.

### Options

```
{
  key: String, // Defaults to random string
  data: Object|Immutable, // defaults to empty Map
  history: Boolean, // Defaults to false
  historyLimit: Number, // If history enabled, Defaults to Infinity
}
```


### Parameters

| param       | type                                                                                   | description                                                                             |
| ----------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `[options]` | { key: <code>String</code>, data: <code>Object</code>, history: <code>Boolean</code> } | _optional:_ - defaults  to random key and empty data (immutable structure). No history
 |


### Properties

| property  | type             | description                     |
| --------- | ---------------- | ------------------------------- |
| `history` | Immutable.List   | `Immutable.List` with history.  |
| `current` | Object,Immutable | Provided data as immutable data |
| `key`     | String           | Generated or provided key. 
    |



**Returns** `Structure`, 


### `structure.cursor([path])`

Create a Immutable.js Cursor for a given `path` on the `current` structure (see `Structure.current`).
Changes made through created cursor will cause a `swap` event to happen (see `Events`).

**This method returns a
[Immutable.js Cursor](https://github.com/facebook/immutable-js/blob/master/contrib/cursor/index.d.ts).
See the Immutable.js docs for more info on how to use cursors.**

### Examples:

    var Structure = require('immstruct/structure');
    var s = new Structure({ data: { foo: 'bar', a: { b: 'foo' } }});
    s.cursor().set('foo', 'hello');
    s.cursor('foo').update(function () { return 'Changed'; });
    s.cursor(['a', 'b']).update(function () { return 'bar'; });

See more examples in the [tests](https://github.com/omniscientjs/immstruct/blob/master/tests/structure_test.js)


### Parameters

| param    | type         | description                                                                              |
| -------- | ------------ | ---------------------------------------------------------------------------------------- |
| `[path]` | String,Array | _optional:_ - defaults to empty string. Can be array for path. See Immutable.js Cursors  |



**Returns** `Cursor`, Gives a Cursor from Immutable.js


### `structure.reference([path|cursor])`

Creates a reference. A reference can be a pointer to a cursor, allowing
you to create cursors for a specific path any time. This is essentially
a way to have "always updated cursors" or Reference Cursors. See example
for better understanding the concept.

References also allow you to listen for changes specific for a path.

### Examples:

    var structure = immstruct({
      someBox: { message: 'Hello World!' }
    });
    var ref = structure.reference(['someBox']);

    var unobserve = ref.observe(function () {
      // Called when data the path 'someBox' is changed.
      // Also called when the data at ['someBox', 'message'] is changed.
    });

    // Update the data using the ref
    ref.cursor().update(function () { return 'updated'; });

    // Update the data using the initial structure
    structure.cursor(['someBox', 'message']).update(function () { return 'updated again'; });

    // Remove the listener
    unobserve();

See more examples in the [readme](https://github.com/omniscientjs/immstruct)


### Parameters

| param           | type                | description                                                                                                    |
| --------------- | ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `[path|cursor]` | String,Array,Cursor | _optional:_ - defaults to empty string. Can be array for path or use path of cursor. See Immutable.js Cursors
 |



**Returns** `Reference`, 


### `reference.observe([eventName], callback)`

Observe for changes on a reference. On references you can observe for changes,
but a reference **is not** an EventEmitter it self.

### Examples:

    var ref = structure.reference(['someBox']);

    var unobserve = ref.observe('delete', function () {
      // Called when data the path 'someBox' is removed from the structure.
    });

See more examples in the [readme](https://github.com/omniscientjs/immstruct)

### Events
* `swap`: Emitted when cursor is updated (new information is set).
  Emits no values. One use case for this is to re-render design components.
  Callback is passed arguments: `newStructure`, `oldStructure`, `keyPath`.
* `change`: Emitted when data/value is updated and it existed before.
  Emits values: `newValue`, `oldValue` and `path`.
* `delete`: Emitted when data/value is removed. Emits value:  `removedValue` and `path`.
* `add`: Emitted when new data/value is added. Emits value: `newValue` and `path`.



### Parameters

| param         | type     | description                                 |
| ------------- | -------- | ------------------------------------------- |
| `[eventName]` | String   | _optional:_ - Type of change                |
| `callback`    | Function | - Callback when referenced data is swapped  |



**Returns** `Function`, Function for removing observer (unobserve)


### `reference.cursor([subpath])`

Create a new, updated, cursor from the base path provded to the
reference. This returns a Immutable.js Cursor as the regular
cursor method. You can also provide a sub-path to create a reference
in a deeper level.

### Examples:

    var ref = structure.reference(['someBox']);
    var cursor = ref.cursor('someSubPath');
    var cursor2 = ref.cursor();

See more examples in the [readme](https://github.com/omniscientjs/immstruct)


### Parameters

| param       | type   | description                                  |
| ----------- | ------ | -------------------------------------------- |
| `[subpath]` | String | _optional:_ - Subpath to a deeper structure  |



**Returns** `Cursor`, Immutable.js cursor


### `reference.reference([path])`

Creates a reference on a lower level path. See creating normal references.

### Examples:

    var structure = immstruct({
      someBox: { message: 'Hello World!' }
    });
    var ref = structure.reference('someBox');

    var newReference = ref.reference('message');

See more examples in the [readme](https://github.com/omniscientjs/immstruct)


### Parameters

| param    | type         | description                                                                              |
| -------- | ------------ | ---------------------------------------------------------------------------------------- |
| `[path]` | String,Array | _optional:_ - defaults to empty string. Can be array for path. See Immutable.js Cursors  |



**Returns** `Reference`, 


### `reference.unobserveAll`

Remove all observers from reference.



**Returns** `Void`, 


### `reference.destroy`

Destroy reference. Unobserve all observers, set all endpoints of reference to dead.
For cleaning up memory.



**Returns** `Void`, 


### `structure.forceHasSwapped(newData, oldData, keyPath)`

Force emitting swap event. Pass on new, old and keypath passed to swap.
If newData is `null` current will be used.


### Parameters

| param     | type   | description                                               |
| --------- | ------ | --------------------------------------------------------- |
| `newData` | Object | - Immutable object for the new data to emit               |
| `oldData` | Object | - Immutable object for the old data to emit               |
| `keyPath` | String | - Structure path (in tree) to where the changes occured.  |



**Returns** `Void`, 


### `structure.undo(steps)`

Undo IFF history is activated and there are steps to undo. Returns new current
immutable structure.

**Will NOT emit swap when redo. You have to do this yourself**.

Define number of steps to undo in param.


### Parameters

| param   | type   | description                |
| ------- | ------ | -------------------------- |
| `steps` | Number | - Number of steps to undo  |



**Returns** `Object`, New Immutable structure after undo


### `structure.redo(head)`

Redo IFF history is activated and you can redo. Returns new current immutable structure.
Define number of steps to redo in param.
**Will NOT emit swap when redo. You have to do this yourself**.


### Parameters

| param  | type   | description                           |
| ------ | ------ | ------------------------------------- |
| `head` | Number | - Number of steps to head to in redo  |



**Returns** `Object`, New Immutable structure after redo


### `structure.undoUntil(structure)`

Undo IFF history is activated and passed `structure` exists in history.
Returns the same immutable structure as passed as argument.

**Will NOT emit swap after undo. You have to do this yourself**.


### Parameters

| param       | type   | description                          |
| ----------- | ------ | ------------------------------------ |
| `structure` | Object | - Immutable structure to redo until  |



**Returns** `Object`, New Immutable structure after undo

## Private members 


