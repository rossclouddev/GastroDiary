module.exports = async function (context, req) {
  context.log('Question function called');
  
  try {
    const { question, days, foodEntries, symptomEntries, medicationEntries, drinkEntries } = req.body;
    
    if (!question || !question.trim()) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'No question provided' }
      };
      return;
    }

    // Prepare data context for Claude
    const foodText = (foodEntries || []).map(e => 
      `${e.date} ${e.time}: ${e.food}${e.notes ? ' (' + e.notes + ')' : ''}`
    ).join('\n');

    const symptomText = (symptomEntries || []).map(e =>
      `${e.date} ${e.time}: Symptom severity ${e.symptomScore}/10${e.notes ? ' (' + e.notes + ')' : ''}`
    ).join('\n');

    const medicationText = (medicationEntries || []).map(e =>
      `${e.date} ${e.time}: ${e.medication}${e.dosage ? ' - ' + e.dosage : ''}${e.notes ? ' (' + e.notes + ')' : ''}`
    ).join('\n');

    const drinkText = (drinkEntries || []).map(e =>
      `${e.date} ${e.time}: ${e.drink}${e.amount ? ' - ' + e.amount : ''}${e.notes ? ' (' + e.notes + ')' : ''}`
    ).join('\n');

    const prompt = `You are a helpful assistant analyzing health diary data. The user has tracked their food, symptoms, medications, and drinks over the last ${days} day(s).

USER'S QUESTION:
${question}

DATA FROM THE LAST ${days} DAY(S):

FOOD ENTRIES:
${foodText || 'No food entries in this period.'}

SYMPTOM ENTRIES:
${symptomText || 'No symptom entries in this period.'}

MEDICATION/SUPPLEMENT ENTRIES:
${medicationText || 'No medication entries in this period.'}

ALCOHOLIC DRINK ENTRIES:
${drinkText || 'No drink entries in this period.'}

Please answer the user's question based on the data provided. Be specific and reference actual entries from their data. If the question cannot be answered with the available data, explain what's missing. Be helpful and concise.`;

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
        max_tokens: 1500,
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

    const answerText = anthropicData.content[0].text;

    context.res = {
      headers: { 'Content-Type': 'application/json' },
      body: { answer: answerText }
    };
  } catch (error) {
    context.log.error('Error in question function:', error);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: error.message }
    };
  }
};