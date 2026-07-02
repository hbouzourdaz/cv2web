import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ResumeDataSchema } from '@/lib/resume';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
});

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentResumeData, prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Instruction prompt is required' }, { status: 400 });
    }

    if (!currentResumeData || typeof currentResumeData !== 'object') {
      return NextResponse.json({ error: 'Current resume data is required' }, { status: 400 });
    }

    // Call Gemini to modify the resume data object
    const { output } = await generateText({
      model: google('gemini-2.5-flash') as any,
      maxRetries: 2,
      maxOutputTokens: 4096,
      output: Output.object({
        schema: ResumeDataSchema,
      }),
      prompt: `You are an expert AI resume editor.
Your task is to update the provided JSON resume data according to the user's instructions.
Keep all other fields intact. Only modify the fields requested or implied by the user's instruction.
Make sure the output object strictly conforms to the resume schema.

User Instruction: "${prompt}"

Current Resume Data:
${JSON.stringify(currentResumeData, null, 2)}
`,
    });

    return NextResponse.json({ success: true, updatedResumeData: output });
  } catch (error: any) {
    console.error('Error in AI Assistant route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
