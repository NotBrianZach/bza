import axios from 'axios'
import MarkdownIt from 'markdown-it'

async function gptCleanFormatting(content) {
    const apiKey = 'your_chatgpt_api_key';
    const apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const prompt = `Convert the following content with bad formatting into a human-readable format:\n${content}\n---\n`;

    const data = {
        prompt: prompt,
        max_tokens: 200,
        n: 1,
        stop: ['---'],
        temperature: 0.5
    };

    try {
        const response = await axios.post(apiUrl, data, { headers: headers });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}
