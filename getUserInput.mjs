import prompt from "prompt";
// import prompt from "prompt";
import runQuiz from "./lib/runQuiz.mjs";
import { explainAutoComplete } from "./lib/explanatoryPrompt.mjs";
import fs from "fs";
import {
  genSliceSummaryPrompt,
  genRollingSummaryPrompt,
  retellSliceAsNarratorPrompt
} from "./lib/genPrompts.mjs";

// might append summaries to getUserInput readOpts so dont have to recompute them
// (then again might be useful to do so if changing summary stack or prepending narration)
export default async function getUserInput(bzaTxt, readOpts, queryGPT) {
  // TODO replace gpt prompt
  const { pageNum, rollingSummary, synopsis, gptConvParentId } = readOpts;
  const defaultQueryOptions = [
    {
      name: "next",
      description: "Continue to the next pageSlice."
    },
    {
      name: "jump",
      description: "Jump to the specified input pageNumber."
    },
    {
      name: "exit",
      description:
        "Exit the program and save the current state to the database."
    },
    {
      name: "start",
      description:
        "Start a conversation with the specified prompt or default options, and save any previous conversation if applicable."
    },
    {
      name: "continue",
      description:
        "Continue the current conversation, or start a new one with default options if no conversation is active."
    },
    {
      name: "hard restart",
      description:
        "Restart the conversation with only the initial prompt, without saving the current state to the database."
    },
    {
      name: "quiz",
      description: "Run the quiz loop once."
    },
    {
      name: "toggleQuiz",
      description:
        "Toggle the quiz loop on or off, and print the boolean value."
    },
    {
      name: "help",
      description: "Show the available options."
    },
    {
      name: "printSlice",
      description:
        "Print a GPT-generated summary of the current slice of pages."
    },
    {
      name: "printRoll",
      description:
        "Print a GPT-generated summary of everything up to this point (short term memory)."
    },
    {
      name: "narrate",
      description: "Rewrite all output in the voice of a character."
    },
    {
      name: "voiceOut",
      description:
        "TODO: Use a TTS library to generate voice narration for GPT responses and user queries."
    },
    {
      name: "voiceIn",
      description: "TODO: Use a voice recognition library to allow voice input."
    },
    {
      name: "before",
      description: "Get user input and prepend it to the conversation prompt."
    },
    {
      name: "delBefore",
      description: "Delete the stack of prepended prompts."
    },
    {
      name: "after",
      description:
        "Append the next user query input to all non-summary GPT requests."
    },
    {
      name: "delAfter",
      description: "Delete the stack of appended prompts."
    },
    {
      name: "maxToken",
      description:
        "Change the response length or maximum token count (default 2000, max 4096 including the prompt)."
    },
    {
      name: "beforeSummary",
      description: "Prepend user input to the summarization prompt."
    },
    {
      name: "delBeforeSummary",
      description: "Delete the stack of prepended prompts for summarization."
    },
    {
      name: "afterSummary",
      description: "Append the next user input to all summary GPT requests."
    },
    {
      name: "delAfterSummary",
      description: "delete stack of appended prompts"
    },
    {
      name: "maxTokenSummary",
      description:
        "change response length/max summary token count (default 2000, max = 4096 includes summary prompts)"
    }
  ];

  const defaultPrompt = explainAutoComplete(defaultQueryOptions);
  let query = "";
  let gptResponse = "";

  defaultPrompt
    .run()
    .then(async queryValue => {
      switch (queryValue) {
        case "next":
          return queryValue;
          break;
        case "start":
          query = await prompt(["query"]);
          gptResponse = queryGPT(`${gptPrompt}\n${query}`, {});
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, `${gptPrompt}\n${query}\ngptResponse`, queryGPT);
          break;
        case "continue":
          query = await prompt(["query"]);
          gptResponse = queryGPT(`${gptPrompt}`, {});
          getUserInput(
            bzaTxt,
            {
              ...readOpts,
              convTxt: gptResponse.text,
              parentId: gptResponse.id
            },
            queryGPT
          );
          break;
        case "jump":
          const pageNum = await prompt(["pageNumber"]);
          return { label: "jump", jump: pageNum };
          break;
        case "exit":
          return { label: "exit" };
          break;
        case "quiz":
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
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "h": // fall through to help
        case "help":
          console.log(defaultQuerySchema.properties.nextAction.description);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "pSlice":
          console.log(gptPrompt);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "pRoll":
          const rollingSummary = await queryGPT(
            `${gptPrompt}\nSummary of everything up to this point`
          );
          console.log(rollingSummary);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "narrate":
          // TODO toggle narrative option on
          const narrative = await queryGPT(
            `${gptPrompt}\nRewrite all output in the voice of a character`
          );
          console.log(narrative);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "voiceOut":
          // TODO fix
          // const voiceOutput = await queryGPT(
          //   `${gptPrompt}\nUse TTS to generate voice to narrate gpt response & queries to user`
          // );
          // console.log(voiceOutput);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "voiceIn":
          // TODO fix
          // const voiceInput = await queryGPT(
          //   `${gptPrompt}\nUse talon to allow voice input`
          // );
          // console.log(voiceInput);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "before":
          // TODO fix
          const beforeQuery = await prompt(["query"]);
          gptResponse = queryGPT(`${gptPrompt}\n${beforeQuery}`);
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "delBefore":
          // TODO fix
          // gptResponse = queryGPT(`${gptPrompt}`);
          // console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "after":
          // TODO fix
          const afterQuery = await prompt(["query"]);
          gptResponse = queryGPT(`${gptPrompt}\n${afterQuery}`);
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "delAfter":
          // TODO fix
          gptResponse = queryGPT(`${gptPrompt}`);
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "maxToken":
          // TODO fix
          const tokenCount = await prompt(["tokenCount"]);
          gptResponse = queryGPT(
            `${gptPrompt}\nMax Token Count: ${tokenCount}`
          );
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "beforeSummary":
          // TODO fix
          const beforeSummaryQuery = await prompt(["query"]);
          gptResponse = queryGPT(
            `${gptPrompt}\n${beforeSummaryQuery}\nSummary:`
          );
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "delBeforeSummary":
          // TODO fix
          gptResponse = queryGPT(`${gptPrompt}\nSummary:`);
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "afterSummary":
          // TODO fix
          const afterSummaryQuery = await prompt(["query"]);
          gptResponse = queryGPT(
            `${gptPrompt}\n${afterSummaryQuery}\nSummary:`
          );
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        case "delAfterSummary":
          // TODO fix
          gptResponse = queryGPT(`${gptPrompt}\nSummary:`);
          console.log("gptResponse", gptResponse);
          getUserInput(bzaTxt, readOpts, queryGPT);
          break;
        default:
          return getUserInput(bzaTxt, readOpts, queryGPT);
      }
    })
    .catch(console.error);
}
