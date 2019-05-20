const { exec } = require('child_process');

const vertices = [
  [1, 3],
  [2],
  [3, 5],
  [4],
  [0],
  [0],
];

exec(`python script.py ${vertices.length} '${JSON.stringify(vertices)}'`, (error, stdout, stderr) => {
  if (error) {
    console.error(error);
  } else if (stdout) {
    const resultArray = stdout.split('\n');
    const eigenValue = parseFloat(resultArray[0]);
    const eigenVector = resultArray[1]
      .split(' ')
      .map(parseFloat)
      .filter((number) => !Number.isNaN(number));

    console.log(stdout);
    console.log();
    console.log(`Eigen Value: ${eigenValue}`);
    console.log(`Eigen Vector: ${eigenVector}`);
  } else {
    console.error(`Python throws: ${stderr}`);
  }
});
