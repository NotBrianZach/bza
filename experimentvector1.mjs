#!/usr/bin/env node

const fs = require("fs");
const axios = require("axios");
const path = require("path");

// const PDFJS = require("pdfjs-dist");

const tfjs = require("@tensorflow/tfjs");
const { NearestNeighbors } = require("scikitjs");
const { tokenizeAndStem } = require("natural");
const openai = require("openai");
const openAIKey = process.env.OPENAI_API_KEY;
console.log(tfjs);

async function downloadPdf(url, outputPath) {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream"
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function preprocess(text) {
  text = text.replace(/\n/g, " ");
  text = text.replace(/\s+/g, " ");
  return text;
}

// async function pdfToText(path, startPage = 1, endPage = null) {
//   const pdf = await PDFJS.getDocument(path).promise;
//   const totalPages = pdf.numPages;

//   if (endPage === null) {
//     endPage = totalPages;
//   }

//   const textList = [];

//   for (let i = startPage - 1; i < endPage; i++) {
//     const page = await pdf.getPage(i + 1);
//     const textContent = await page.getTextContent();
//     const text = textContent.items.map(item => item.str).join(" ");
//     const preprocessedText = preprocess(text);
//     textList.push(preprocessedText);
//   }

//   return textList;
// }

function textToChunks(texts, wordLength = 150, startPage = 1) {
  const textTokens = texts.map(text => tokenizeAndStem(text));
  const pageNumbers = [];
  const chunks = [];

  textTokens.forEach((words, idx) => {
    for (let i = 0; i < words.length; i += wordLength) {
      let chunk = words.slice(i, i + wordLength);
      if (
        i + wordLength > words.length &&
        chunk.length < wordLength &&
        textTokens.length !== idx + 1
      ) {
        textTokens[idx + 1] = chunk.concat(textTokens[idx + 1]);
        continue;
      }
      chunk = chunk.join(" ").trim();
      chunk = `[${idx + startPage}] "${chunk}"`;
      chunks.push(chunk);
    }
  });

  return chunks;
}

function createSemanticSearch() {
  // console.log(typeof loadGraphicalModel);
  const state = {
    use: tfjs.loadGraphModelSync(
      "https://tfhub.dev/google/universal-sentence-encoder/4"
    ),
    fitted: false,
    data: null,
    embeddings: null,
    nn: null
  };

  async function fit(data, batch = 1000, nNeighbors = 5) {
    state.data = data;
    state.embeddings = await getTextEmbedding(data, batch);
    nNeighbors = Math.min(nNeighbors, state.embeddings.length);
    state.nn = new NearestNeighbors({ nNeighbors });
    state.nn.fit(state.embeddings);
    state.fitted = true;
  }

  async function call(text, returnData = true) {
    const inputEmbedding = await state.use.embed([text]);
    const neighbors = state.nn.kneighbors(inputEmbedding, false)[0];

    if (returnData) {
      return neighbors.map(i => state.data[i]);
    } else {
      return neighbors;
    }
  }

  async function getTextEmbedding(texts, batch = 1000) {
    const embeddings = [];

    for (let i = 0; i < texts.length; i += batch) {
      const textBatch = texts.slice(i, i + batch);
      const embeddingBatch = await state.use.embed(textBatch);
      embeddings.push(embeddingBatch);
    }

    return embeddings.flat();
  }

  return {
    fit,
    call,
    getTextEmbedding
  };
}

const semanticSearch = createSemanticSearch();

async function loadRecommender(path, startPage = 1) {
  const recommender = createSemanticSearch();
  const pdfFile = path.basename(path);
  const embeddingsFile = `${pdfFile}_${startPage}.npy`;

  if (fs.existsSync(embeddingsFile)) {
    const embeddings = np.load(embeddingsFile);
    recommender.embeddings = embeddings;
    recommender.fitted = true;
    return "Embeddings loaded from file";
  }

  const texts = await pdfToText(path, startPage);
  const chunks = textToChunks(texts, startPage);
  await recommender.fit(chunks);
  np.save(embeddingsFile, recommender.embeddings);
  return "Corpus Loaded.";
}

function generateText(prompt, engine = "text-davinci-003") {
  openai.apiKey = openAIKey;
  return openai.Completion.create({
    engine,
    prompt,
    max_tokens: 512,
    n: 1,
    stop: null,
    temperature: 0.7
  }).then(completions => {
    const message = completions.choices[0].text;
    return message;
  });
}

function generateText2(prompt, engine = "gpt-3.5-turbo") {
  openai.apiKey = openAIKey;
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: prompt }
  ];

  return openai.ChatCompletion.create({
    model: engine,
    messages,
    max_tokens: 512,
    n: 1,
    stop: null,
    temperature: 0.7
  }).then(completions => {
    const message = completions.choices[0].message["content"];
    return message;
  });
}

