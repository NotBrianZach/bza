import { Configuration, OpenAIApi } from "openai";

export function createGPTQuery(openaiAPIKey) {
  const openAIConfiguration = new Configuration({
    apiKey: openaiAPIKey
  });
  const openai = new OpenAIApi(openAIConfiguration);
  return async function(gptPrompt, userPrompt) {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: gptPrompt,
      max_tokens: 2000
    });
    //   openai.ChatCompletion.create(
    //     model="gpt-3.5-turbo",
    //     messages=[
    //       {"role": "system", "content": "You are BZA: A GPT-Powered Conversational Read Eval Print Loop for Books & Articles, you read several pages at a time and then output something, for instance a quiz, in response to user input"},
    //       {"role": "user", "content": ""},
    //       {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
    //       {"role": "user", "content": "Where was it played?"}
    //     ]
    // )
    // [‘choices’][0][‘message’][‘content’]
    // stop: API returned complete model output
    // length: Incomplete model output due to max_tokens parameter or token limit
    // content_filter: Omitted content due to a flag from our content filters
    // null: API response still in progress or incomplete
    return completion.data.choices[0].text;
  };
}
