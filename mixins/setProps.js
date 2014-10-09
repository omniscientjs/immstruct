module.exports = {
  setProps: function (obj) {
    this.props.cursor.update(function (state) {
      return state.mergeDeep(obj);
    });
  }
};
