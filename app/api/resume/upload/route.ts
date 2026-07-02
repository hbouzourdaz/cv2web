import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { storeResume } from '@/lib/server/redisActions';
import * as pdfjs from 'pdfjs-dist';

// Maximum PDF size: 15 MB
const MAX_PDF_SIZE = 15 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: 'PDF exceeds maximum allowed size of 15 MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      text += pageText + '\n';
    }

    await pdf.destroy();

    // Store in Upstash Redis
    await storeResume(user.id, {
      file: {
        name: file.name,
        size: file.size,
        url: null,
        bucket: null,
        key: null,
      },
      fileContent: text,
      resumeData: null,
      status: 'draft',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error parsing/uploading resume:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
