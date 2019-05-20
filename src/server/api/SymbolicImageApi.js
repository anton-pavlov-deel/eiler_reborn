import _ from 'lodash';
import Store from '../lib/redis';

const storePrefixes = {
  images: 'images',
  imageItems: 'image_items',
  imageMeta: 'image_meta',
};

class SymbolicImageApi {
  async newImage (imageName) {
    await Store.sadd(storePrefixes.images, imageName);
    await Store.del(this._imageItemsKey(imageName));
    await Store.del(this._imageMetaKey(imageName));
  }

  async getImages () {
    const imageNames = await Store.smembers(storePrefixes.images);
    const resultPromises = imageNames.map(async (name) => ({
      name,
      itemsCount: await Store.llen(this._imageItemsKey(name)),
      morseSpectrum: _.map(await Store.hgetall(this._imageMetaKey(name)), (value, key) => {
        if (key.includes('mmc')) {
          return JSON.parse(value);
        } else {
          return null;
        }
      })
        .filter((item) => item),
    }));

    return Promise.all(resultPromises);
  }

  async deleteImage (name) {
    if (!(await this._checkImageExistance(name))) {
      throw new Error(`SymbolicImageApi: addImageItems: Image with name ${name} isn't exist`);
    }
    await this.deleteImageItems(name);
    await this.deleteImageMeta(name);
    await Store.srem(storePrefixes.images, name);
  }

  async addImageItems (imageName, items) {
    if (!(await this._checkImageExistance(imageName))) {
      throw new Error(`SymbolicImageApi: addImageItems: Image with name ${imageName} isn't exist`);
    }
    const imageItemsKey = this._imageItemsKey(imageName);
    return Store.lpush(imageItemsKey, items);
  }

  async getImageItems (imageName, offset=0, limit=1000) {
    if (!(await this._checkImageExistance(imageName))) {
      throw new Error(`SymbolicImageApi: getImageItems: Image with name ${imageName} isn't exist`);
    }
    const imageItemsKey = this._imageItemsKey(imageName);
    return Store.lrange(imageItemsKey, offset, offset + limit - 1);
  }

  async deleteImageItems (imageName) {
    if (!(await this._checkImageExistance(imageName))) {
      throw new Error(`SymbolicImageApi: deleteImageItems: Image with name ${imageName} isn't exist`);
    }
    const imageItemsKey = this._imageItemsKey(imageName);
    return Store.del(imageItemsKey);
  }

  async deleteImageMeta (imageName) {
    if (!(await this._checkImageExistance(imageName))) {
      throw new Error(`SymbolicImageApi: deleteImageItems: Image with name ${imageName} isn't exist`);
    }
    return Store.del(this._imageMetaKey(imageName));
  }

  async updateMetadata (imageName, metadata) {
    const imageMetaKey = this._imageMetaKey(imageName);
    const promises = _.map(metadata, async (value, key) => {
      await Store.hset(imageMetaKey, key, value);
    });

    return Promise.all(promises);
  }

  _imageItemsKey (imageName) {
    return `${storePrefixes.imageItems}:${imageName}`;
  }

  _imageMetaKey (imageName) {
    return `${storePrefixes.imageMeta}:${imageName}`;
  }

  async _checkImageExistance (imageName) {
    const found = (await Store.smembers(storePrefixes.images))
      .includes(imageName);
    return found;
  }
}

export default SymbolicImageApi;
