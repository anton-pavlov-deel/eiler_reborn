import _ from 'lodash';
import { assert } from 'chai';

import Matrix from '../../../../src/server/lib/math/matrix.js';

let matrixSize;
let matrix;

let testIndex1;
let testIndex2;
let testIndex3;

let testValue;

describe('Matrix', () => {
  beforeEach(() => {
    matrixSize = Math.round(Math.random() * 1000);
    matrix = new Matrix(matrixSize);

    testIndex1 = Math.round(matrixSize/2);
    testIndex2 = matrixSize - 1;
    testIndex3 = 0;

    testValue = Math.random() * 10;

    matrix._data[testIndex1] = { [testIndex2]: testValue };
  });

  describe('constructor', () => {
    it('should set specified size', () => {
      assert.equal(matrixSize, matrix._size);
    });

    it('should set default size(= 1) if size arg isnt specified', () => {
      const emptyMatrix = new Matrix();
      assert.equal(1, emptyMatrix._size);
    });

    it('should define empty data object', () => {
      const emptyMatrix = new Matrix();
      assert.deepEqual({}, emptyMatrix._data);
    });

    it('should throw error if specified size <= 0', () => {
      assert.throws(() => new Matrix(-1), 'Matrix: constructor: Invalid size: -1');
      assert.throws(() => new Matrix(0), 'Matrix: constructor: Invalid size: 0');
    });
  });

  describe('get', () => {
    it('should return the value if it was setted before', () => {
      assert.equal(testValue, matrix.get(testIndex1, testIndex2));
    });

    it('should return 0 if value was not setted', () => {
      assert.equal(0, matrix.get(testIndex1, testIndex3));
    });
  });

  describe('set', () => {
    it('should set the value', () => {
      matrix.set(testIndex1, testIndex3, testValue);
      assert.equal(testValue, matrix.get(testIndex1, testIndex3));
    });

    it('should delete data instance if setted 0', () => {
      matrix.set(testIndex1, testIndex2, 0);
      assert.equal(undefined, _.get(matrix._data, [testIndex1, testIndex2], undefined));
    });

    it('should correctly set 0 if value is 0 already', () => {
      matrix.set(testIndex3, testIndex2, 0);
      assert.equal(undefined, _.get(matrix._data, [testIndex3, testIndex2], undefined))
    });
  });

  describe('getRowCoverage', () => {
    it('should return columns indexes which non-zero in row', () => {
      assert.deepEqual([`${testIndex2}`], matrix.getRowCoverage(testIndex1));
      matrix.set(testIndex1, testIndex3, testValue);
      assert.deepEqual([`${testIndex2}`, `${testIndex3}`].sort(), matrix.getRowCoverage(testIndex1).sort());
      assert.deepEqual([], matrix.getRowCoverage(testIndex3));
    });
  });

  describe('setData', () => {
    it('should set provided data', () => {
      const testMatrixData = [
        [1,0,0,0],
        [0,2,0,0],
        [0,0,0,3],
        [0,0,7,0],
      ];
      const testMatrix = new Matrix(testMatrixData.length);
      testMatrix.setData(testMatrixData);

      assert.equal(testMatrix.get(0, 0), 1);
      assert.equal(testMatrix.get(1, 1), 2);
      assert.equal(testMatrix.get(2, 3), 3);
      assert.equal(testMatrix.get(3, 2), 7);
      assert.equal(testMatrix.get(1, 3), 0);
    });
  });

  describe('_checkIndexExistance', () => {
    it('should throw error if rowIndex < 0', () => {
      assert.throws(() => matrix._checkIndexExistance(-1, matrixSize - 1),
        'Matrix: get: Invalid index');
    });

    it('should throw error if colIndex < 0', () => {
      assert.throws(() => matrix._checkIndexExistance(matrixSize - 1, -1),
        'Matrix: get: Invalid index');
    });

    it('should throw error if colIndex >= matrixSize', () => {
      assert.throws(() => matrix._checkIndexExistance(matrixSize - 1, matrixSize),
        'Matrix: get: Invalid index');
    });

    it('should throw error if rowIndex >= matrixSize', () => {
      assert.throws(() => matrix._checkIndexExistance(matrixSize, matrixSize - 1),
        'Matrix: get: Invalid index');
    });

    it('should return true if all is ok', () => {
      assert.equal(true, matrix._checkIndexExistance(matrixSize - 1, matrixSize - 1));
    });
  });
});
