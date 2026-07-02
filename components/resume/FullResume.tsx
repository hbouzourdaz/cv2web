import LoadingFallback from '../LoadingFallback';
import { ResumeData } from '../../lib/server/redisActions';
import { Education } from './Education';
import { Header } from './Header';
import { Skills } from './Skills';
import { Summary } from './Summary';
import { WorkExperience } from './WorkExperience';

const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', sans-serif",
  playfair: "'Playfair Display', serif",
  jetbrains: "'JetBrains Mono', monospace",
  roboto: "'Roboto', sans-serif",
  tajawal: "'Tajawal', sans-serif",
  cairo: "'Cairo', sans-serif",
};

export const FullResume = ({
  resume,
  profilePicture,
  isRtl = false,
  selectedFont = 'inter',
}: {
  resume?: ResumeData | null;
  profilePicture?: string;
  isRtl?: boolean | null;
  selectedFont?: string | null;
}) => {
  if (!resume) {
    return <LoadingFallback message="Loading Resume..." />;
  }

  const fontFamily = FONT_FAMILIES[selectedFont || 'inter'] || FONT_FAMILIES.inter;

  return (
    <>
      {/* Google Fonts Preconnect and Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Roboto:wght@300;400;500;700&family=Tajawal:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />

      <section
        className="mx-auto w-full max-w-2xl space-y-8 bg-white print:space-y-4 my-8 px-4"
        style={{ fontFamily }}
        dir={isRtl ? 'rtl' : 'ltr'}
        aria-label="Resume Content"
      >
        <Header header={resume?.header} picture={profilePicture} />

        <div className="flex flex-col gap-6">
          <Summary summary={resume?.summary} />

          <WorkExperience work={resume?.workExperience} />

          <Education educations={resume.education} />

          <Skills skills={resume.header.skills} />
        </div>
      </section>
    </>
  );
};
