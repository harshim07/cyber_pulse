const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

function runPythonPrediction(inputData) {
  return new Promise((resolve, reject) => {
    // Determine path to predict.py relative to the server script
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
      if (code !== 0) {
        console.error(`Python script exited with code ${code}: ${errorOutput}`);
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

    // Send data to python script
    pyProcess.stdin.write(JSON.stringify(inputData));
    pyProcess.stdin.end();
  });
}

// @route   POST /api/scan/phishing
// @desc    Scan a url for phishing
router.post('/phishing', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const result = await runPythonPrediction({ type: 'phishing', data: { url } });
    if (result.error) {
       return res.status(500).json(result);
    }
    
    // Save to some separate collection or just return
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during scan' });
  }
});

// @route   POST /api/scan/malware
// @desc    Scan an APK's permissions for malware
router.post('/malware', async (req, res) => {
  try {
    const permissions = req.body.permissions; // should be an object/dict
    if (!permissions) return res.status(400).json({ error: 'Permissions data required' });

    const result = await runPythonPrediction({ type: 'malware', data: permissions });
     if (result.error) {
       return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during scan' });
  }
});

module.exports = router;
