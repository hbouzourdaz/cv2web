import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
});

export const isFileContentBad = async (fileContent: string) => {
  const generationResult = await generateText({
    model: google('gemini-2.5-flash') as any,
    prompt: `You are given the following file content, evaluate if content is harmful or spammy. Respond with "unsafe" if harmful, otherwise "safe".
    ${fileContent}
    `,
  });

  if (generationResult.text.toLowerCase().includes('unsafe')) {
    return true;
  } else {
    return false;
  }
};
