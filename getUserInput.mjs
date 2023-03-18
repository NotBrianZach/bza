import prompt from "prompt";
import runQuiz from "./lib/runQuiz.mjs";
import fs from "fs";
import {
  genChunkSummaryPrompt,
  genRollingSummaryPrompt,
  retellChunkAsNarratorPrompt
} from "./lib/genPrompts.mjs";

// might append summaries to getUserInput readOpts so dont have to recompute them
// (then again might be useful to do so if changing summary stack or prepending narration)
export default async function getUserInput(bzaTxt, readOpts, queryGPT) {
  // TODO replace gpt prompt
  const { pageNum, rollingSummary, synopsis } = readOpts;
  const gptPrompt = gen;
  const defaultQuerySchema = {
    properties: {
      nextAction: {
        type: "string", // Specify the type of input to expect.
        description: `
- c="continue" to next pageChunk,\n
- jump="jump" to input pageNumber,\n
- EX="EXit" exit program, save to db\n
##### ASK user for input\n
- r="repeat" ask user for input, append to prompt and query gpt,\n
- RE="REstart" restart conversation w/only initial prompt and save to db\n
- REDT="REstart DesTructive" hard restart conversation w/only initial prompt\n
##### SUBLOOP COMMANDS\n
- quiz= run quiz loop once\n
- toggleQuiz= toggles quiz loop, print boolean value\n
##### PRINT TOGGLES: print to console, and enable/disable printing in event loop\n
- h or help = show options\n
- pChunk="summary of page chunk" print gpt summary of the current chunk of pages\n
- pRoll="rolling summary" print gpt summary of everything up to this point (short term memory)\n
- narrate= rewrite all output in the voice of a character\n
- voiceOut= TODO "Voice output" use ?[TTS](https://github.com/coqui-ai/TTS)? to generate voice to narrate gpt response & queries to user\n
- voiceIn= TODO "voice input"  use ?talon? to allow voice input\n
##### LLM PROMPT MODIFICATION: change all non-summary llm queries going forward\n
- before= get user input, prepend to conversation prompt\n
  - "tell a joke about the following text:"\n
- delBefore=delete stack of prepended prompts\n
- after= append next user query input to all non summary gpt requests\n
  - "...tell another joke about the above text that ties into the first joke"\n
- delAfter= delete stack of appended prompts\n
- maxToken=change response length/max token count (default 2000, max = 4096 includes prompt)\n
##### LLM SUMMARY PROMPT MODIFICATION: change all summary llm queries going forward\n
- beforeSummary= prepend user input to summarization prompt\n
  - "You are helping a student cram for a test"\n
- delBeforeSummary=delete stack of prepended prompts\n
- afterSummary= append next user input to all summary gpt requests\n
  - "...and make it light hearted and funny"\n
- delAfterSummary= delete stack of appended prompts\n
- maxTokenSummary=change response length/max summary token count (default 2000, max = 4096 includes summary prompts)\n
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
      gptResponse = queryGPT(`${gptPrompt}\n${query}`, {});
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, `${gptPrompt}\n${query}\ngptResponse`, queryGPT);
      break;
    case "RE":
      query = await prompt(["query"]);
      gptResponse = queryGPT(`${gptPrompt}`, {});
      getUserInput(curPageNum, gptResponse, queryGPT);
      break;
    case "jump":
      const pageNum = await prompt(["pageNumber"]);
      return { label: "jump", jump: pageNum };
      break;
    case "EX":
      return { label: "EX" };
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
    case "toggleQuiz":
      const toggleVal = await prompt(["toggleVal"]);
      console.log(toggleVal);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "h": // fall through to help
    case "help":
      console.log(defaultQuerySchema.properties.nextAction.description);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "pChunk":
      console.log(gptPrompt);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "pRoll":
      const rollingSummary = await queryGPT(
        `${gptPrompt}\nSummary of everything up to this point`
      );
      console.log(rollingSummary);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "narrate":
      // TODO toggle narrative option on
      const narrative = await queryGPT(
        `${gptPrompt}\nRewrite all output in the voice of a character`
      );
      console.log(narrative);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "voiceOut":
      // const voiceOutput = await queryGPT(
      //   `${gptPrompt}\nUse TTS to generate voice to narrate gpt response & queries to user`
      // );
      // console.log(voiceOutput);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "voiceIn":
      // const voiceInput = await queryGPT(
      //   `${gptPrompt}\nUse talon to allow voice input`
      // );
      // console.log(voiceInput);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "before":
      // TODO fix
      const beforeQuery = await prompt(["query"]);
      gptResponse = queryGPT(`${gptPrompt}\n${beforeQuery}`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "delBefore":
      // TODO fix
      // gptResponse = queryGPT(`${gptPrompt}`);
      // console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "after":
      // TODO fix
      const afterQuery = await prompt(["query"]);
      gptResponse = queryGPT(`${gptPrompt}\n${afterQuery}`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "delAfter":
      // TODO fix
      gptResponse = queryGPT(`${gptPrompt}`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "maxToken":
      // TODO fix
      const tokenCount = await prompt(["tokenCount"]);
      gptResponse = queryGPT(`${gptPrompt}\nMax Token Count: ${tokenCount}`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "beforeSummary":
      // TODO fix
      const beforeSummaryQuery = await prompt(["query"]);
      gptResponse = queryGPT(`${gptPrompt}\n${beforeSummaryQuery}\nSummary:`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "delBeforeSummary":
      // TODO fix
      gptResponse = queryGPT(`${gptPrompt}\nSummary:`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "afterSummary":
      // TODO fix
      const afterSummaryQuery = await prompt(["query"]);
      gptResponse = queryGPT(`${gptPrompt}\n${afterSummaryQuery}\nSummary:`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    case "delAfterSummary":
      // TODO fix
      gptResponse = queryGPT(`${gptPrompt}\nSummary:`);
      console.log("gptResponse", gptResponse);
      getUserInput(curPageNum, gptPrompt, queryGPT);
      break;
    default:
      return getUserInput(curPageNum, gptPrompt, queryGPT);
  }
}
