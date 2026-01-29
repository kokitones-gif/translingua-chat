export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  const { text, targetLang } = req.body;

  const LANG_NAMES = {
        ja: 'Japanese', en: 'English', zh: 'Chinese', ko: 'Korean',
        es: 'Spanish', fr: 'French', de: 'German'
  };

  try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                          'Content-Type': 'application/json',
                          'x-api-key': process.env.ANTHROPIC_API_KEY,
                          'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                          model: 'claude-sonnet-4-20250514',
                          max_tokens: 1000,
                          messages: [{
                                      role: 'user',
                                      content: 'Translate to ' + (LANG_NAMES[targetLang] || targetLang) + '. Return ONLY translated text: ' + text
                          }]
                })
        });

      const data = await response.json();
        res.status(200).json({ translated: data.content?.[0]?.text || text });
  } catch (error) {
        res.status(500).json({ translated: text });
  }
}
