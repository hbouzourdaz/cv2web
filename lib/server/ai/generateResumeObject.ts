import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ResumeDataSchema } from '@/lib/resume';
import dedent from 'dedent';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
});

async function generateWithGroq(prompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  console.log('[generateResumeObject] Falling back to Groq API...');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. No markdown formatting, no codeblocks, just JSON.`,
        },
      ],
      response_format: {
        type: 'json_object',
      },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API returned error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse and validate using Zod
  const json = JSON.parse(content);
  return ResumeDataSchema.parse(json);
}

export const generateResumeObject = async (
  resumeText: string,
  modelName: string = 'gemini-2.5-flash',
  targetLanguage: string = 'english',
  completeWithAi: boolean = true
) => {
  const startTime = Date.now();
  const attempts = 3;
  let delay = 6000; // Wait 6 seconds if quota exceeded

  for (let attempt = 1; attempt <= attempts; attempt++) {
    let targetModel = modelName;
    if (!targetModel.startsWith('gemini-')) {
      targetModel = 'gemini-2.5-flash';
    }

    const languageInstruction = targetLanguage !== 'english'
      ? `- IMPORTANT: Translate ALL generated content (such as summaries, job titles, descriptions, school names, degrees, skill names, etc.) into ${targetLanguage.toUpperCase()}. Do not translate personal names or platform usernames.`
      : '';

    const completionInstruction = completeWithAi
      ? `- IMPORTANT: First, look for a 'Candidate Name' or 'Name' in the text. Always extract and use this real candidate name instead of generating a mock name.
   - If the resume text is very brief, incomplete, or only contains profile metadata/URLs, use your advanced creative writing skills to write a complete, high-quality, professional mock resume.
   - Infer their career path, experiences, and education using their real name and platform clues (e.g. if the source contains publications or Scholar details, they are an Academic/Researcher; if LinkedIn, they are a professional/developer).
   - Keep all generated experiences, skills, and summary STRICTLY relevant to their actual profile type, name, and field. Do not invent unrelated candidates or roles.
   - Always generate a professional 'about' section summary highlighting their inferred skills and career objectives.
   - Always generate a list of 5-10 relevant skills.
   - If work experiences or educations are empty, generate at least 1-2 realistic simulated entries matching their field to make the website look professional and complete rather than leaving them empty.`
      : `- IMPORTANT: First, look for a 'Candidate Name' or 'Name' in the text. Always extract and use this real candidate name.
   - Do NOT generate, infer, or complete any details with AI that are not explicitly present in the source resume text. If sections or fields (like skills, summary, descriptions, start/end dates) are missing or not mentioned, leave them blank, null, or empty. Only extract what is written.`;

    const promptText = dedent(`You are an expert resume writer. Generate a resume object from the following resume text with this EXACT structure:

    {
      "header": {
        "name": "Full Name",
        "shortAbout": "Brief professional summary",
        "location": "City, Country (optional)",
        "contacts": {
          "website": "website URL (optional)",
          "email": "email address (optional)",
          "phone": "phone number (optional)",
          "twitter": "twitter username (optional)",
          "linkedin": "linkedin username (optional)",
          "github": "github username (optional)"
        },
        "skills": ["skill1", "skill2", "skill3"]
      },
      "summary": "Detailed professional summary paragraph",
      "workExperience": [
        {
          "company": "Company Name",
          "link": "Company website URL",
          "location": "City, Country or Remote",
          "contract": "Full-time/Part-time/Contract",
          "title": "Job Title",
          "start": "YYYY-MM-DD",
          "end": "YYYY-MM-DD or null if current",
          "description": "Job description"
        }
      ],
      "education": [
        {
          "school": "School/University Name",
          "degree": "Degree obtained",
          "start": "Start year as string (e.g., '2014')",
          "end": "End year as string (e.g., '2018')"
        }
      ]
    }

     ## Instructions:

     ### General Processing Rules
     - Extract information from the resume text and map it to this exact JSON structure.
     - If information is missing, use reasonable defaults or leave optional fields empty.
     - Ensure all required fields are present with appropriate data types.
     - IMPORTANT: All date fields (start, end) must be strings, not numbers.
     ${languageInstruction}

     ### Content Generation & AI Completion
     ${completionInstruction}

     ### Skills Handling
     - Extract relevant skills from the resume (up to 10).

     ### Contacts and Social Media
     - If the resume doesn't contain the full link to a social media website, leave the username/link as empty strings for the specific social media websites.
     - Only include social media usernames if explicitly mentioned in the resume.
     - The username never contains any spaces, so only return the full username for the website if it is present; otherwise, don't return it.
     - Do not change, reformat, or normalize the username in any way.
     - Extract the username EXACTLY as it appears in the provided text or URL, preserving all characters, hyphens, numbers, and letter casing.
     - The username must be taken from the last segment of the URL path (after the final '/'), excluding any query parameters or fragments.
     - If the resume does not contain a valid username for that platform, return an empty string.

    ## Resume text:

    ${resumeText}
    `);

    try {
      const { output } = await generateText({
        model: google(targetModel) as any,
        maxRetries: 2,
        maxOutputTokens: 4096,
        output: Output.object({
          schema: ResumeDataSchema,
        }),
        prompt: promptText,
      });
      console.log('[generateResumeObject] Gemini generation completed');

      const endTime = Date.now();
      console.log(
        `[generateResumeObject] Total time: ${(endTime - startTime) / 1000} seconds`
      );

      return output;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isRateLimit =
        errorMsg.includes('Quota exceeded') ||
        errorMsg.includes('rate-limit') ||
        errorMsg.includes('429') ||
        error?.status === 429;

      if (isRateLimit) {
        console.warn('[generateResumeObject] Gemini rate limit hit. Attempting Groq fallback...');
        try {
          const groqOutput = await generateWithGroq(promptText);
          console.log('[generateResumeObject] Groq fallback successful');
          return groqOutput;
        } catch (groqError: any) {
          console.error('[generateResumeObject] Groq fallback also failed:', groqError);
        }
      }

      if (attempt < attempts) {
        console.warn(`[generateResumeObject] Gemini error (Attempt ${attempt}/${attempts}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
        continue;
      }

      const msg =
        error instanceof Error
          ? `${error.constructor.name}: ${error.message.slice(0, 120)}`
          : String(error).slice(0, 120);
      console.warn(`[generateResumeObject] Attempt ${attempt} failed: ${msg}`);
      if (attempt === attempts) {
        return undefined;
      }
    }
  }
};
