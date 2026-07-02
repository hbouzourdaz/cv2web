import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getResume, storeResume } from '@/lib/server/redisActions';

function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';
    let name = lastPart
      .replace(/[-_]/g, ' ')
      .replace(/\d+/g, '')
      .trim();
    return name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  } catch {
    return '';
  }
}

function parseScholarHtml(html: string): string {
  const nameMatch = html.match(/id="gsc_prf_in">([^<]+)</);
  const name = nameMatch ? nameMatch[1].trim() : '';

  const affMatch = html.match(/class="gsc_prf_il">([^<]+)</);
  const affiliation = affMatch ? affMatch[1].trim() : '';

  const publicationMatches = [...html.matchAll(/class="gsc_a_at">([^<]+)<\/a>.*?class="gs_gray">([^<]+)<\/div>.*?class="gs_gray">([^<]+)<\/div>/g)];
  const publications = publicationMatches.map((m) => {
    return `- Title: ${m[1].trim()}\n  Authors: ${m[2].trim()}\n  Source: ${m[3].trim()}`;
  }).join('\n');

  return `Candidate Name: ${name}\nAffiliation: ${affiliation}\nPublications:\n${publications}`;
}

function parseResearchGateHtml(html: string): string {
  const nameMatch = html.match(/<h1[^>]*class="[^"]*profile-header-name[^"]*"[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+) - ResearchGate<\/title>/i);
  const name = nameMatch ? nameMatch[1].trim() : '';

  const instMatch = html.match(/class="[^"]*institution-name[^"]*"[^>]*>([^<]+)</i);
  const institution = instMatch ? instMatch[1].trim() : '';

  return `Candidate Name: ${name}\nInstitution: ${institution}\nThis is a ResearchGate profile.`;
}

function cleanHtmlToText(html: string): string {
  let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, profileType, targetLanguage, completeWithAi } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const extractedName = extractNameFromUrl(url);

    // Fetch the URL content
    let fileContent = '';
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      
      if (profileType === 'scholar') {
        fileContent = parseScholarHtml(html);
      } else if (profileType === 'researchgate') {
        fileContent = parseResearchGateHtml(html);
      } else {
        fileContent = cleanHtmlToText(html);
      }
    } catch (e: any) {
      console.warn(`Scraping failed for ${url}:`, e);
      fileContent = `Candidate Name: ${extractedName || 'User'}\nProfile URL: ${url}\nProfile Type: ${profileType}\nThis is a public profile imported from ${profileType}.`;
    }

    // Get current resume or create a default one
    let resume = await getResume(user.id);
    if (!resume) {
      resume = {
        status: 'draft',
      };
    }

    // Save to Redis
    const updatedResume = {
      ...resume,
      file: {
        name: `${profileType}_Import.pdf`, // simulated file name
        url: url,
        size: 0,
      },
      fileContent: fileContent,
      resumeData: null, // Clear old data to force regeneration
      targetLanguage: targetLanguage || 'english',
      completeWithAi: completeWithAi !== undefined ? completeWithAi : true,
    };

    await storeResume(user.id, updatedResume);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error importing profile:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
