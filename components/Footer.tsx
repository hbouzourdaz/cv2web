import { GEMINI_LINK } from '@/lib/utils';

export function Footer() {
  return (
    <footer className="w-full py-5 px-6 mt-auto border-t border-neutral-100 bg-white/60 backdrop-blur-sm">
      <div className="max-w-4xl justify-between items-center mx-auto w-full flex flex-col-reverse md:flex-row gap-3">
        <div className="text-xs text-neutral-400 font-mono flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5">
          <span>Powered by</span>
          <a
            target="_blank"
            href={GEMINI_LINK}
            className="text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2 transition-colors"
          >
            Google Gemini
          </a>
          <span className="text-neutral-300 hidden sm:inline">·</span>
          <span>& Groq Llama 3.3</span>
          <span className="text-neutral-300 hidden sm:inline">·</span>
          <span className="text-[11px]">© {new Date().getFullYear()} CV2Web — Hakim BOUZOURDAZ</span>
        </div>

        <div className="flex gap-2 items-center">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/hbouzourdaz/cv2web"
            className="size-7 flex items-center justify-center border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-150"
          >
            <img src="/footer/github.svg" className="size-3.5" />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://x.com/hbouzourdaz21"
            className="size-7 flex items-center justify-center border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-150"
          >
            <img src="/footer/x.svg" className="size-3.5" />
            <span className="sr-only">Twitter / X</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
