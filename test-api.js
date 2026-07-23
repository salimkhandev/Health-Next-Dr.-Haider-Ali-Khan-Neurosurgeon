const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/payments',
  method: 'GET',
  headers: {
    // We need to bypass auth or auth will block it. 
    // Wait, it requires auth token. We can't fetch it easily without a valid session cookie.
  }
}, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(`BODY: ${data}`));
});
req.end();
