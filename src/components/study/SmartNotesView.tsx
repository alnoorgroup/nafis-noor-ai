import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Notebook,
  Plus,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Eye,
  Edit3,
  Tag,
  Save,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { Subject, Topic, StudyNote } from '../../types/study';
import { saveStudyNote, deleteStudyNote, loadStudyData } from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface SmartNotesViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

export const SmartNotesView: React.FC<SmartNotesViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [notes, setNotes] = useState<StudyNote[]>(() => {
    return loadStudyData().notes;
  });

  const [activeNote, setActiveNote] = useState<StudyNote | null>(() => {
    const all = loadStudyData().notes;
    return all.length > 0 ? all[0] : null;
  });

  // Editor states
  const [isEditing, setIsEditing] = useState(true);
  const [title, setTitle] = useState(activeNote?.title || '');
  const [content, setContent] = useState(activeNote?.content || '');
  const [tagsText, setTagsText] = useState(activeNote?.tags?.join(', ') || '');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const reloadNotes = (newActive?: StudyNote) => {
    const updated = loadStudyData().notes;
    setNotes(updated);
    if (newActive) {
      setActiveNote(newActive);
      setTitle(newActive.title);
      setContent(newActive.content);
      setTagsText(newActive.tags.join(', '));
    } else if (activeNote && !updated.some((n) => n.id === activeNote.id)) {
      const fallback = updated[0] || null;
      setActiveNote(fallback);
      setTitle(fallback?.title || '');
      setContent(fallback?.content || '');
      setTagsText(fallback?.tags?.join(', ') || '');
    }
    onRefreshData?.();
  };

  const handleSelectNote = (n: StudyNote) => {
    setActiveNote(n);
    setTitle(n.title);
    setContent(n.content);
    setTagsText(n.tags?.join(', ') || '');
  };

  const handleCreateNew = () => {
    const newNote = saveStudyNote({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: 'Untitled Note',
      content: '',
      tags: [selectedSubject.name],
    });
    reloadNotes(newNote);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const saved = saveStudyNote({
      id: activeNote?.id,
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: title.trim(),
      content,
      tags,
    });

    setSaveStatus('Saved!');
    reloadNotes(saved);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleDelete = (noteId: string) => {
    deleteStudyNote(noteId);
    reloadNotes();
  };

  const handleAiOrganize = async () => {
    if (!content.trim()) {
      setSaveStatus('Please enter or paste some rough notes first.');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsOrganizing(true);
    try {
      const res = await fetch(getApiUrl('/api/study/organize-notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: content,
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
        }),
      });

      const data = await res.json();
      if (data.structuredNotes) {
        setContent(data.structuredNotes);
        setSaveStatus('Organized by AI! Review & save.');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Failed to organize notes. Please try again.');
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter notes for selected subject
  const subjectNotes = notes.filter((n) => n.subjectId === selectedSubject.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
            <Notebook className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>AI Smart Notes</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            Structured study notes with automated AI formatting and revision summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNew}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Notes List */}
        <div className="lg:col-span-4 space-y-3">
          <div
            className={`p-4 rounded-3xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className={`flex items-center justify-between text-xs mb-3 px-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              <span className="font-bold uppercase tracking-wider">
                {selectedSubject.name} Notes ({subjectNotes.length})
              </span>
            </div>

            {subjectNotes.length === 0 ? (
              <div className={`p-8 text-center text-xs border border-dashed rounded-2xl ${
                isDark ? 'text-stone-400 border-white/[0.1]' : 'text-[#5A5D63] border-black/[0.1]'
              }`}>
                <Notebook className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-stone-500' : 'text-[#6B6F76]'}`} />
                <p>No notes in this subject yet.</p>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className={`mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214]'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  Create First Note
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {subjectNotes.map((n) => {
                  const isSelected = activeNote?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleSelectNote(n)}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-xs space-y-1 transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.1] border-white/35 text-white'
                            : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214]'
                          : isDark
                          ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20 text-stone-300'
                          : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20 text-[#3F4248]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`font-bold truncate ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{n.title || 'Untitled'}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          className={`p-1 transition-colors ${
                            isDark ? 'text-stone-400 hover:text-rose-400' : 'text-[#6B6F76] hover:text-rose-600'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {n.content || '(Empty content)'}
                      </p>
                      <span className={`text-[10px] font-mono block pt-0.5 ${isDark ? 'text-stone-500' : 'text-[#6B6F76]'}`}>
                        {new Date(n.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Note Editor / Markdown Preview */}
        <div className="lg:col-span-8">
          {activeNote ? (
            <div
              className={`p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                  : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}
            >
              {/* Note Header Toolbar */}
              <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
                isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
              }`}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="font-bold text-base sm:text-lg bg-transparent outline-none flex-1 min-w-[200px]"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiOrganize}
                    disabled={isOrganizing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border disabled:opacity-40 transition-all ${
                      isDark
                        ? 'bg-white/[0.08] text-white border-white/[0.14] hover:bg-white/[0.14]'
                        : 'bg-[#F3F3F1] text-[#111214] border-black/[0.1] hover:bg-black/[0.06]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isOrganizing ? 'Organizing...' : 'AI Organize'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      !isEditing
                        ? isDark
                          ? 'bg-white text-[#111214] border-white'
                          : 'bg-[#111214] text-white border-[#111214]'
                        : isDark
                        ? 'border-white/[0.08] text-stone-300 hover:text-white'
                        : 'border-black/[0.08] text-[#3F4248] hover:text-[#111214]'
                    }`}
                    title={isEditing ? 'Preview Markdown' : 'Edit raw text'}
                  >
                    {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`p-2 rounded-xl border transition-colors ${
                      isDark
                        ? 'border-white/[0.08] text-stone-300 hover:text-white'
                        : 'border-black/[0.08] text-[#3F4248] hover:text-[#111214]'
                    }`}
                    title="Copy note"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-white hover:bg-stone-200 text-[#111214]'
                        : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {saveStatus && (
                <div className={`p-2 rounded-xl border text-xs font-medium ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  {saveStatus}
                </div>
              )}

              {/* Tags line */}
              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                <Tag className="w-3.5 h-3.5 shrink-0" />
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="Comma-separated tags (e.g. Exam 1, Formulas, Chapter 3)"
                  className={`bg-transparent border-b text-xs py-0.5 outline-none flex-1 ${
                    isDark
                      ? 'border-white/[0.08] text-stone-300 placeholder-stone-500'
                      : 'border-black/[0.08] text-[#3F4248] placeholder-[#6B6F76]'
                  }`}
                />
              </div>

              {/* Content Area */}
              {isEditing ? (
                <textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your study notes, paste text, or jot down ideas. Click 'AI Organize' to turn rough notes into formatted exam summaries!"
                  className={`w-full p-4 rounded-2xl text-xs sm:text-sm border outline-none font-mono leading-relaxed resize-y ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6] placeholder-stone-500'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] placeholder-[#6B6F76]'
                  }`}
                />
              ) : (
                <div
                  className={`p-5 rounded-2xl border min-h-[300px] text-xs sm:text-sm leading-relaxed markdown-study-content space-y-3 ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}
                >
                  <Markdown>{content || '*No content to display*'}</Markdown>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`p-16 text-center rounded-3xl border flex flex-col items-center justify-center min-h-[400px] ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08]'
                  : 'bg-white border-black/[0.08]'
              }`}
            >
              <Notebook className={`w-10 h-10 mb-2 ${isDark ? 'text-stone-500' : 'text-[#6B6F76]'}`} />
              <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>No Note Selected</h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Select an existing note from the list or create a new one.
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                Create Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
