import Graph from './graph';
import Matrix from './matrix';
import MathFunction from './mathFunction';

const defaultImageConfig = {
  innerGridSize: 10,
  projectiveLayers: 10,
};

class SymbolicImage extends Graph {
  constructor (config) {
    super({ size: config.width*config.height });
    this._image = {
      x: new MathFunction(config.xFunction),
      y: new MathFunction(config.yFunction),
    };
    this._d = config.diameter;
    this._startX = config.startX;
    this._startY = config.startY;
    this._width = config.width;
    this._height = config.height;
    this._imageConfig = config.imageConfig || defaultImageConfig;
    this._targetVersion = config.iterations || 0;
    this._api = config.api;
    this._name = config.name || 'default';
    this._version = 0;
    this._itemsToLocalize = [];
    this._maxComponent = [];
    this._components = [];
    this._dAngle = Math.PI/this._imageConfig.projectiveLayers;
    this._slicedOnProjective = false;

    this._extra = {
      weights: (
        config.extra.weights
        || config.extra.mmc
        || false
      ),
      mmc: (
        config.extra.mmc
        || false
      ),
      projectiveSlice: (
        config.extra.projectiveSlice
        || false
      ),
    };

    this._api.updateMetadata(this._name, {
      targetVersion: this._targetVersion,
      name: this._name,
    });
  }

  async _startLocalizationProcess () {
    if (this._targetVersion < 0 || Number.isNaN(this._targetVersion) || !Number.isInteger(this._targetVersion)) {
      throw new Error(`SymbolicImage: _startLocalizationProcess: Invalid target version: ${this._targetVersion}`);
    }

    await this._buildFullImage();
    while (this._version < this._targetVersion) {
      await this._localize();
    }
    await this._runExtra();
    return true;
  }

  async _localize () {
    this._d = this._d/2;
    this._width = this._width*2;
    this._height = this._height*2;
    this._version += 1;

    this.reconstruct(this._width*this._height);
    await this._buildFullImage();
    console.log(`SymbolicImage: successfully localized`);
  }

  async _projectiveSlice () {
    this._slicedOnProjective = true;

    this.reconstruct(this._width*this._height*this._imageConfig.projectiveLayers);
    await this._buildFullImage();
  }

  _buildItemImage (item) {
    const step = this._d/(this._imageConfig.innerGridSize + 1);
    const angleStep = this._dAngle/(this._imageConfig.innerGridSize + 1);
    for (let row = 1; row <= this._imageConfig.innerGridSize; row += 1 ) {
      for (let col = 1; col <= this._imageConfig.innerGridSize; col += 1) {
        if (this._slicedOnProjective) {
          for (let layer = 1; layer <= this._imageConfig.innerGridSize; layer += 1) {
            const originX = item.startX + step*col;
            const originY = item.startY + step*row;
            const dot = { x: originX, y: originY };
            const originAngle = item.angle + angleStep*layer;
            const originCos = Math.cos(originAngle);
            const originSin = Math.sin(originAngle);

            const imageX = this._image.x.evaluate({ x: originX, y: originY });
            const imageY = this._image.y.evaluate({ x: originX, y: originY });

            const targetCos = this._image.x.derivativeBy('x', dot)*originCos + this._image.x.derivativeBy('y', dot)*originSin;
            const targetSin = this._image.y.derivativeBy('x', dot)*originCos + this._image.y.derivativeBy('y', dot)*originSin;
            const targetNorm = Math.sqrt(targetCos**2 + targetSin**2);
            const targetAngle = this._normalizeAngle(Math.atan(targetSin/targetCos));

            const imageItem = this.getItemByCoordinates({ x: imageX, y: imageY, angle: targetAngle });

            if (imageItem) {
              if ((!this._restItems.includes(imageItem.id))) {
                continue;
              }
              this.addEdge(item.id, imageItem.id);
            }
          }
        } else {
          const originX = item.startX + step*col;
          const originY = item.startY + step*row;
          const imageX = this._image.x.evaluate({ x: originX, y: originY });
          const imageY = this._image.y.evaluate({ x: originX, y: originY });
          const imageItem = this.getItemByCoordinates({ x: imageX, y: imageY });
          if (imageItem) {
            if ((this._version !== 0) && (!this._itemsToLocalize.includes(imageItem.id))) {
              continue;
            }
            this.addEdge(item.id, imageItem.id);
          }
        }
      }
    }
  }

