import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUrl(username: string) {
  const domain =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://cv2web.vercel.app';
  return `${domain}/${username}`;
}

export const TOGETHER_LINK = 'https://togetherai.link/';
export const GEMINI_LINK = 'https://deepmind.google/technologies/gemini/';
