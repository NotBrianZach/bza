import prompt from "prompt";
import runQuiz from "./lib/runQuiz.mjs";
import fs from "fs";
//   - ask user for input
export default async function getUserInput(curPageNum, gptPrompt, queryGPT) {
  const defaultQuerySchema = {
    properties: {
      nextAction: {
        type: "string", // Specify the type of input to expect.
        description: `
- C=continue to next pageChunk,\n
- ask user for input\n
  - r="repeat" continue the conversation,\n
  - R="Restart" restart conversation with only initial prompt\n
- toggle workflows/subloops\n
  - q="quiz" quiz\n
- toggle what prints out\n
  - h="help" query options\n
  - q="quiz" quiz\n
  - p="pageChunkSummary"  gpt summary of the last chunk of pages\n
  - S="Summary" gpt summary of everything up to this point\n
  - N= "Narration" rewrite all output in the voice of a character\n
  - V= TODO "Voice Output" use ?[TTS](https://github.com/coqui-ai/TTS)? to generate voice to narrate gpt response & queries to user\n
  - v= TODO "Voice Input"  use ?talon? to allow voice input\n
- modify all non summary gpt queries going forward\n
  - b="before" prepend next user query input\n
    - "tell a joke about the following text:"\n
  - d=delete stack of prepended prompts\n
  - A="after" append next user query input to all non summary gpt requests\n
    - "...tell another joke about the above text that ties into the first joke"\n
  - D=delete stack of appended prompts\n
  - l="length" change response length/max token count (default 2000, max = 4096 includes prompt)\n
`
      }
    }
  };
  const queryValue = await prompt.get(defaultQuerySchema);
  let query = "";
  let gptResponse = "";
  switch (queryValue) {
    case "c":
      return queryValue;
      break;
    case "r":
      query = await prompt(["query"]);
      gptResponse = queryGPT(`${gptPrompt}\n${query}`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, `${gptPrompt}\n${query}\ngptResponse`, queryGPT);
      break;
    case "RE":
      query = await prompt(["query"]);
      gptResponse = queryGPT(`${gptPrompt}`);
      getUserInput(curPageNum, gptResponse, queryGPT);
      break;
    case "q":
      const { quiz, grade } = await runQuiz(
        title,
        synopsis,
        pageSlice,
        queryGPT
      );
      // fs.writeFileSync(`./readingList.js`, JSON.stringify(readingListEntry));
      return await prompt.get("input most anything to continue");
      break;
    default:
      return getUserInput(curPageNum, gptResponse, queryGPT);
  }
}
