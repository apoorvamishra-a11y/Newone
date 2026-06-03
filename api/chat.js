export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAqD2jfG2cKo7K7LojTWweEFPinjhQYVsgYA9wPHOCHRIJIw-QQdin59l9dgPMmkbk/exec';

  // Step 1: Check GROQ key
  const keyExists = !!process.env.GROQ_API_KEY;
  const keyPreview = process.env.GROQ_API_KEY?.slice(0, 8) || 'NOT FOUND';

  // Step 2: Fetch sheet data
  let sheetData = [];
  let sheetError = null;
  try {
    const sheetRes = await fetch(APPS_SCRIPT_URL, { redirect: 'follow' });
    sheetData = await sheetRes.json();
  } catch(e) {
    sheetError = e.message;
  }

  // Step 3: Try Groq
  let groqResponse = null;
  let groqError = null;
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: question || 'Hello' }
        ],
        max_tokens: 100
      })
    });
    groqResponse = await groqRes.json();
  } catch(e) {
    groqError = e.message;
  }

  return res.status(200).json({
    debug: {
      keyExists,
      keyPreview,
      sheetRowsCount: sheetData.length || 0,
      sheetError,
      groqResponse,
      groqError
    }
  });
}
