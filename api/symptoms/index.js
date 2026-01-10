const https = require('https');
const crypto = require('crypto');

function parseConnectionString(connString) {
  const parts = {};
  connString.split(';').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) parts[key] = value;
  });
  return parts;
}

function makeRequest(method, accountName, accountKey, tableName, options = {}) {
  return new Promise((resolve, reject) => {
    const date = new Date().toUTCString();
    const path = options.path || `/${tableName}()`;
    
    const stringToSign = `${date}\n/${accountName}${path}`;
    const signature = crypto.createHmac('sha256', Buffer.from(accountKey, 'base64'))
      .update(stringToSign, 'utf-8')
      .digest('base64');
    
    const reqOptions = {
      hostname: `${accountName}.table.core.windows.net`,
      port: 443,
      path: path,
      method: method,
      headers: {
        'x-ms-date': date,
        'x-ms-version': '2019-02-02',
        'Authorization': `SharedKeyLite ${accountName}:${signature}`,
        'Accept': 'application/json;odata=nometadata',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject(new Error(`Request failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

module.exports = async function (context, req) {
  context.log('Symptom entries function called');
  
  try {
    const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }
    
    const { AccountName, AccountKey } = parseConnectionString(connString);
    const tableName = 'symptomentries';

    if (req.method === 'GET') {
      const result = await makeRequest('GET', AccountName, AccountKey, tableName);
      const entries = (result.value || []).map(entity => ({
        date: entity.date,
        time: entity.time,
        symptomScore: entity.symptomScore,
        notes: entity.notes || ''
      }));
      
      context.res = {
        status: 200,
        body: entries,
        headers: { 'Content-Type': 'application/json' }
      };
    } 
    else if (req.method === 'POST') {
      const { date, time, symptomScore, notes } = req.body;
      
      const entity = {
        PartitionKey: "symptoms",
        RowKey: `${date}_${time}_${Date.now()}`,
        date,
        time,
        symptomScore: parseInt(symptomScore),
        notes: notes || ''
      };
      
      await makeRequest('POST', AccountName, AccountKey, tableName, {
        body: entity
      });
      
      context.res = {
        status: 201,
        body: { success: true },
        headers: { 'Content-Type': 'application/json' }
      };
    }
  } catch (error) {
    context.log.error('Error in symptoms function:', error);
    context.res = {
      status: 500,
      body: { error: error.message },
      headers: { 'Content-Type': 'application/json' }
    };
  }
};