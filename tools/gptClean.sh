#!/usr/bin/env node

const axios = require('axios')
const MarkdownIt = require('markdown-it')
const fs = require('fs')

async function gptCleanFormatting(content) {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const data = {
        model: "gpt-3.5-turbo",
        messages:
        [ {"role": "system", "content": "Make possible non human legible text human legible in the following content which was originally a pdf epub or html document but is now markdown, for instance tables, diagrams, or LaTeX might have illegible representations. Returned text should be valid markdown." }, {"role": "user", "content": `${content}----ll` }
                ],
        max_tokens: 2000,
        n: 1,
        stop: ['----ll'],
        temperature: 0.2
    };

    try {
        console.log(data)
        const response = await axios.post(apiUrl, data, { headers: headers });
        console.log(response.data.choices[0])
        return response.data.choices[0].message.content();
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

async function processFile(inputFilePath, outputFilePath) {

    const outputPath = outputFilePath === undefined ? `${inputFilePath}GPTCleaned.md` : outputFilePath
    try {
        function readMarkdownFile(filePath) {
            try {
                const markdown = fs.readFileSync(filePath, 'utf-8');
                return markdown.toString();
            } catch (error) {
                console.error(`Error reading Markdown file: ${error}`);
            }
        }
        const markdown = readMarkdownFile(inputFilePath);
        function splitStringIntoChunks(str, chunkSize) {
            const chunks = [];
            for (let i = 0; i < str.length; i += chunkSize) {
                chunks.push(str.slice(i, i + chunkSize));
            }
                return chunks;
        }
        const mdChunks = splitStringIntoChunks(markdown, 1900)

        const cleanChunks = []
        for (let i = 0; i < mdChunks.length; i += 1) {
            const cleanContent = await gptCleanFormatting(mdChunks[i]);
            cleanChunks.push(cleanContent)
        }
        function saveMarkdownFile(filePath, content) {
            try {
                fs.writeFileSync(filePath, content);
                console.log(`Cleaned Markdown saved to ${filePath}`);
            } catch (error) {
                console.error(`Error saving markdown to file: ${error}`);
            }
        }
        saveMarkdownFile(outputFilePath, cleanChunks.join(""));
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

if (process.argv.length > 4) {
       console.error("too many arguments passed")
   } else {
       processFile(process.argv[2], process.argv[3]);
   }
