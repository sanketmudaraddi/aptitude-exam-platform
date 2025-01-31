const axios = require('axios');

const callLLM = async (prompt) => {
    const apiKey = process.env.LLM_API_KEY; 
    const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 100,
        },
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        }
    );
    return response.data.choices[0].text;
};

module.exports = { callLLM };
