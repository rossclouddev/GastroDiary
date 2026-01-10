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
  context.log('Analysis function called');
  
  try {
    const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }
    
    const { AccountName, AccountKey } = parseConnectionString(connString);
    const tableName = 'analysisentries';

    if (req.method === 'GET') {
      // Retrieve all analysis entries
      const result = await makeRequest('GET', AccountName, AccountKey, tableName);
      const entries = (result.value || []).map(entity => ({
        timestamp: entity.timestamp,
        days: entity.days,
        analysis: entity.analysis
      }));
      
      context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: entries
      };
    } 
    else if (req.method === 'POST') {
      // Create new analysis
      const { foodEntries, symptomEntries, days } = req.body;
      
      if (!foodEntries || !symptomEntries) {
        context.res = {
          status: 400,
          body: { error: 'Missing required data' },
          headers: { 'Content-Type': 'application/json' }
        };
        return;
      }

      // Call Anthropic API
      const foodText = foodEntries.map(e => 
        `${e.date} ${e.time}: Ate ${e.food}${e.notes ? ' (' + e.notes + ')' : ''}`
      ).join('\n');

      const symptomText = symptomEntries.map(e =>
        `${e.date} ${e.time}: Symptom severity ${e.symptomScore}/10${e.notes ? ' (' + e.notes + ')' : ''}`
      ).join('\n');

      const prompt = `You are a medical assistant helping identify food triggers for stomach issues. Analyze the following data from the last ${days} day(s).

FOOD ENTRIES:
${foodText}

SYMPTOM ENTRIES:
${symptomText}

Please provide a concise analysis covering:
1. Which foods correlate with symptoms appearing 1-6 hours later?
2. Time delays: How long after eating do symptoms typically appear?
3. Which foods seem safe (no symptoms following them)?
4. Any patterns by time of day or food combinations?
5. Severity patterns: which foods correlate with higher symptom scores?
6. An analysis of the adherence to the 'five a day' fruit and vegetable guideline and its impact on symptoms.

Be specific about time delays and patterns. Remind the user to consult a healthcare provider.`;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      const anthropicData = await anthropicResponse.json();
      
      if (!anthropicResponse.ok) {
        throw new Error(anthropicData.error?.message || 'Anthropic API request failed');
      }

      const analysisText = anthropicData.content[0].text;

      // Store analysis in Azure Table
      const timestamp = new Date().toISOString();
      const entity = {
        PartitionKey: "analysis",
        RowKey: timestamp.replace(/[:.]/g, '-'),
        timestamp,
        days: parseInt(days),
        analysis: analysisText
      };
      
      await makeRequest('POST', AccountName, AccountKey, tableName, {
        body: entity
      });
      
      context.log('Analysis stored, returning response');
      
      context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: { 
          success: true, 
          analysis: analysisText 
        }
      };
    }
  } catch (error) {
    context.log.error('Error in analysis function:', error);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: error.message }
    };
  }
};