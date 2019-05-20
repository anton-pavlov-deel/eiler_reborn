import _ from 'lodash';
import Store from '../lib/redis';

const DEFAULT_TTL = 120;

class CacheApi {
  constructor () {
    this.caches = {};
  }

  newCache () {
    const cacheId = Math.floor((Math.random()*1000));
    this.caches[cacheId] = {
      prefixKey: `cache:${cacheId}:`,
    };

    return cacheId;
  }

  getCacheKey (cacheId, key) {
    return `${this.caches[cacheId].prefixKey}${key}`;
  }

  set (cacheId, key, value, ttl=DEFAULT_TTL) {
    if (!this.caches[cacheId]) {
      throw new Error(`Cache API: Unknown cache ID: ${cacheId}.\nExpected one of the ${Object.keys(this.caches)}`);
    }
    return Store.setex(this.getCacheKey(cacheId, key), value, ttl);
  }

  get (cacheId, key) {
    return Store.get(this.getCacheKey(cacheId, key));
  }
}

export default CacheApi;
