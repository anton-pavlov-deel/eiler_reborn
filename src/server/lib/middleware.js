export const logger = (req, res, next) => {
  console.log();
  console.log(req.method);
  console.log(req.url);
  console.log(req.body);
  console.log(req.params);
  console.log(req.headers);
  console.log();
  next();
};

export const corsUpdater = (req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
    'Access-Control-Max-Age': 86300,
  });
  next();
};
