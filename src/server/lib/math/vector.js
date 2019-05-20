class Vector {
  constructor (size, defaultValue = 0) {
    this._size = size;
    this._defaultValue = defaultValue;
    this._data = {};
  }

  get (index) {
    if (!Object.keys(this._data).map(Number).includes(index)) {
      return this._defaultValue;
    }
    return this._data[index];
  }

  set (index, value) {
    if (value === this._defaultValue) {
      if (Object.keys(this._data).map(Number).includes(index)) {
        delete this._data[index];
        return;
      }
    }
    this._data[index] = value;
  }
}

export default Vector;
