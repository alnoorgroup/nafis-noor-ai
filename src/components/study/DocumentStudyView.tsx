import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  FileText,
  Image as ImageIcon,
  Camera,
  UploadCloud,
  Sparkles,
  BookOpen,
  Layers,
  FileQuestion,
  Lightbulb,
  BookmarkPlus,
  Copy,
  Check,
  Trash2,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Subject, Topic, StudyDocument } from '../../types/study';
import { DocumentAnalysisSkeleton } from '../SkeletonLoaders';
import {
  saveStudyDocument,
  deleteStudyDocument,
  loadStudyData,
  saveStudyNote,
  saveBatchFlashcards,
  recordStudyActivity,
} from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface DocumentStudyViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onNavigateTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

export const DocumentStudyView: React.FC<DocumentStudyViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onNavigateTab,
  onRefreshData,
}) => {
  const [documents, setDocuments] = useState<StudyDocument[]>(() => {
    return loadStudyData().documents;
  });

  const [activeDoc, setActiveDoc] = useState<StudyDocument | null>(() => {
    const docs = loadStudyData().documents;
    return docs.length > 0 ? docs[0] : null;
  });

  const [customQuestion, setCustomQuestion] = useState('');
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [activeActionLabel, setActiveActionLabel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const isImg = file.type.startsWith('image/');
      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const newDoc = saveStudyDocument({
        name: file.name,
        type: isImg ? 'image' : 'pdf',
        sizeFormatted: formattedSize,
        base64Data: base64,
        mimeType: file.type || (isImg ? 'image/jpeg' : 'application/pdf'),
      });

      const updated = loadStudyData().documents;
      setDocuments(updated);
      setActiveDoc(newDoc);
      setActionOutput(null);
      onRefreshData?.();
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = (docId: string) => {
    deleteStudyDocument(docId);
    const updated = loadStudyData().documents;
    setDocuments(updated);
    if (activeDoc?.id === docId) {
      setActiveDoc(updated.length > 0 ? updated[0] : null);
      setActionOutput(null);
    }
    onRefreshData?.();
  };

  const handleRunAction = async (action: 'understand' | 'summarize' | 'important_concepts' | 'make_notes' | 'ask_question') => {
    if (!activeDoc) return;
    setIsLoading(true);
    setCopied(false);
    setSavedSuccess(null);

    let label = 'Analysis';
    if (action === 'understand') label = 'Comprehension Analysis';
    else if (action === 'summarize') label = 'Executive Summary';
    else if (action === 'important_concepts') label = 'Key Concepts & Formulas';
    else if (action === 'make_notes') label = 'Revision Study Notes';
    else if (action === 'ask_question') label = `Q: ${customQuestion}`;
    setActiveActionLabel(label);

    try {
      const res = await fetch(getApiUrl('/api/study/document-action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            data: activeDoc.base64Data,
            mimeType: activeDoc.mimeType,
            name: activeDoc.name,
          },
          action,
          query: customQuestion.trim() || undefined,
          subject: selectedSubject.name,
        }),
      });

      const data = await res.json();
      setActionOutput(data.result || 'No analysis available.');
      if (action === 'ask_question') setCustomQuestion('');
    } catch (err) {
      console.error(err);
      setActionOutput('Error analyzing document with AI. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcardsFromDoc = async () => {
    if (!activeDoc) return;
    setIsLoading(true);
    setActiveActionLabel('Generating Flashcards from Document...');

    try {
      const res = await fetch('/api/study/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          attachment: {
            data: activeDoc.base64Data,
            mimeType: activeDoc.mimeType,
          },
          count: 5,
        }),
      });

      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        saveBatchFlashcards(
          data.flashcards.map((fc: { front: string; back: string }) => ({
            front: fc.front,
            back: fc.back,
            subjectId: selectedSubject.id,
            topicId: selectedTopic?.id,
          }))
        );
        setActionOutput(`✅ Successfully created and saved ${data.flashcards.length} flashcards directly to your deck for ${selectedSubject.name}!`);
        setSavedSuccess('Flashcards created & saved!');
        onRefreshData?.();
      }
    } catch (err) {
      console.error(err);
      setActionOutput('⚠️ Failed to generate flashcards from this document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOutputToNotes = () => {
    if (!actionOutput || !activeDoc) return;
    saveStudyNote({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: `${activeActionLabel} (${activeDoc.name})`,
      content: actionOutput,
      tags: ['Document Study', activeDoc.type.toUpperCase()],
    });
    setSavedSuccess('Saved to Smart Notes!');
    onRefreshData?.();
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleCopy = () => {
    if (!actionOutput) return;
    navigator.clipboard.writeText(actionOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
            <FileText className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>PDF & Image / Camera Study</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            AI multimodal analysis of textbooks, worksheets, handwritten notes, and PDF chapters.
          </p>
        </div>

        {/* Hidden inputs for file and camera */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/[0.08] text-stone-200 bg-[#1B1D23]'
                : 'border-black/[0.08] hover:bg-black/[0.04] text-[#111214] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Photo</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents Library & Active Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`p-4 rounded-3xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 px-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Study Library ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className={`p-6 text-center text-xs border border-dashed rounded-2xl ${
                isDark ? 'text-stone-400 border-white/[0.1]' : 'text-[#5A5D63] border-black/[0.1]'
              }`}>
                <UploadCloud className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-stone-500' : 'text-[#6B6F76]'}`} />
                <p>No documents uploaded yet.</p>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-500' : 'text-[#6B6F76]'}`}>Upload a PDF or snap a worksheet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setActiveDoc(doc);
                        setActionOutput(null);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between gap-2 text-xs transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.1] border-white/35 text-white'
                            : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214]'
                          : isDark
                          ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20 text-stone-300'
                          : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20 text-[#3F4248]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {doc.type === 'pdf' ? (
                          <FileText className={`w-4 h-4 shrink-0 ${isDark ? 'text-stone-300' : 'text-[#111214]'}`} />
                        ) : (
                          <ImageIcon className={`w-4 h-4 shrink-0 ${isDark ? 'text-stone-300' : 'text-[#111214]'}`} />
                        )}
                        <div className="truncate text-left">
                          <p className={`font-bold truncate ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{doc.name}</p>
                          <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>{doc.sizeFormatted}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc.id);
                        }}
                        className={`p-1 transition-colors ${
                          isDark ? 'text-stone-400 hover:text-rose-400' : 'text-[#6B6F76] hover:text-rose-600'
                        }`}
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Document Details */}
          {activeDoc && (
            <div
              className={`p-4 rounded-3xl border space-y-3 ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                  : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-white/[0.08] text-white border-white/[0.14]' : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
                }`}>
                  Selected
                </span>
                <span className={`text-xs font-semibold truncate ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {activeDoc.name}
                </span>
              </div>

              {activeDoc.type === 'image' && activeDoc.base64Data && (
                <div className={`rounded-xl overflow-hidden border max-h-48 flex items-center justify-center ${
                  isDark ? 'border-white/[0.08] bg-[#1B1D23]' : 'border-black/[0.08] bg-[#F3F3F1]'
                }`}>
                  <img
                    src={activeDoc.base64Data}
                    alt={activeDoc.name}
                    loading="lazy"
                    decoding="async"
                    className="object-contain max-h-48 w-full"
                  />
                </div>
              )}

              {/* 1-Click Action Buttons */}
              <div className="space-y-1.5 pt-2">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  AI Study Tools
                </p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('understand')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/35 text-stone-200 hover:bg-white/[0.08]'
                      : 'bg-[#F3F3F1] border-black/[0.08] hover:border-[#111214]/40 text-[#111214] hover:bg-black/[0.04]'
                  }`}
                >
                  <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>Understand this Document</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('summarize')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/35 text-stone-200 hover:bg-white/[0.08]'
                      : 'bg-[#F3F3F1] border-black/[0.08] hover:border-[#111214]/40 text-[#111214] hover:bg-black/[0.04]'
                  }`}
                >
                  <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>Summarize Key Points</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('important_concepts')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/35 text-stone-200 hover:bg-white/[0.08]'
                      : 'bg-[#F3F3F1] border-black/[0.08] hover:border-[#111214]/40 text-[#111214] hover:bg-black/[0.04]'
                  }`}
                >
                  <Lightbulb className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>Extract Important Concepts & Formulas</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGenerateFlashcardsFromDoc}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/35 text-stone-200 hover:bg-white/[0.08]'
                      : 'bg-[#F3F3F1] border-black/[0.08] hover:border-[#111214]/40 text-[#111214] hover:bg-black/[0.04]'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Generate Flashcards from Document</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('make_notes')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/35 text-stone-200 hover:bg-white/[0.08]'
                      : 'bg-[#F3F3F1] border-black/[0.08] hover:border-[#111214]/40 text-[#111214] hover:bg-black/[0.04]'
                  }`}
                >
                  <BookmarkPlus className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>Create Structured Study Notes</span>
                </button>
              </div>

              {/* Specific Question Input */}
              <div className={`pt-2 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  Ask Question About Document
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="e.g. Solve problem #4, What is equation 2..."
                    className={`flex-1 p-2 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6] placeholder-stone-500'
                        : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] placeholder-[#6B6F76]'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={isLoading || !customQuestion.trim()}
                    onClick={() => handleRunAction('ask_question')}
                    className={`p-2 rounded-xl disabled:opacity-40 transition-colors ${
                      isDark
                        ? 'bg-white hover:bg-stone-200 text-[#111214]'
                        : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis & Extraction Output */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <DocumentAnalysisSkeleton
              isDark={isDark}
              label={`AI is reading & processing ${activeDoc?.name || 'document'}...`}
            />
          ) : actionOutput ? (
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-lg space-y-4 animate-fadeIn ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                  : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}
            >
              <div className={`flex items-center justify-between pb-3 border-b text-xs ${
                isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
              }`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {activeActionLabel}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex items-center gap-1 transition-colors ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-[#6B6F76] hover:text-[#111214]'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOutputToNotes}
                    className={`flex items-center gap-1 transition-colors ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-[#6B6F76] hover:text-[#111214]'
                    }`}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save to Notes</span>
                  </button>
                </div>
              </div>

              {savedSuccess && (
                <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  <Check className="w-4 h-4" />
                  <span>{savedSuccess}</span>
                </div>
              )}

              <div className="markdown-study-content space-y-3 leading-relaxed text-xs sm:text-sm">
                <Markdown>{actionOutput}</Markdown>
              </div>
            </div>
          ) : (
            <div
              className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center min-h-[420px] ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08]'
                  : 'bg-white border-black/[0.08]'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 ${
                isDark ? 'bg-white/[0.08] text-white border-white/[0.12]' : 'bg-black/[0.04] text-[#111214] border-black/[0.08]'
              }`}>
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>Select a Document & Tool</h3>
              <p className={`text-xs max-w-sm ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Upload a textbook PDF or photo of notes on the left, then click any action like
                &quot;Understand this Document&quot; or &quot;Extract Formulas&quot;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
