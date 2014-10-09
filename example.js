var structure = require('./')({
  a: {
    b: {
      c: 1
    }
  }
});

console.log('Created structure with key:', structure.key);

// or key if already set:
// var structure = require('./')('key');



var cursor = structure.cursor(['a', 'b', 'c']);

// Same for 'update', 'create' and 'delete'
structure.on('update', function (url, obj) {
  console.log('Updated', url, obj);

  // Check if we want to do some ajax?
  // ajax({
  //   verb: 'updated',
  //   url: url,
  //   payload: obj
  // });
});

structure.on('render', function (url, obj) {
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
