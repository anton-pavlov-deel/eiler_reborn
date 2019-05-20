import _ from 'lodash';
import Matrix from './matrix';
import Vector from './vector';

import CacheApi from '../../api/CacheApi';

class Graph {
  constructor ({ size, incidentMatrix, weights }) {
    if (!size || size <= 0) {
      throw new Error(`Graph: constructor: Invalid size: ${size}`);
    }
    this._size = size;
    this._vertices = {};
    this._components = [];
    this._weights = weights || {};
    this._cacheMMC = new CacheApi();

    if (incidentMatrix && incidentMatrix.size !== size) {
      throw new Error(`Graph: constructor: invalid size of incident matrix: ${incidentMatrix.size}. Expected: ${size}`);
    }

    if (incidentMatrix) {
      const coverage = incidentMatrix.getCoverage();
      coverage.forEach((vertex) => {
        this._vertices[vertex] = incidentMatrix.getRowCoverage(vertex);
      });
    }
  }

  get size () {
    return this._size;
  }

  reconstruct (size) {
    if (!size || size <= 0) {
      throw new Error(`Graph: reconstruct: Invalid size: ${size}`);
    }

    delete this._size;
    delete this._vertices;
    delete this._components;
    delete this._weights;

    this._size = size;
    this._vertices = {};
    this._components = [];
    this._weights = {};
  }

  setWeight (vertex, weight) {
    this._checkVertexExistance(vertex);
    this._weights[vertex] = weight;
  }

  getWeight (vertex) {
    this._checkVertexExistance(vertex);
    return this._weights[vertex];
  }

  getWeights (verticesList) {
    if (!verticesList) {
      return Object.values(this._weights);
    }
    return verticesList.map((vertex) => (this._weights[vertex] || 0));
  }

  getEdges (vertex) {
    this._checkVertexExistance(vertex);
    return this._vertices[vertex] || [];
  }

  getIncidentMatrix (verticesList) {
    let size = this._size;
    if (verticesList && Array.isArray(verticesList)) {
      size = verticesList.length;
    }
    const resultMatrix = new Matrix(size);

    if (verticesList) {
      verticesList.forEach((origin, originIndex) => {
        if (this._vertices[origin]) {
          this._vertices[origin].forEach((target) => {
            const targetIndex = verticesList.indexOf(target);
            if (targetIndex !== -1) {
              resultMatrix.set(originIndex, targetIndex, 1);
            }
          });
        }
      });
      return resultMatrix;
    }

    _.forEach(this._vertices, (edges, origin) => {
      _.forEach(edges, (target) => {
        resultMatrix.set(origin, target, 1);
      });
    });
    return resultMatrix;
  }

  addEdge (origin, target) {
    this._checkVertexExistance(origin);
    this._checkVertexExistance(target);

    if (!this._vertices[origin]) {
      this._vertices[origin] = [];
    }
    if (!this._vertices[origin].includes(target)) {
      this._vertices[origin].push(target);
      return true;
    }
    return false;
  }

  removeEdge (origin, target) {
    this._checkVertexExistance(origin);
    if (!this._vertices[origin]) {
      return false;
    }

    const targetIndex = this._vertices[origin].indexOf(target);
    if (targetIndex === -1) {
      return false;
    }

    delete this._vertices[origin].splice(targetIndex, 1);
    if (!this._vertices[origin].length) {
      delete this._vertices[origin];
    }
    return true;
  }

  getSubgraph (verticesList) {
    if (verticesList.some((vertex) => !this._checkVertexExistance(vertex))) {
      throw new Error(`Graph: getSubgraph: Invalid vertices list: ${verticesList}`);
    }
    const incidentMatrix = this.getIncidentMatrix(verticesList);
    const weights = this.getWeights(verticesList);
    return new Graph({
      size: incidentMatrix.size,
      incidentMatrix,
      weights,
    });
  }

  getRevertEdges () {
    const result = {};
    _.forEach(this._vertices, (vertices, origin) => {
      _.forEach(vertices, (target) => {
        if (!result[target]) {
          result[target] = [];
        }
        result[target].push({
          from: origin,
          weight: this._weights[origin] || 0,
        });
      });
    });
    return result;
  }

  _checkVertexExistance (vertex) {
    if (vertex < 0 || vertex >= this._size) {
      throw new Error(`Graph: Invalid vertex ${vertex}. Expected: 0-${this._size - 1}`);
    }
    return true;
  }

  async findMMCValue () {
    const size = this._size;
    const edges = this.getRevertEdges();
    const M = new Array(size).fill(null);
    const MM = new Array(size).fill(null);
    const dp = new Matrix(size + 1, null);
    const dpM = new Matrix(size + 1, null);
    dp.set(0, 0, 0);
    dpM.set(0, 0, 0);

    for (let i = 1; i <= size; i++) {
      if (i % 100 === 0) {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`MMC STEP: DP(${i}/${size}) (Memory usage: ${Math.round(used * 100) / 100} MB)`);
      }
      for (let j = 0; j < size; j++) {
        if (edges[j]) {
          for (let edge of edges[j]) {
            if (dp.get(i-1, edge.from) !== null) {
              const newWeight = edge.weight + dp.get(i-1, edge.from);
              const newWeightM = dpM.get(i-1, edge.from) - edge.weight;

              if (dp.get(i, j) === null) {
                dp.set(i, j, newWeight);
                dpM.set(i, j, newWeightM);
              } else {
                dp.set(i, j, Math.min(newWeight, dp.get(i, j)));
                dpM.set(i, j, Math.min(newWeightM, dpM.get(i, j)));
              }
            }
          }
        }
      }
    }

