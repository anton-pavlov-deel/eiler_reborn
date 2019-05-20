import 'babel-polyfill';
import _ from 'lodash';
import os from 'os';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import SymbolicImageApi from './api/SymbolicImageApi';
import SymbolicImage from './lib/math/symbolicImage';
import { corsUpdater, logger } from './lib/middleware.js';
import { validateImageParams } from './lib/validators.js';

const imageApi = new SymbolicImageApi();
const images = {};

const ip = _.get(os.networkInterfaces(), ['wlp3s0', '0', 'address']);

const port = 4444;
const distPath = path.join(__dirname, '../../dist');

const server = express();

server.use(logger);
server.use(corsUpdater);
server.use(bodyParser.json());

server.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

server.get('/src/js', (req, res) => {
  res.sendFile(path.join(distPath, 'bundle.js'));
});

server.get('/src/css', (req, res) => {
  res.sendFile(path.join(distPath, 'styles.css'));
});

server.get('/src/:filename', (req, res) => {
  res.sendFile(path.join(distPath, req.params.filename));
});

server.get('/api/symbolic-images', (req, res) => {
  imageApi.getImages()
    .then((data) => res.status(200).send(data));
});

server.get('/api/symbolic-images/:name', (req, res) => {
  const offset = parseInt(req.query.offset, 10);
  const limit = parseInt(req.query.limit, 10);

  if (!Number.isInteger(offset)) {
    res.status(500).send(`Invalid offset ${offset}`);
    return;
  }
  if (!Number.isInteger(limit)) {
    res.status(500).send(`Invalid limit ${limit}`);
    return;
  }

  imageApi.getImageItems(req.params.name, offset, limit)
    .then((data) => res.status(200).send(data));
});

server.post('/api/symbolic-images', (req, res) => {
  try {
    const params = {
      xFunction: req.body.xFunction,
      yFunction: req.body.yFunction,
      startX: parseFloat(req.body.startX),
      startY: parseFloat(req.body.startY),
      diameter: parseFloat(req.body.diameter),
      width: parseInt(req.body.width, 10),
      height: parseInt(req.body.height, 10),
      iterations: parseInt(req.body.iterations, 10),
      name: req.body.name,
      extra: {
        mmc: req.body.mmc,
        projectiveSlice: req.body.projectiveSlice,
      },
    };

    validateImageParams(params);

    images[params.name] = new SymbolicImage({ ...params, api: imageApi, });
    images[params.name]._startLocalizationProcess();
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
    return;
  }
  res.status(200).send('OK');
});

server.delete('/api/symbolic-images/:name', (req, res) => {
  imageApi.deleteImage(req.params.name)
    .then(() => res.status(200).send('OK'));
});

server.listen(port, () => console.log(`Server running on ${ip}:${port}`));
