structure.js
===

Experimental project for having top-to-bottom rerender of global
state in Reac.js using Immutable.js.

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


## Goal

Achieve something like the following

```js
var structure = require('immstruct')('myKey');

var App = React.createClass({
  mixins: [require('immstruct/mixins/setProps')],

  componentDidMount: function () {
    this.setProps({
      value: 'foo'
    });
  },

  render: function() {
    return React.DOM.h1(null,
      this.props.cursor.get('value')
    );
  }
});

var body = document.querySelector('body');
function render () {
  console.log('Render');
  React.renderComponent(App({ cursor: structure.cursor(['app']) }), body);
}

render();
structure.on('render', render);
```
