import _ from 'lodash';

class Matrix {
  constructor (size = 1, defaultValue=0) {
    if (size <= 0 || !size) {
      throw new Error(`Matrix: constructor: Invalid size: ${size}`);
    }
    this._defaultValue = defaultValue;
    this._size = size;
    this._data = {};
  }

  get size () {
    return this._size;
  }

  get (rowIndex, colIndex) {
    this._checkIndexExistance(rowIndex, colIndex);
    return _.get(this._data, [rowIndex, colIndex], this._defaultValue);
  }

  set (rowIndex, colIndex, value) {
    this._checkIndexExistance(rowIndex, colIndex);
    if (value === this._defaultValue) {
      if (_.has(this._data, [rowIndex, colIndex])) {
        delete this._data[rowIndex][colIndex];
      }
      if (_.isEmpty(this._data[rowIndex])) {
        delete this._data[rowIndex];
      }
    } else {
      if (!this._data[rowIndex]) {
        this._data[rowIndex] = {};
      }
      this._data[rowIndex][colIndex] = value;
    }
    return value;
  }

  getRowCoverage (rowIndex) {
    this._checkIndexExistance(rowIndex, 0);
    return Object.keys(_.get(this._data, rowIndex, {})).map(Number);
  }

  getCoverage () {
    return Object.keys(this._data).map(Number);
  }

  setData (data) {
    if (data.length !== this._size) {
      throw new Error(`Matrix: setData: Invalid data size: ${data.length}. Expected: ${this._size}`);
    }
    data.forEach((row, rowIndex) => {
      if (row.length !== this._size) {
        throw new Error(`Matrix: setData: Invalid data item size: ${row.length}. Expected: ${this._size}`);
      }
      row.forEach((value, colIndex) => this.set(rowIndex, colIndex, value));
    });
  }

  _checkIndexExistance (rowIndex, colIndex) {
    if (rowIndex < 0 || colIndex < 0 || rowIndex >= this._size || colIndex >= this._size) {
      throw new Error('Matrix: get: Invalid index');
    }
    return true;
  }

  sumOverall () {
    let sum = 0;
    _.forEach(this._data, (row) => {
      if (row) {
        _.forEach(row, (value) => (sum += value));
      }
    });
    return sum;
  }

  selfValues2x2 () {
    const A = this.get(0, 0)*this.get(0, 0) + this.get(0, 1)*this.get(0, 1);
    const B = this.get(0, 0)*this.get(1, 0) + this.get(0, 1)*this.get(1, 1);
    const C = this.get(1, 0)*this.get(1, 0) + this.get(1, 1)*this.get(1, 1);
    const D = Math.sqrt((A - C)*(A - C) + 4*B*B);
    const l1 = Math.abs((-A-C-D)/2);
    const l2 = Math.abs((-A-C+D)/2);

    return 0.5*Math.log(Math.max(l1, l2));
  }
}

export default Matrix;
