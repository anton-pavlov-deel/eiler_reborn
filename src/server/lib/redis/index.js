import _ from 'lodash';
import Redis from 'ioredis';
import config from './config.json';

class Store {
  constructor (config) {
    this._config = config.redis;
    this._redis = new Redis({
      options: config.redis
    });
  }

  async get (key) {
    const value = await this._redis.get(key);
    return JSON.parse(value);
  }

  async smembers (key) {
    const value = await this._redis.smembers(key);
    return value.map(JSON.parse);
  }

  async keys (pattern) {
    const result = await this._redis.keys(pattern);
    return result;
  }

  async lrange (key, offset=0, limit=-1) {
    const result = await this._redis.lrange(key, offset, limit);
    return result.map(JSON.parse);
  }

  async llen (key) {
    const result = await this._redis.llen(key);
    return result;
  }

  async del (key) {
    return await this._redis.del(key);
  }

  async srem (key, value) {
    let formattedValue = value;
    if (!Array.isArray(formattedValue)) {
      formattedValue = [formattedValue];
    }

    formattedValue = formattedValue.map(JSON.stringify);
    return await this._redis.srem(key, ...formattedValue);
  }

  async hget (key, field) {
    const result = await this._redis.hget(key, field);
    return JSON.stringify(result);
  }

  async hgetall (key) {
    const result = await this._redis.hgetall(key);
    return result;
  }

  set (key, value) {
    const valueString = JSON.stringify(value);
    return this._redis.set(
      key,
      valueString
    );
  }

  setex (key, value, ttl=10) {
    const valueString = JSON.stringify(value);
    return this._redis.set(
      key,
      valueString,
      'ex',
      ttl
    );
  }

  hset (key, field, value) {
    const valueString = JSON.stringify(value);
    return this._redis.hset(
      key,
      field,
      valueString
    );
  }

  sadd (key, value) {
    let formattedValue = value;
    if (!Array.isArray(formattedValue)) {
      formattedValue = [formattedValue];
    }

    formattedValue = formattedValue.map(JSON.stringify);
    this._redis.sadd(
      key,
      ...formattedValue
    );
  }

  lpush (key, value) {
    let formattedValue = value;
    if (!Array.isArray(formattedValue)) {
      formattedValue = [formattedValue];
    }

    formattedValue = formattedValue.map(JSON.stringify);
    this._redis.lpush(
      key,
      ...formattedValue
    );
  }
}

const store = new Store(config);

export default store;
