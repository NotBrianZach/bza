import prompt from "prompt";
// import prompt from "prompt";
import readline from "readline";
import runQuiz from "./lib/runQuiz.mjs";
import { promptWithAutoCompleteAndExplain } from "./lib/explanatoryPrompt.mjs";
import fs from "fs";
import {
  genSliceSummaryPrompt,
  genRollingSummaryPrompt,
  retellSliceAsNarratorPrompt
} from "./lib/genPrompts.mjs";
import { readMultilineInput } from "./lib/utils.mjs";

// might append summaries to getUserInput readOpts so dont have to recompute them
// (then again might be useful to do so if changing summary stack or prepending narration)
export default async function getUserInput(pageSlice, readOpts, queryGPT) {
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
        "Start a conversation with the specified prompt or default options, and save any previous conversation if applicable.",
      subCommands: [
        "title",
        "synopsis",
        "rollingSummary",
        "pageSliceSummary",
        "pages"
      ]
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

  // readOpts.title,
  // readOpts.tStamp,
  // readOpts.synopsis,
  // readOpts.narrator,
  // readOpts.pageNum,
  // readOpts.sliceSize,
  // readOpts.rollingSummary,
  // readOpts.isPrintPage,
  // readOpts.isPrintSliceSummary,
  // readOpts.isPrintRollingSummary,

  const defaultPrompt = promptWithAutoCompleteAndExplain(defaultQueryOptions);
  let query = "";
  let gptResponse = "";

  return defaultPrompt
    .run()
    .then(async (queryValue, thing2) => {
      let gptPrompt = "";
      let userInput = "";
      switch (queryValue) {
        case "next":
          return queryValue;
          break;
        case "jump":
          const pageNum = await prompt(["pageNumber"]);
          return { label: "jump", jump: pageNum };
          break;
        case "exit":
          return { label: "exit" };
          break;
        case "continue":
          // - continue = continue conversation, multiline input, }}} to terminate (if no current conversation assume start default)
          console.log(queryValue, thing2);
          userInput = await readMultilineInput();
          gptResponse = await queryGPT(`${gptPrompt}`, {});
          getUserInput(
            pageSlice,
            {
              ...readOpts,
              convTxt: gptResponse.text,
              parentId: gptResponse.id
            },
            queryGPT
          );
          break;
        case "start":
          // - title = append title
          // - synopsis = append synopsis
          // - rollingSummary = append pageSliceSummary
          // - pageSliceSummary = append pageSliceSummary
          // - pages = append pageSlice
          userInput = await readMultilineInput();
          gptResponse = await queryGPT(`${gptPrompt}\n${query}`, {});
          console.log("gptResponse", gptResponse);
          return await getUserInput(
            pageSlice,
            `${gptPrompt}\n${query}\n${gptResponse}`,
            queryGPT
          );
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
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "h": // fall through to help
        case "help":
          // console.log(defaultQueryOptions.properties.nextAction.description);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "pSlice":
          console.log(gptPrompt);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "pRoll":
          const rollingSummary = await queryGPT(
            `${gptPrompt}\nSummary of everything up to this point`
          );
          console.log(rollingSummary);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "narrate":
          // TODO toggle narrative option on
          const narrative = await queryGPT(
            `${gptPrompt}\nRewrite all output in the voice of a character`
          );
          console.log(narrative);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "voiceOut":
          // TODO fix
          // const voiceOutput = await queryGPT(
          //   `${gptPrompt}\nUse TTS to generate voice to narrate gpt response & queries to user`
          // );
          // console.log(voiceOutput);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "voiceIn":
          // TODO fix
          // const voiceInput = await queryGPT(
          //   `${gptPrompt}\nUse talon to allow voice input`
          // );
          // console.log(voiceInput);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "before":
          // TODO fix
          const beforeQuery = await prompt(["query"]);
          gptResponse = queryGPT(`${gptPrompt}\n${beforeQuery}`);
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "delBefore":
          // TODO fix
          // gptResponse = queryGPT(`${gptPrompt}`);
          // console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "after":
          // TODO fix
          const afterQuery = await prompt(["query"]);
          gptResponse = queryGPT(`${gptPrompt}\n${afterQuery}`);
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "delAfter":
          // TODO fix
          gptResponse = queryGPT(`${gptPrompt}`);
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "maxToken":
          // TODO fix
          const tokenCount = await prompt(["tokenCount"]);
          gptResponse = queryGPT(
            `${gptPrompt}\nMax Token Count: ${tokenCount}`
          );
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "beforeSummary":
          // TODO fix
          const beforeSummaryQuery = await prompt(["query"]);
          gptResponse = queryGPT(
            `${gptPrompt}\n${beforeSummaryQuery}\nSummary:`
          );
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "delBeforeSummary":
          // TODO fix
          gptResponse = queryGPT(`${gptPrompt}\nSummary:`);
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "afterSummary":
          // TODO fix
          const afterSummaryQuery = await prompt(["query"]);
          gptResponse = queryGPT(
            `${gptPrompt}\n${afterSummaryQuery}\nSummary:`
          );
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        case "delAfterSummary":
          // TODO fix
          gptResponse = queryGPT(`${gptPrompt}\nSummary:`);
          console.log("gptResponse", gptResponse);
          getUserInput(pageSlice, readOpts, queryGPT);
          break;
        default:
          return getUserInput(pageSlice, readOpts, queryGPT);
      }
    })
    .catch(console.error);
}
