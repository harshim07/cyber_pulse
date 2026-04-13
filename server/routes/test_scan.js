const { spawn } = require('child_process');
const path = require('path');

function runPythonPrediction(inputData) {
  return new Promise((resolve, reject) => {
    // Relative to test_scan.js (which we'll put in server/routes)
    const pyScriptPath = path.join(__dirname, '../../ml-model/predict.py');
    const pyProcess = spawn('python', [pyScriptPath]);

    let dataOutput = '';
    let errorOutput = '';

    pyProcess.stdout.on('data', (data) => {
      dataOutput += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pyProcess.on('close', (code) => {
      console.log("Python stdout:", dataOutput);
      console.log("Python stderr:", errorOutput);
      if (code !== 0) {
        reject(new Error(`Prediction failed: ${errorOutput}`));
        return;
      }
      try {
        const result = JSON.parse(dataOutput);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse prediction result: ${dataOutput}`));
      }
    });

    pyProcess.stdin.write(JSON.stringify(inputData));
    pyProcess.stdin.end();
  });
}

async function run() {
  try {
    const res = await runPythonPrediction({ type: 'phishing', data: { url: 'http://test.com' } });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
