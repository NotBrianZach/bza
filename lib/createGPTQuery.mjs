import { Configuration, OpenAIApi } from "openai";
import { ChatGPTAPI } from "chatgpt";

export function createGPTQuery(openaiAPIKey) {
  //TODO gen system prompt from prompt gens funcs
  const apiKey = openaiAPIKey;
  return async function(gptPrompt, { parentId, specifyMaxTokens }) {
    let maxTokens = specifyMaxTokens === undefined ? 2000 : specifyMaxTokens;
    const api = new ChatGPTAPI({
      apiKey: openaiAPIKey,
      systemMessage:
        "You are BZA: A GPT-Powered Conversational Read Eval Print Loop for Books & Articles, you read several pages at a time and then output some user specified thing, e.g. a quiz",
      completionParams: {
        temperature: 0.5,
        maxTokens
        // top_p: 0.8
      }
    });
    // parentId = res.id
    if (parentId !== undefined) {
      return await api.sendMessage(`${gptPrompt}`, {
        parentMessageId: parentId
      });
    } else {
      return await api.sendMessage(`${gptPrompt}`);
    }
  };
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
}
