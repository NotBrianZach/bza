import { Configuration, OpenAIApi } from "openai";
import { ChatGPTAPI } from "chatgpt";
import fetchPonyfill from "fetch-ponyfill";
import { devLog } from "./utils.mjs";

const { fetch, Request, Response, Headers } = fetchPonyfill();

// TODO optional reflection
export function createGPTQuery(openaiAPIKey) {
  //TODO gen system prompt from prompt gens funcs
  const apiKey = openaiAPIKey;
  return async function(gptPrompt, { parentId, specifyMaxTokens }) {
    devLog("queryGPT gptPrompt", gptPrompt);
    let maxTokens = specifyMaxTokens === undefined ? 2000 : specifyMaxTokens;
    const api = new ChatGPTAPI({
      fetch: fetch,
      apiKey: openaiAPIKey,
      systemMessage:
        "You are BZA: A GPT-Powered Conversational Read Eval Print Loop for Books & Articles, you read several pages at a time and then output some user specified thing, e.g. a quiz. You may need to ignore conversion artifacts since we convert all articles, whether pdf, html, or epub, into markdown prior to giving them to you.",
      completionParams: {
        temperature: 0.5,
        max_tokens: maxTokens
        // top_p: 0.8
      }
    });
    // parentId = res.id
    let response;
    try {
      if (parentId !== undefined) {
        response = await api.sendMessage(`${gptPrompt}`, {
          parentMessageId: parentId
        });
        return { txt: response.text, id: response.id };
      } else {
        response = await api.sendMessage(`${gptPrompt}`);
        return { txt: response.text, id: response.id };
      }
    } catch (gptQueryErr) {
      const resolveErr = await gptQueryErr;
      // console.log("queryGPT resolveErr", resolveErr);
      return { gptQueryErr: resolveErr };
    }
  };
}

// export function createGPTQuery2(openaiAPIKey) {
//   //TODO gen system prompt from prompt gens funcs
//   const apiKey = open
//     } else {
//       return await api.sendMessage(`${gptPrompt}`);
//     }
// const openAIConfiguration = new Configuration({
//   apiKey: openaiAPIKey
// });
// const openai = new OpenAIApi(openAIConfiguration);
// return async function(gptPrompt, systemPrompt) {
//   const completion = await openai.createCompletion({
//     model: "text-davinci-003",
//     prompt: gptPrompt,
//     max_tokens: 2000
//   });
//   return completion.data.choices[0].text;
// };
// }
