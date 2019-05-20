import { assert } from 'chai';

import Graph from '../../../../src/server/lib/math/graph';

describe('Graph', () => {

  describe('constructor', () => {
    let graph;
    let graphSize;
    beforeEach(() => {
      graphSize = Math.round(Math.random() * 1000);
      graph = new Graph({ size: graphSize });
    });
  });
});