function generateAnswer(question, openAIKey) {
  // You need to implement the `recommender` function yourself
  const topnChunks = recommender(question);
  let prompt = "";

  prompt += "search results:\n\n";
  for (const c of topnChunks) {
    prompt += c + "\n\n";
  }

  // Continue building the prompt as in the original Python code
  // ...

  return generateText2(prompt, "text-davinci-003");
}

async function questionAnswer(url, file, question) {
  const encoderModel = await loadGraphicalModel(
    "https://tfhub.dev/google/universal-sentence-encoder/4",
    { fromTFHub: true }
  );

  if (url.trim() !== "" && file === null) {
    downloadPdf(url, "corpus.pdf");
    loadRecommender("corpus.pdf");
  } else if (url.trim() === "" && file !== null) {
    const fileName = file.name;
    fs.renameSync(file.path, fileName);
    loadRecommender(fileName);
  } else {
    return Promise.reject(
      new Error("Both URL and PDF is empty. Provide at least one.")
    );
  }

  if (question.trim() === "") {
    return Promise.reject(new Error("Question field is empty"));
  }

  return generateAnswer(question, openAIKey);
}

// You need to implement the `SemanticSearch` class yourself
const recommender = new SemanticSearch();
console.log("pdf.js url file question");

const args = process.argv;
// const url = args[2];
const file = args[2];
const question = args[3];
const answer = questionAnswer("", file, question);

// Note that some libraries, such as the OpenAI API, do not have direct equivalents in Node.js.
// You may need to use alternative libraries or make API calls directly using a library like axios.

// import gradio as gr // title = 'PDF GPT' // description = """ What is PDF GPT ? // 1. The problem is that Open AI has a 4K token limit and cannot take an entire PDF file as input. Additionally, it sometimes returns irrelevant responses due to poor embeddings. ChatGPT cannot directly talk to external data. The solution is PDF GPT, which allows you to chat with an uploaded PDF file using GPT functionalities. The application breaks the document into smaller chunks and generates embeddings using a powerful Deep Averaging Network Encoder. A semantic search is performed on your query, and the top relevant chunks are used to generate a response. // 2. The returned response can even cite the page number in square brackets([]) where the information is located, adding credibility to the responses and helping to locate pertinent information quickly. The Responses are much better than the naive responses by Open AI.""" // with gr.Blocks() as demo:
//     gr.Markdown(f'<center><h1>{title}</h1></center>')
//     gr.Markdown(description)

//     with gr.Row():
//         with gr.Group():
//             gr.Markdown(f'<p style="text-align:center">Get your Open AI API key <a href="https://platform.openai.com/account/api-keys">here</a></p>')
//             openAI_key=gr.Textbox(label='Enter your OpenAI API key here')
//             url = gr.Textbox(label='Enter PDF URL here')
//             gr.Markdown("<center><h4>OR<h4></center>")
//             file = gr.File(label='Upload your PDF/ Research Paper / Book here', file_types=['.pdf'])
//             question = gr.Textbox(label='Enter your question here')
//             btn = gr.Button(value='Submit')
//             btn.style(full_width=True)

//         with gr.Group():
//             answer = gr.Textbox(label='The answer to your question is :')

//         btn.click(question_answer, inputs=[url, file, question,openAI_key], outputs=[answer])
// #openai.api_key = os.getenv('Your_Key_Here')
// demo.launch()
