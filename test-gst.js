const https = require('https');

https.get('https://sheet.gstincheck.co.in/check/27AADCN1234F1Z1', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
