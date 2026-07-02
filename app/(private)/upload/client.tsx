'use client';

import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/ui/dropzone';
import { Linkedin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserActions } from '@/hooks/useUserActions';
import { useEffect, useState } from 'react';
import { CustomSpinner } from '@/components/CustomSpinner';
import LoadingFallback from '@/components/LoadingFallback';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

type FileState =
  | { status: 'empty' }
  | { status: 'saved'; file: { name: string; url: string; size: number } };

export default function UploadPageClient() {
  const router = useRouter();

  const { resumeQuery, uploadResumeMutation } = useUserActions();
  const [fileState, setFileState] = useState<FileState>({ status: 'empty' });
  const [targetLanguage, setTargetLanguage] = useState<string>('english');
  const [completeWithAi, setCompleteWithAi] = useState<boolean>(true);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Profile scraping states
  const [activeTab, setActiveTab] = useState<'upload' | 'profile'>('upload');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [profileType, setProfileType] = useState<string>('linkedin');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const resume = resumeQuery.data?.resume;

  // Update fileState whenever resume changes
  useEffect(() => {
    if (resume?.file?.name && resume.file.size !== undefined && resume.file.size !== null) {
      setFileState({
        status: 'saved',
        file: {
          name: resume.file.name,
          url: resume.file.url || '',
          size: resume.file.size,
        },
      });
    }
    
    // Initialize settings from DB if present
    if (resume) {
      if (resume.targetLanguage) {
        setTargetLanguage(resume.targetLanguage);
      }
      if (resume.completeWithAi !== undefined && resume.completeWithAi !== null) {
        setCompleteWithAi(resume.completeWithAi);
      }
    }
  }, [resume]);

  const handleUploadFile = async (file: File) => {
    uploadResumeMutation.mutate(file);
  };

  const handleReset = () => {
    setFileState({ status: 'empty' });
  };

  const handleGenerateWebsite = async () => {
    if (!resume) return;
    setIsSavingSettings(true);
    try {
      const updatedResume = {
        ...resume,
        targetLanguage,
        completeWithAi,
        // Clear old resumeData to force re-generation with the new configuration
        resumeData: null,
      };

      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedResume),
      });

      if (!response.ok) {
        throw new Error('Failed to update resume settings');
      }

      router.push('/pdf');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleImportProfile = async () => {
    if (!profileUrl.trim()) {
      toast.error('Please enter a profile URL');
      return;
    }
    setIsImporting(true);
    try {
      const response = await fetch('/api/resume/scrape-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: profileUrl,
          profileType,
          targetLanguage,
          completeWithAi,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import profile');
      }

      toast.success('Successfully imported and queued profile details!');
      router.push('/pdf');
    } catch (error: any) {
      toast.error(error.message || 'Failed to import profile');
    } finally {
      setIsImporting(false);
    }
  };

  if (resumeQuery.isLoading) {
    return <LoadingFallback message="Loading..." />;
  }

  const isUpdating = resumeQuery.isPending || uploadResumeMutation.isPending || isImporting;

  return (
    <div className="flex flex-col items-center flex-1 px-4 py-12 gap-6 w-full bg-gradient-to-b from-[#F5F4FF] via-white to-white min-h-screen">
      <div className="w-full max-w-[400px] sm:max-w-[438px] text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-purple-500 font-semibold mb-1">✦ CV2WEB</p>
        <h1 className="text-xl font-bold text-neutral-900 text-center pb-6 leading-snug">
          Generate your website in seconds
        </h1>

        {/* Tab Switcher — pill style */}
        <div className="flex bg-neutral-100 rounded-xl p-1 mb-6 w-full gap-1 select-none">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'upload'
                ? 'bg-white text-purple-700 shadow-sm border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            📄 PDF
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono hidden sm:inline ${
              activeTab === 'upload' ? 'bg-purple-100 text-purple-600' : 'bg-neutral-200 text-neutral-400'
            }`}>Recommended</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-white text-purple-700 shadow-sm border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            🌐 Online Profile
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono hidden sm:inline ${
              activeTab === 'profile' ? 'bg-purple-100 text-purple-600' : 'bg-neutral-200 text-neutral-400'
            }`}>Optional</span>
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="relative mx-2.5">
            {fileState.status !== 'empty' && (
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full z-10"
                disabled={isUpdating}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}

            <Dropzone
              accept={{ 'application/pdf': ['.pdf'] }}
              maxFiles={1}
              icon={
                fileState.status !== 'empty' ? (
                  <img src="/uploaded-pdf.svg" className="h-6 w-6" />
                ) : (
                  <Linkedin className="h-6 w-6 text-gray-600" />
                )
              }
              title={
                <span className="text-base font-bold text-center text-design-black">
                  {fileState.status !== 'empty'
                    ? fileState.file.name
                    : 'Upload PDF'}
                </span>
              }
              description={
                <span className="text-xs font-light text-center text-design-gray">
                  {fileState.status !== 'empty'
                    ? `${(fileState.file.size / 1024 / 1024).toFixed(2)} MB`
                    : 'Resume or LinkedIn PDF'}
                </span>
              }
              isUploading={uploadResumeMutation.isPending}
              onDrop={(acceptedFiles) => {
                if (acceptedFiles[0]) handleUploadFile(acceptedFiles[0]);
              }}
              onDropRejected={() => toast.error('Only PDF files are supported')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mx-2.5 p-5 border border-purple-100 rounded-xl bg-white text-left shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono flex items-center gap-1.5">
              <span>🌐</span> Online Profile Import
            </h2>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-platform" className="text-xs font-semibold text-neutral-500">
                Platform
              </label>
              <select
                id="profile-platform"
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
                className="w-full text-sm font-mono p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 bg-neutral-50 cursor-pointer transition-all duration-150"
                disabled={isUpdating || isSavingSettings}
              >
                <option value="linkedin">LinkedIn 💼</option>
                <option value="scholar">Google Scholar 🎓</option>
                <option value="researchgate">ResearchGate 🔬</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-url" className="text-xs font-semibold text-neutral-500">
                Profile URL
              </label>
              <input
                type="url"
                id="profile-url"
                placeholder={
                  profileType === 'linkedin'
                    ? 'https://linkedin.com/in/username'
                    : profileType === 'scholar'
                    ? 'https://scholar.google.com/citations?user=...'
                    : 'https://www.researchgate.net/profile/...'
                }
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                className="w-full text-sm font-mono p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 bg-neutral-50 transition-all duration-150"
                disabled={isUpdating || isSavingSettings}
              />
              <p className="text-[11px] text-neutral-400 leading-normal">
                Paste the full public URL to your profile page.
              </p>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {(fileState.status !== 'empty' || activeTab === 'profile') && (
          <div className="mt-4 p-5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm text-left flex flex-col gap-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono flex items-center gap-1.5">
              <span>⚙️</span> Website Configuration
            </h2>

            {/* Language Selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="language-select" className="text-xs font-semibold text-neutral-500">
                Output Language
              </label>
              <select
                id="language-select"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full text-sm font-mono p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 bg-neutral-50 cursor-pointer transition-all duration-150"
                disabled={isUpdating || isSavingSettings}
              >
                <option value="english">English 🇺🇸</option>
                <option value="french">French 🇫🇷</option>
                <option value="arabic">Arabic 🇸🇦</option>
                <option value="spanish">Spanish 🇪🇸</option>
                <option value="german">German 🇩🇪</option>
              </select>
              <p className="text-[11px] text-neutral-400">
                AI will generate all website content in this language.
              </p>
            </div>

            {/* AI Completion Choice */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-purple-50/50 hover:border-purple-200 transition-all duration-150" onClick={() => !isUpdating && !isSavingSettings && setCompleteWithAi(!completeWithAi)}>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-neutral-800">✨ AI Auto-Complete</span>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Fills missing sections with smart AI-generated content.
                </p>
              </div>
              <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ml-4 ${ completeWithAi ? 'bg-purple-600' : 'bg-neutral-300' }`}>
                <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${ completeWithAi ? 'translate-x-4' : 'translate-x-0.5' }`} />
                <input
                  type="checkbox"
                  id="complete-ai-checkbox"
                  checked={completeWithAi}
                  onChange={(e) => setCompleteWithAi(e.target.checked)}
                  className="sr-only"
                  disabled={isUpdating || isSavingSettings}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[400px] sm:max-w-[438px]">
        <div className="relative">
          {activeTab === 'upload' ? (
            <>
              <Button
                className="w-full px-4 py-3 h-auto font-bold text-base bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all duration-200 rounded-xl disabled:opacity-50 disabled:shadow-none"
                disabled={fileState.status === 'empty' || isUpdating || isSavingSettings}
                onClick={handleGenerateWebsite}
              >
                {isUpdating || isSavingSettings ? (
                  <>
                    <CustomSpinner className="h-5 w-5 mr-2" />
                    {isSavingSettings ? 'Configuring AI...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <img
                      src="/sparkle.png"
                      alt="Sparkle Icon"
                      className="h-5 w-5 mr-2"
                    />
                    Generate My Website
                  </>
                )}
              </Button>
              {fileState.status === 'empty' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="absolute inset-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload a PDF to continue</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          ) : (
            <Button
              className="w-full px-4 py-3 h-auto font-bold text-base bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all duration-200 rounded-xl disabled:opacity-50 disabled:shadow-none"
              disabled={!profileUrl.trim() || isUpdating}
              onClick={handleImportProfile}
            >
              {isImporting ? (
                <>
                  <CustomSpinner className="h-5 w-5 mr-2" />
                  Importing Profile...
                </>
              ) : (
                <>
                  <img
                    src="/sparkle.png"
                    alt="Sparkle Icon"
                    className="h-5 w-5 mr-2"
                  />
                  Generate My Website
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
