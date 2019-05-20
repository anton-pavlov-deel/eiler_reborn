export const validateImageParams = (params) => {
  if (!params.xFunction || !params.xFunction.length) {
    throw new Error('Absent x function');
  }
  if (!params.yFunction || !params.yFunction.length) {
    throw new Error('Absent y function');
  }
  if (!params.startX === undefined) {
    throw new Error('Absent start x');
  }
  if (Number.isNaN(parseFloat(params.startX))) {
    throw new Error(`Invalid start x: ${params.startX}`);
  }
  if (params.startY === undefined) {
    throw new Error('Absent start y');
  }
  if (Number.isNaN(parseFloat(params.startY))) {
    throw new Error(`Invalid start y: ${params.startY}`);
  }
  if (!params.diameter) {
    throw new Error('Absent diameter');
  }
  if (Number.isNaN(parseFloat(params.diameter))) {
    throw new Error(`Invalid diameter: ${params.diameter}`);
  }
  if (!params.width) {
    throw new Error('Absent width');
  }
  if (Number.isNaN(parseInt(params.width, 10))) {
    throw new Error(`Invalid width: ${params.width}`);
  }
  if (!params.height) {
    throw new Error('Absent height');
  }
  if (Number.isNaN(parseInt(params.height, 10))) {
    throw new Error(`Invalid height: ${params.height}`);
  }
  if (params.iterations !== 0 && !params.iterations) {
    throw new Error('Absent iterations');
  }
  if (Number.isNaN(parseInt(params.iterations, 10))) {
    throw new Error(`Invalid iterations: ${params.iterations}`);
  }
  if (!params.name || !params.name.length) {
    throw new Error('Absent name');
  }
};
