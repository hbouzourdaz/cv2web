import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TopMenu } from '../components/TopMenu';
import { Footer } from '../components/Footer';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { BlurFade } from '@/components/ui/BlurFade';

export default function Home() {
  return (
    <>
      <TopMenu />

      <section className="flex-1 flex flex-col bg-gradient-to-b from-[#F5F4FF] via-white to-white">
        <div className="flex flex-col min-h-[80vh]">
          {/* Main content */}
          <div className="flex-1 flex flex-col md:flex-row max-w-4xl mx-auto items-center px-5 md:px-6 py-12 md:py-0 gap-10 md:gap-0">
            {/* Left side - Call to action */}
            <div className="w-full md:w-1/2 max-w-[420px] flex flex-col justify-center items-center md:items-start">
              <div className="max-w-md text-center md:text-left flex flex-col items-center md:items-start gap-5">
                <div className="inline-flex items-center gap-2 font-mono px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs text-purple-600 font-semibold select-none">
                  <span className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
                  100% free &amp; open source
                </div>

                <h1 className="text-[32px] sm:text-[38px] md:text-[42px] font-extrabold flex items-center justify-center md:justify-start gap-2 sm:gap-3 flex-wrap text-neutral-900 leading-none tracking-tight">
                  <span>Resume</span>
                  <img
                    src="/right-arrow.png"
                    alt="Arrow Right Icon"
                    width={36}
                    height={36}
                    className="inline size-7 sm:size-9 opacity-60"
                  />
                  <span>Website</span>
                  <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">
                    in one click
                  </span>
                  <img
                    src="/highlight-pointer.png"
                    alt="Pointer Icon"
                    width={37}
                    height={37}
                    className="size-7 sm:size-[37px] text-gray-400 animate-float"
                  />
                </h1>

                <p className="text-base text-neutral-500 font-mono leading-relaxed text-center md:text-left">
                  Turn your resume into a stunning personal website — powered by AI.
                </p>

                <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-fit">
                  <Link href="/upload">
                    <Button className="relative group flex items-center bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white px-7 py-3.5 h-auto text-base font-bold overflow-hidden shadow-xl shadow-purple-200 hover:shadow-purple-300 transition-all duration-300 rounded-xl">
                      <div className="h-[120px] w-10 bg-gradient-to-r from-white/10 via-white/40 to-white/10 absolute blur-sm -rotate-45 -left-16 group-hover:left-[150%] duration-500 delay-100" />
                      <img
                        src="/sparkle.png"
                        alt="Sparkle Icon"
                        className="h-5 w-5 mr-2 relative"
                      />
                      <span className="relative">Generate My Website</span>
                    </Button>
                  </Link>

                  <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                    <span>⚡</span> Takes less than 1 minute
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Preview */}
            <div className="w-full md:w-1/2 flex justify-center items-center flex-1 relative max-h-[500px] sm:max-h-[600px] min-w-[50%] lg:min-w-[420px]">
              <BlurFade delay={0.25} inView>
                <div className="relative">
                  {/* Glow behind the image */}
                  <div className="absolute inset-8 rounded-3xl bg-purple-400/20 blur-3xl" />
                  <img
                    src="/cv-home.png"
                    className="relative w-full max-w-[400px] h-full object-cover overflow-hidden drop-shadow-2xl rounded-2xl"
                    alt="CV Website Preview"
                  />
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
