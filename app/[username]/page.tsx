import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FullResume } from '@/components/resume/FullResume';
import { Metadata } from 'next';
import { getUserData } from './utils';

export const dynamic = 'force-dynamic';

const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', sans-serif",
  playfair: "'Playfair Display', serif",
  jetbrains: "'JetBrains Mono', monospace",
  roboto: "'Roboto', sans-serif",
  tajawal: "'Tajawal', sans-serif",
  cairo: "'Cairo', sans-serif",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const { user_id, resume, clerkUser } = await getUserData(username);

  if (!user_id) {
    return {
      title: 'User Not Found | Hakim Bouzourdaz',
      description: 'This user profile could not be found.',
    };
  }

  if (!resume?.resumeData || resume.status !== 'live') {
    return {
      title: 'Resume Not Found | Hakim Bouzourdaz',
      description: 'This resume could not be found.',
    };
  }

  return {
    title: `${resume.resumeData.header.name}'s Resume | Hakim Bouzourdaz`,
    description: resume.resumeData.summary,
    openGraph: {
      title: `${resume.resumeData.header.name}'s Resume | Hakim Bouzourdaz`,
      description: resume.resumeData.summary,
      images: [
        {
          url: `https://cv2web.com/${username}/og`,
          width: 1200,
          height: 630,
          alt: `${resume.resumeData.header.name}'s Resume | CV2Web`,
        },
      ],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { user_id, resume, clerkUser } = await getUserData(username);

  if (!user_id) redirect(`/?usernameNotFound=${username}`);
  if (!resume?.resumeData || resume.status !== 'live')
    redirect(`/?idNotFound=${user_id}`);

  const profilePicture = clerkUser?.imageUrl;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: resume.resumeData.header.name,
    image: profilePicture,
    jobTitle: resume.resumeData.header.shortAbout,
    description: resume.resumeData.summary,
    email:
      resume.resumeData.header.contacts.email &&
      `mailto:${resume.resumeData.header.contacts.email}`,
    url: `https://cv2web.com/${username}`,
    skills: resume.resumeData.header.skills,
  };

  const fontFamily = FONT_FAMILIES[resume?.selectedFont || 'inter'] || FONT_FAMILIES.inter;

  return (
    <div dir={resume?.isRtl ? 'rtl' : 'ltr'} style={{ fontFamily }} className="min-h-screen">
      {/* Google Fonts Preconnect and Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Roboto:wght@300;400;500;700&family=Tajawal:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <FullResume
        resume={resume?.resumeData}
        profilePicture={profilePicture}
        isRtl={resume?.isRtl}
        selectedFont={resume?.selectedFont}
      />

      <div className="text-center mt-8 mb-4 flex flex-col items-center gap-1">
        <Link
          href={`/?ref=${username}`}
          className="text-design-gray font-mono text-sm"
        >
          Made by{' '}
          <span className="text-design-black underline underline-offset-2">
            Hakim BOUZOURDAZ
          </span>
        </Link>
        <p className="text-[11px] text-neutral-400 font-mono">
          © {new Date().getFullYear()} CV2Web
        </p>
      </div>
    </div>
  );
}
