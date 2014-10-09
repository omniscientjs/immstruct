structure.js
===

Experimental project for having top-to-bottom rerender of global
state in React.js using Immutable.js.

```js
// someFile.js
var structure = require('immstruct')('myKey', {
  a: {
    b: {
      c: 1
    }
  }
});

structure.on('render', function (url, obj) {
  console.log('Render new components');
  // e.g.
  // React.renderComponent(
  //   App(structure.current().toJS()),
  //   document.querySelector('body')
  // );
});

var cursor = structure.cursor(['a', 'b', 'c']).update(function (x) {
  return x + 1;
});

console.log(cursor.deref()); //=> 2
```


```js
// anotherFile.js
var structure = require('immstruct')('myKey');

var cursor = structure.cursor(['a', 'b', 'c']);
cursor = cursor.update(function (x) {
  return x + 1;
});

console.log(cursor.deref()); //=> 3
```