  async _buildFullImage (log = true) {
    if (this._version === 0) {
      await this._api.newImage(this._name);
    } else {
      await this._api.deleteImageItems(this._name);
    }

    if (this._slicedOnProjective) {
      await this._api.deleteImageItems(this._name);
    }

    if (this._slicedOnProjective) {
      const itemsCount = this._restItems.length;
      this._restItems.forEach((itemId, index) => {
        this._buildItemImage(this.getItemById(itemId));
        if (log && (index%100 === 0)) {
          const used = process.memoryUsage().heapUsed / 1024 / 1024;
          console.log(`SymbolicImage: BuildImage (Projective slice): ${index}/${itemsCount} (Memory usage: ${Math.round(used * 100) / 100} MB)`);
        }
      });
    } else if (this._version === 0) {
      for (let i = 0; i < this._size; i++) {
        this._buildItemImage(this.getItemById(i));
        if (log && (i%10000 === 0)) {
          const used = process.memoryUsage().heapUsed / 1024 / 1024;
          console.log(`SymbolicImage: BuildImage: ${i}/${this._size} (Memory usage: ${Math.round(used * 100) / 100} MB)`);
        }
      }
    } else {
      const itemsCount = this._itemsToLocalize.length;
      this._itemsToLocalize.forEach((itemId, index) => {
        this._buildItemImage(this.getItemById(itemId));
        if (log && (index%10000 === 0)) {
          const used = process.memoryUsage().heapUsed / 1024 / 1024;
          console.log(`SymbolicImage: BuildImage (iteration #${this._version}): ${index}/${itemsCount} (Memory usage: ${Math.round(used * 100) / 100} MB)`);
        }
      });
    }

    delete this._itemsToLocalize;
    this._itemsToLocalize = [];

    delete this._restItems;
    delete this._components;
    this._restItems = [];
    this._components = [];

    this._findSCCIter(true, (component) => {
      component.forEach((itemId) => {
        this._itemsToLocalize.push(...this._getLocalizedItemIds(itemId));
      });
      for (let i = 0; i < this._imageConfig.projectiveLayers; i += 1) {
        this._restItems.push(...component.map((itemId) => (itemId + this._width*this._height*i)));
      }
      if (component.length > this._maxComponent.length) {
        this._maxComponent = component;
      }
      this._components.push(component);
      this._api.updateMetadata(this._name, {
        components: this._components,
      });
      this._api.addImageItems(
        this._name,
        component.map((item) => this.getItemById(item))
      );
    });
  }

  async _runExtra () {
    console.log('SymbolicImage: Start extra tasks');

    if (this._extra.projectiveSlice) {
      console.log('>\n SymbolicImage: Extra(Projective slice): Started');
      await this._projectiveSlice();
      console.log('SymbolicImage: Extra(Projective slice): Finished');
    }

    if (this._extra.weights) {
      console.log('>\n SymbolicImage: Extra(Weights): Started');
      if (!this._maxComponent.length) {
        throw new Error('SymbolicImage: Extra(Weights): There are no max component found');
      }
      this._components.forEach((component) => component.forEach((itemId) => this.applyImageWeight(this.getItemById(itemId))));
      this._api.updateMetadata(this._name, {
        weights: this._weights,
      });
      console.log('SymbolicImage: Extra(Weights): Finished');
    }

    if (this._extra.mmc) {
      console.log('>\n SymbolicImage: Extra(MMC): Started');
      this._components.forEach((component, index) => {
        const componentSubgraph = this.getSubgraph(component);
        console.log(component);
        componentSubgraph.findMMCValue()
          .then((resultMmc) => {
            this._api.updateMetadata(this._name, {
              [`mmc${index}`]: resultMmc,
            });
          });
      });
      console.log('SymbolicImage: Extra(MMC): Finished');
    }

    console.log('SymbolicImage: Finished extra tasks');
  }

  _getLocalizedItemIds (itemId) {
    const W = this._width*2;
    const localizedItems = [];

    localizedItems.push(2*(itemId%this._width + W*Math.floor(itemId/this._width)));
    localizedItems.push(localizedItems[0] + 1);
    localizedItems.push(localizedItems[0] + W);
    localizedItems.push(localizedItems[0] + W + 1);

    return localizedItems;
  }

  getItemById (id) {
    const layerSize = this._width*this._height;
    const startX = this._startX + this._d*(id%this._width);
    const startY = this._startY + this._d*(Math.floor(id/this._width)%this._height);
    const angle = this._dAngle*Math.floor(id/layerSize);
    return {
      id,
      startX,
      startY,
      angle,
      d: this._d,
    };
  }

  getItemByCoordinates ({ x, y, angle=0 }) {
    const endX = this._startX + this._width*this._d;
    const endY = this._startY + this._height*this._d;
    const normalizedAngle = this._normalizeAngle(angle);
    let index = 0;
    let dx;
    let dy;
    let dAngle;

    if (x < this._startX || y < this._startY || x > endX || y > endY) {
        return null;
    }

    for (dx = this._startX + this._d; dx < endX; dx += this._d) {
      if (dx > x) {
        break;
      }
      index += 1;
    }

    for (dy = this._startY + this._d; dy < endY; dy += this._d) {
      if (dy > y) {
        break;
      }
      index += this._width;
    }

    for (dAngle = this._dAngle; dAngle < Math.PI; dAngle += this._dAngle) {
      if (dAngle > normalizedAngle) {
        break;
      }
      index += this._width*this._height;
    }

    return {
      id: index,
      startX: dx - this._d,
      startY: dy - this._d,
      angle: dAngle - this._dAngle,
      d: this._d,
    };
  }

  applyImageWeight (item) {
    const dot = { x: item.startX + this._d/2, y: item.startY + this._d/2 };
    const angle = item.angle + this._dAngle/2;
    const vecX = Math.cos(angle);
    const vecY = Math.sin(angle);
    const jac = new Matrix(2);

    jac.setData([
      [this._image.x.derivativeBy('x', dot), this._image.x.derivativeBy('y', dot)],
      [this._image.y.derivativeBy('x', dot), this._image.y.derivativeBy('y', dot)],
    ]);

    const resVecX = jac.get(0, 0)*vecX + jac.get(0, 1)*vecY;
    const resVecY = jac.get(1, 0)*vecX + jac.get(1, 1)*vecY;

    const weight = Math.log(Math.sqrt(resVecX*resVecX + resVecY*resVecY));

    if (Number.isNaN(weight)) {
      throw new Error(`SymbolicImage: NaN appeared while calculating weights`);
    }

    this._weights[item.id] = weight;
  }

  _normalizeAngle (angle) {
    let result = angle;

    while (result > Math.PI) {
      result -= Math.PI;
    }

    while (result < 0) {
      result += Math.PI;
    }

    return result;
  }
}

export default SymbolicImage;
