import { SpeechClient } from "@google-cloud/speech";
import fs from "fs";

export default async function transcribeAudioFile(audioFile) {
  const client = new SpeechClient();

  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-US"
  };

  const audio = {
    content: fs.readFileSync(audioFile).toString("base64")
  };

  const request = {
    config: config,
    audio: audio
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join("\n");
  console.log(`Transcription: ${transcription}`);
}

// // Replace this with the path to your audio file
// const audioFile = "path/to/your/audio-file.wav";

// transcribeAudioFile(audioFile);
