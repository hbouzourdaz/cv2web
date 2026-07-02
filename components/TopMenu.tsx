import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Show, UserButton } from '@clerk/nextjs';

export function TopMenu() {
  return (
    <>
      <header className="w-full py-0 sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 shadow-sm">
        <div className="flex justify-between items-center max-w-4xl mx-auto h-[60px] px-4 sm:px-6 md:px-4">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src="/logo.svg" alt="CV2Web Logo" className="h-[24px] sm:h-[28px] w-auto transition-opacity group-hover:opacity-80" />
          </Link>

          <div>
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <div className="flex flex-row gap-1.5 sm:gap-2 font-mono items-center">
                <a
                  href="https://github.com/hbouzourdaz/cv2web"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    variant="ghost"
                    className="flex flex-row gap-1 py-1.5 sm:py-2 px-2 sm:px-3 text-neutral-500 hover:text-neutral-700 text-xs sm:text-sm font-medium hover:bg-neutral-100 rounded-lg transition-all duration-150"
                  >
                    <img
                      src="/github.svg"
                      alt="Github Logo"
                      className="size-[14px] opacity-60"
                    />
                    <span className="hidden sm:inline">GitHub</span>
                  </Button>
                </a>
                <Link href="/upload">
                  <Button
                    variant="default"
                    className="text-xs sm:text-sm font-semibold py-1.5 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-md shadow-purple-100 transition-all duration-200 rounded-lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </Show>
          </div>
        </div>
      </header>
    </>
  );
}
