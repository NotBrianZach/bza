// import { Select } = require('enquirer');
import pkg from "enquirer";
const { AutoComplete } = pkg;

const exampleOptions = [
  {
    name: "Option 1",
    description: "Option 1 is great for beginners."
  },
  {
    name: "Option 2",
    description: "Option 2 is suitable for intermediate users."
  },
  {
    name: "Option 3",
    description: "Option 3 is recommended for advanced users."
  }
];

export function promptWithAutoCompleteAndExplain(inputOptions) {
  const displayDescription = async index => {
    console.log(options[index].description);
  };
  let options;
  if (inputOptions === undefined) {
    options = exampleOptions;
  } else {
    options = inputOptions;
  }
  return new AutoComplete({
    name: "userChoice",
    message: "Please choose an option:",
    choices: options.map(option => option.name),
    // result: choice => options.find(option => option.name === choice).value,
    initial: 0,
    pointer(state, choice, i) {
      if (state.index === i) {
        displayDescription(i);
      }
      return state.index === i ? ">" : " ";
    }
  });
}

// prompt.run()
//   .then(answer => console.log('Answer:', answer))
//   .catch(console.error);
