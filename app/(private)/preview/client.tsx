'use client';
import LoadingFallback from '@/components/LoadingFallback';
import { PopupSiteLive } from '@/components/PopupSiteLive';
import PreviewActionbar from '@/components/PreviewActionbar';
import { FullResume } from '@/components/resume/FullResume';
import { EditResume } from '@/components/resume/editing/EditResume';
import { useUserActions } from '@/hooks/useUserActions';
import { ResumeData } from '@/lib/server/redisActions';
import { getUrl } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Eye, Edit, Save, X, Trash2, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function PreviewClient({ messageTip }: { messageTip?: string }) {
  const { user } = useUser();
  const router = useRouter();
  const {
    resumeQuery,
    toggleStatusMutation,
    usernameQuery,
    saveResumeDataMutation,
    deleteResumeMutation,
  } = useUserActions();
  const [showModalSiteLive, setModalSiteLive] = useState(false);
  const [localResumeData, setLocalResumeData] = useState<ResumeData>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [selectedFont, setSelectedFont] = useState<string>('inter');
  const [isRtl, setIsRtl] = useState<boolean>(false);

  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter an instruction');
      return;
    }
    if (!localResumeData) {
      toast.error('No resume data found');
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/resume/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentResumeData: localResumeData,
          prompt: aiPrompt,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to edit resume with AI');
      }

      const data = await response.json();
      setLocalResumeData(data.updatedResumeData);
      setHasUnsavedChanges(true);
      setIsEditMode(true);
      setAiPrompt('');
      setIsAiOpen(false);
      toast.success('Gemini successfully updated your resume! Click Save to apply.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to edit resume with AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (resumeQuery.data?.resume) {
      if (resumeQuery.data.resume.resumeData) {
        setLocalResumeData(resumeQuery.data.resume.resumeData);
      }
      if (resumeQuery.data.resume.isRtl !== undefined && resumeQuery.data.resume.isRtl !== null) {
        setIsRtl(resumeQuery.data.resume.isRtl);
      }
      if (resumeQuery.data.resume.selectedFont) {
        setSelectedFont(resumeQuery.data.resume.selectedFont);
      }
    }
  }, [resumeQuery.data?.resume]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || !localResumeData) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        await saveResumeDataMutation.mutateAsync({
          resumeData: localResumeData,
          isRtl,
          selectedFont,
        });
        setHasUnsavedChanges(false);
        toast.success('Autosaved changes', { id: 'autosave' });
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [localResumeData, isRtl, selectedFont, hasUnsavedChanges]);

  console.log('resumeQuery', resumeQuery.data);

  const handleSaveChanges = async () => {
    if (!localResumeData) {
      toast.error('No resume data to save');
      return;
    }

    try {
      await saveResumeDataMutation.mutateAsync({
        resumeData: localResumeData,
        isRtl,
        selectedFont,
      });
      toast.success('Changes saved successfully');
      setHasUnsavedChanges(false);
      setIsEditMode(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to save changes: ${error.message}`);
      } else {
        toast.error('Failed to save changes');
      }
    }
  };

  const handleDiscardChanges = () => {
    // Show confirmation dialog instead of immediately discarding
    setShowDiscardConfirmation(true);
  };

  const confirmDiscardChanges = () => {
    // Reset to original data
    if (resumeQuery.data?.resume) {
      if (resumeQuery.data.resume.resumeData) {
        setLocalResumeData(resumeQuery.data.resume.resumeData);
      }
      setIsRtl(resumeQuery.data.resume.isRtl || false);
      setSelectedFont(resumeQuery.data.resume.selectedFont || 'inter');
    }
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setShowDiscardConfirmation(false);
    toast.info('Changes discarded');
  };

  const handleDeleteResume = async () => {
    try {
      await deleteResumeMutation.mutateAsync();
      toast.success('Resume deleted successfully');
      setShowDeleteConfirmation(false);
      router.push('/upload');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to delete resume: ${error.message}`);
      } else {
        toast.error('Failed to delete resume');
      }
    }
  };

  const handleResumeChange = (newResume: ResumeData) => {
    setLocalResumeData(newResume);
    setHasUnsavedChanges(true);
  };

  if (
    resumeQuery.isLoading ||
    usernameQuery.isLoading ||
    !usernameQuery.data ||
    !localResumeData
  ) {
    return <LoadingFallback message="Loading..." />;
  }

  const CustomLiveToast = () => (
    <div className="w-fit min-w-[360px] h-[44px] items-center justify-between relative rounded-md bg-[#eaffea] border border-[#009505] shadow-md flex flex-row gap-2 px-2">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        preserveAspectRatio="none"
      >
        <rect width="24" height="24" rx="4" fill="#EAFFEA"></rect>
        <path
          d="M16.6668 8.5L10.2502 14.9167L7.3335 12"
          stroke="#009505"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </svg>
      <p className="text-sm text-left text-[#003c02] mr-2">
        <span className="hidden md:block"> Your website has been updated!</span>
        <span className="md:hidden"> Website updated!</span>
      </p>
      <a
        href={getUrl(usernameQuery.data.username)}
        target="_blank"
        className="flex justify-center items-center overflow-hidden gap-1 px-3 py-1 rounded bg-[#009505] h-[26px]"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-grow-0 flex-shrink-0 w-2.5 h-2.5 relative"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M6.86768 2.39591L1.50684 7.75675L2.2434 8.49331L7.60425 3.13248V7.60425H8.64591V1.35425H2.39591V2.39591H6.86768Z"
            fill="white"
          ></path>
        </svg>
        <p className="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-white">
          View
        </p>
      </a>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-background flex flex-col gap-4 pb-8">
      {messageTip && (
        <div className="max-w-3xl mx-auto w-full md:px-0 px-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p>{messageTip}</p>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto w-full md:px-0 px-4">
        <PreviewActionbar
          initialUsername={usernameQuery.data.username}
          status={resumeQuery.data?.resume?.status}
          onStatusChange={async (newStatus) => {
            await toggleStatusMutation.mutateAsync(newStatus);
            const isFirstTime = !localStorage.getItem('publishedSite');

            if (isFirstTime && newStatus === 'live') {
              setModalSiteLive(true);
              localStorage.setItem('publishedSite', new Date().toDateString());
            } else {
              if (newStatus === 'draft') {
                toast.warning('Your website has been unpublished');
              } else {
                toast.custom((t) => <CustomLiveToast />);
              }
            }
          }}
          isChangingStatus={toggleStatusMutation.isPending}
        />
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col md:flex-row justify-between items-center px-4 md:px-0 gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
          <ToggleGroup
            type="single"
            value={isEditMode ? 'edit' : 'preview'}
            onValueChange={(value) => setIsEditMode(value === 'edit')}
            aria-label="View mode"
          >
            <ToggleGroupItem value="preview" aria-label="Preview mode">
              <Eye className="h-4 w-4 mr-1" />
              <span>Preview</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="edit" aria-label="Edit mode">
              <Edit className="h-4 w-4 mr-1" />
              <span>Edit</span>
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Font Selection Dropdown */}
          <div className="flex items-center gap-1.5 font-mono text-xs border rounded-md px-2 h-9 bg-white select-none">
            <span className="text-gray-400 hidden sm:inline">Font:</span>
            <select
              value={selectedFont}
              onChange={(e) => {
                setSelectedFont(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="bg-transparent border-none outline-none focus:ring-0 text-xs font-semibold cursor-pointer text-design-black py-0 pl-0 pr-5 sm:pr-6"
            >
              <option value="inter">Inter (Modern)</option>
              <option value="playfair">Playfair (Elegant)</option>
              <option value="jetbrains">JetBrains (Developer)</option>
              <option value="roboto">Roboto (Clean)</option>
              <option value="tajawal">Tajawal (Arabic)</option>
              <option value="cairo">Cairo (Arabic)</option>
            </select>
          </div>

          {/* RTL Layout Toggle */}
          <div className="flex items-center gap-1.5 font-mono text-xs border rounded-md px-2 h-9 bg-white select-none">
            <input
              type="checkbox"
              id="rtl-toggle"
              checked={isRtl}
              onChange={(e) => {
                setIsRtl(e.target.checked);
                setHasUnsavedChanges(true);
              }}
              className="h-3.5 w-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="rtl-toggle" className="font-semibold text-gray-700 cursor-pointer text-[11px] sm:text-xs">
              RTL
            </label>
          </div>

          {/* AI Copilot Sheet Trigger */}
          <Sheet open={isAiOpen} onOpenChange={setIsAiOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-1.5 border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 font-medium font-mono h-9 px-2 sm:px-3"
              >
                <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                <span className="hidden sm:inline">AI Copilot</span>
                <span className="sm:hidden">AI</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md flex flex-col h-full font-mono">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-2 font-mono">
                  <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                  <span>Resume AI Copilot</span>
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  Ask Gemini to refine your bio, translate text, rewrite experience bullet points, or add new skills.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 py-4 flex flex-col gap-4 overflow-y-auto pr-1">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-500">Your Instructions</label>
                  <Textarea
                    placeholder="e.g., 'Change my location to Paris, France and rewrite my summary to sound more like a Senior Backend Engineer.'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[120px] font-mono text-sm leading-relaxed"
                    disabled={isAiLoading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-gray-500">Suggested Edits</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '✍️ Refine Summary', text: 'Rewrite my summary to sound highly professional, engaging, and modern.' },
                      { label: '🛠️ Suggest Skills', text: 'Analyze my work experience and add relevant missing technical skills to my list.' },
                      { label: '📈 Optimize Experience', text: 'Rewrite my work experiences using active action verbs and bullet points for maximum impact.' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setAiPrompt(item.text)}
                        className="text-[11px] px-2.5 py-1.5 rounded-full border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-800 transition-colors text-left font-mono"
                        disabled={isAiLoading}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-gray-500">Translate Resume</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '🇫🇷 French', text: 'Translate all my resume content (summary, about, experiences, education, titles) into French.' },
                      { label: '🇸🇦 Arabic', text: 'Translate all my resume content (summary, about, experiences, education, titles) into Arabic.' },
                      { label: '🇪🇸 Spanish', text: 'Translate all my resume content (summary, about, experiences, education, titles) into Spanish.' },
                      { label: '🇩🇪 German', text: 'Translate all my resume content (summary, about, experiences, education, titles) into German.' },
                    ].map((lang) => (
                      <button
                        key={lang.label}
                        onClick={() => setAiPrompt(lang.text)}
                        className="text-[11px] px-2.5 py-1.5 rounded-full border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-800 transition-colors font-mono"
                        disabled={isAiLoading}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-md p-3 text-xs text-purple-800 leading-relaxed mt-auto">
                  <strong>How it works:</strong> Gemini will update the editable fields in real time. You can review all changed fields directly in the form, and choose to <strong>Save</strong> or <strong>Discard</strong> them!
                </div>
              </div>

              <div className="pt-4 border-t flex flex-col gap-2">
                <Button
                  onClick={handleAiSubmit}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-mono"
                  disabled={isAiLoading}
                >
                  {isAiLoading ? (
                    <>
                      <span className="animate-spin mr-2">⚡</span>
                      Thinking and Editing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Apply Edits
                    </>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-2 text-xs font-mono select-none px-3 py-1.5 rounded-full border bg-white shadow-sm">
            {saveResumeDataMutation.isPending ? (
              <span className="flex items-center gap-1.5 text-purple-600 font-bold">
                <span className="animate-spin">⚡</span> Autosaving changes...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-600 font-semibold">✍️ Saving edits soon...</span>
            ) : (
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <span>✓</span> Autosaved in real-time
              </span>
            )}
          </div>
        )}

        {!isEditMode && (
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirmation(true)}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
            disabled={deleteResumeMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full md:rounded-lg border-[0.5px] border-neutral-300 flex items-center justify-between px-4">
        {isEditMode ? (
          <EditResume
            resume={localResumeData}
            onChangeResume={handleResumeChange}
          />
        ) : (
          <FullResume
            resume={localResumeData}
            profilePicture={user?.imageUrl}
            isRtl={isRtl}
            selectedFont={selectedFont}
          />
        )}
      </div>

      <AlertDialog
        open={showDiscardConfirmation}
        onOpenChange={setShowDiscardConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard your changes? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardChanges}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your resume? This action cannot
              be undone and your public profile will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResume}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PopupSiteLive
        isOpen={showModalSiteLive}
        websiteUrl={getUrl(usernameQuery.data.username)}
        onClose={() => {
          setModalSiteLive(false);
        }}
      />
    </div>
  );
}
