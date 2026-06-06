const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Serve the app HTML at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Translation API
app.post('/translate', async (req, res) => {
  const { text, fromLang, toLang } = req.body;
  if (!text || !fromLang || !toLang) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, nothing else. No explanations, no notes, no quotation marks.\n\nText: ${text}`
        }]
      })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || 'Translation failed' });
    }
    const data = await response.json();
    const translated = data.content?.[0]?.text?.trim();
    if (!translated) return res.status(500).json({ error: 'Empty translation response' });
    res.json({ translated });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`LingoCall running on port ${PORT}`);
});
