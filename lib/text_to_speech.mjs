import textToSpeech from "@google-cloud/text-to-speech";
import fs from "fs";

export default async function synthesizeSpeech(text) {
  const client = new textToSpeech.TextToSpeechClient();

  const request = {
    input: { text: text },
    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" }
  };

  const [response] = await client.synthesizeSpeech(request);
  return response.audioContent;
  // fs.writeFileSync(outputFile, response.audioContent, "binary");
  // console.log(`Audio content written to file: ${outputFile}`);
}