    for (let j = 0; j < size; j++) {
      const longestWay = dp.get(size, j);
      const longestWayM = dpM.get(size, j);
      if (j % 100 === 0) {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`MMC STEP: LONGEST WAY(${j}/${size}) (Memory usage: ${Math.round(used * 100) / 100} MB)`);
      }
      if (longestWay !== null) {
        for (let i = 0; i < size; i++) {
          const thisWay = dp.get(i, j);
          const thisWayM = dpM.get(i, j);

          if (thisWay !== null) {
            const currentWayValue = (longestWay - thisWay)/(size - i);
            const currentWayValueM = (longestWayM - thisWayM)/(size - i);
            if (M[j] === null) {
              M[j] = currentWayValue;
              MM[j] = currentWayValueM;
            } else {
              M[j] = Math.max(M[j], currentWayValue);
              MM[j] = Math.max(MM[j], currentWayValueM);
            }
          }
        }
      }
    }

    return {
      min: {
        value: Math.min(...M.filter(num => num !== null)),
      },
      max: {
        value: (-1)*Math.min(...MM.filter(num => num !== null)),
      },
    };
  }

  async findMMCValueRedis () {
    const size = this._size;
    const edges = this.getRevertEdges();
    const M = new Array(size).fill(null);
    const MM = new Array(size).fill(null);
    const dpCache = this._cacheMMC.newCache();
    const dpMCache = this._cacheMMC.newCache();
    // const dp = new Matrix(size + 1, null);
    // const dpM = new Matrix(size + 1, null);

    this._cacheMMC.set(dpCache, '0:0', 0);
    this._cacheMMC.set(dpMCache, '0:0', 0);
    // dp.set(0, 0, 0);
    // dpM.set(0, 0, 0);

    for (let i = 1; i <= size; i++) {
      if (i % 100 === 0) {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`MMC STEP: DP(${i}/${size}) (Memory usage: ${Math.round(used * 100) / 100} MB)`);
      }
      for (let j = 0; j < size; j++) {
        if (edges[j]) {
          for (let edge of edges[j]) {
            // if (dp.get(i-1, edge.from) !== null) {
            const weight1 = await this._cacheMMC.get(dpCache, `${i-1}:${edge.from}`);
            const weightM1 = await this._cacheMMC.get(dpCache, `${i-1}:${edge.from}`);
            if (weight1 !== null) {
              // const newWeight = edge.weight + dp.get(i-1, edge.from);
              // const newWeightM = dpM.get(i-1, edge.from) - edge.weight;
              const newWeight = edge.weight + weight1;
              const newWeightM = weightM1 - edge.weight;

              // if (dp.get(i, j) === null) {
              //   dp.set(i, j, newWeight);
              //   dpM.set(i, j, newWeightM);
              // } else {
              //   dp.set(i, j, Math.min(newWeight, dp.get(i, j)));
              //   dpM.set(i, j, Math.min(newWeightM, dpM.get(i, j)));
              // }
              const weight2 = (await this._cacheMMC.get(dpCache, `${i}:${j}`));
              const weightM2 = (await this._cacheMMC.get(dpMCache, `${i}:${j}`));
              if (weight2 === null) {
                // dp.set(i, j, newWeight);
                // dpM.set(i, j, newWeightM);
                await this._cacheMMC.set(dpCache, `${i}:${j}`, newWeight);
                await this._cacheMMC.set(dpMCache, `${i}:${j}`, newWeightM);
              } else {
                // dp.set(i, j, Math.min(newWeight, dp.get(i, j)));
                // dpM.set(i, j, Math.min(newWeightM, dpM.get(i, j)));
                await this._cacheMMC.set(dpCache, `${i}:${j}`, Math.min(newWeight, weight2));
                await this._cacheMMC.set(dpMCache, `${i}:${j}`, Math.min(newWeight, weightM2));
              }
            }
          }
        }
      }
    }

    for (let j = 0; j < size; j++) {
      // const longestWay = dp.get(size, j);
      // const longestWayM = dpM.get(size, j);
      const longestWay = this._cacheMMC.get(dpCache, `${size}:${j}`);
      const longestWayM = this._cacheMMC.get(dpMCache, `${size}:${j}`);
      if (j % 100 === 0) {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`MMC STEP: LONGEST WAY(${j}/${size}) (Memory usage: ${Math.round(used * 100) / 100} MB)`);
      }
      if (longestWay !== null) {
        for (let i = 0; i < size; i++) {
          // const thisWay = dp.get(i, j);
          // const thisWayM = dpM.get(i, j);
          const thisWay = this._cacheMMC.get(dpCache, `${i}:${j}`);
          const thisWayM = this._cacheMMC.get(dpMCache, `${i}:${j}`);

          if (thisWay !== null) {
            const currentWayValue = (longestWay - thisWay)/(size - i);
            const currentWayValueM = (longestWayM - thisWayM)/(size - i);
            if (M[j] === null) {
              M[j] = currentWayValue;
              MM[j] = currentWayValueM;
            } else {
              M[j] = Math.max(M[j], currentWayValue);
              MM[j] = Math.max(MM[j], currentWayValueM);
            }
          }
        }
      }
    }

    return {
      min: {
        value: Math.min(...M.filter(num => num !== null)),
      },
      max: {
        value: (-1)*Math.min(...MM.filter(num => num !== null)),
      },
    };
  }

  _findSCCIter1 (log=true, callback) {
    const visited = Array(this._size).fill(false);
    const lowLink = Array(this._size).fill(this._size);
    const isRoot = Array(this._size).fill(true);
    const stack = [];
    const returnStack = [];
    let step = 0;
    let visitedCount = 0;
    let next = 0;

    for (let u = 0; u < this.size; u++) {
      next = u;
      if (!visited[next]) {
        dfsLoop: while (true) {
          if (!visited[next]) {
            lowLink[next] = step;
            visited[next] = true;
            stack.push(next);
            step += 1;
            visitedCount += 1;
            if (visitedCount % 1000 === 0 && log) {
              const used = process.memoryUsage().heapUsed / 1024 / 1024;
              console.log(`SCC: ${visitedCount}/${this._size} (Memory usage: ${Math.round(used * 100) / 100} MB)`);
            }
          }

          for (var v of this.getEdges(next)) {
            if (!visited[v]) {
              returnStack.push(next);
              next = v;
              continue dfsLoop;
            }
            if (lowLink[next] > lowLink[v]) {
              lowLink[next] = lowLink[v];
              isRoot[next] = false;
            }
          }

          if (isRoot[next]) {
            const component = [];
            while (1) {
              const nextItem = stack.pop();
              component.push(nextItem);
              lowLink[nextItem] = this._size;
              if (nextItem === next) {
                break;
              }
            }
            let correctComponent = true;
            if (component.length === 1) {
              correctComponent = this.getEdges(component[0]).includes(component[0]);
            }
            if (correctComponent) {
              if (callback) {
                callback(component);
              } else {
                this._components.push(component);
              }
            }
          }

          next = returnStack.pop();
          if (next === undefined) {
            break;
          }
          continue dfsLoop;
        }
      }
    }
  }

  _getActiveVertices () {
    let activeVertices = Object.keys(this._vertices).map(Number);

    return Object.values(this._vertices)
      .reduce((res, edges) => _.union(res, edges), activeVertices)
      .sort();
  }

  _findSCCIter (log=true, callback) {
    const notIsolated = this._getActiveVertices();
    const visited = {};//Array(this._size).fill(false);
    const lowLink = {};//Array(this._size).fill(this._size);
    const isRoot = {};//Array(this._size).fill(true);
    const stack = [];
    const returnStack = [];
    let step = 0;
    let visitedCount = 0;
    let next = 0;

    notIsolated.forEach((vertix) => {
      visited[vertix] = false;
      lowLink[vertix] = this._size;
      isRoot[vertix] = true;
    });

    for (let u = 0; u < notIsolated.length; u++) {
      next = notIsolated[u];
      if (!visited[next]) {
        dfsLoop: while (true) {
          if (!visited[next]) {
            lowLink[next] = step;
            visited[next] = true;
            stack.push(next);
            step += 1;
            visitedCount += 1;
            if (visitedCount % 1000 === 0 && log) {
              const used = process.memoryUsage().heapUsed / 1024 / 1024;
              console.log(`SCC: ${visitedCount}/${notIsolated.length} (Memory usage: ${Math.round(used * 100) / 100} MB)`);
            }
          }

          for (var v of this.getEdges(next)) {
            if (!visited[v]) {
              returnStack.push(next);
              next = v;
              continue dfsLoop;
            }
            if (lowLink[next] > lowLink[v]) {
              lowLink[next] = lowLink[v];
              isRoot[next] = false;
            }
          }

          if (isRoot[next]) {
            const component = [];
            while (1) {
              const nextItem = stack.pop();
              component.push(nextItem);
              lowLink[nextItem] = this._size;
              if (nextItem === next) {
                break;
              }
            }
            let correctComponent = true;
            if (component.length === 1) {
              correctComponent = this.getEdges(component[0]).includes(component[0]);
            }
            if (correctComponent) {
              if (callback) {
                callback(component);
              } else {
                this._components.push(component);
              }
            }
          }

          next = returnStack.pop();
          if (next === undefined) {
            break;
          }
          continue dfsLoop;
        }
      }
    }
  }
}

export default Graph;
