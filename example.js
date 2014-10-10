var immstruct = require('./');

var structure = immstruct({
  a: {
    b: {
      c: 1
    }
  }
});

console.log('Created structure with key:', structure.key);

// or key if already set:
// var structure = immstruct('key');


var cursor = structure.cursor(['a', 'b', 'c']);

// When a sub-tree has been altered in some way.
// Same for 'change', 'add' and 'delete'
structure.on('change', function (url, obj) {
  console.log('Updated', url, obj);

  // Check if we want to do some ajax?
  // ajax({
  //   verb: 'updated',
  //   url: url,
  //   payload: obj
  // });
});

// When the structure it self is swaped
structure.on('swap', function (url, obj) {
  console.log('Render new components');
  // e.g.
  // React.renderComponent(
  //   App(structure.current().toJS()),
  //   document.querySelector('body')
  // );
});

console.log(cursor.deref());
cursor = cursor.update(function (x) {
  return x + 1;
});
console.log(cursor.deref());
