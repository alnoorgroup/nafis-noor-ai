import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Copy } from 'lucide-react';
import { HadithRefData, NoorAIMessage, QuranRefData } from '../../types';

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function detectTextDirection(text?: string): 'rtl' | 'ltr' {
  if (!text) return 'ltr';
  const trimmed = text.trim();
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ARABIC_CHAR_REGEX.test(ch)) return 'rtl';
    if (/[A-Za-z]/.test(ch)) return 'ltr';
  }
  return ARABIC_CHAR_REGEX.test(trimmed) ? 'rtl' : 'ltr';
}

interface TableSegment {
  type: 'table';
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

interface MarkdownSegment {
  type: 'markdown';
  content: string;
}

type Segment = TableSegment | MarkdownSegment;

function parseAlignment(cell: string): 'left' | 'center' | 'right' {
  const t = cell.trim();
  const startsColon = t.startsWith(':');
  const endsColon = t.endsWith(':');
  if (startsColon && endsColon) return 'center';
  if (endsColon) return 'right';
  return 'left';
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim();
  const stripped = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return stripped.split('|').map((c) => c.trim());
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
  const cells = splitTableRow(trimmed);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function segmentMarkdownWithTables(raw: string): Segment[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const segments: Segment[] = [];
  let mdBuffer: string[] = [];
  let inFencedCode = false;

  const flushMarkdown = () => {
    if (mdBuffer.length > 0) {
      const content = mdBuffer.join('\n').trim();
      if (content) {
        segments.push({ type: 'markdown', content });
      }
      mdBuffer = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inFencedCode = !inFencedCode;
      mdBuffer.push(line);
      i++;
      continue;
    }

    if (
      !inFencedCode &&
      i + 1 < lines.length &&
      line.includes('|') &&
      isTableSeparatorLine(lines[i + 1])
    ) {
      const headers = splitTableRow(line);
      const alignments = splitTableRow(lines[i + 1]).map(parseAlignment);

      if (headers.length > 0 && alignments.length === headers.length) {
        flushMarkdown();
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length) {
          const rowLine = lines[i];
          if (!rowLine.trim() || !rowLine.includes('|')) break;
          const cells = splitTableRow(rowLine);
          const normalized = headers.map((_, idx) => cells[idx] ?? '');
          rows.push(normalized);
          i++;
        }
        segments.push({ type: 'table', headers, alignments, rows });
        continue;
      }
    }

    mdBuffer.push(line);
    i++;
  }

  flushMarkdown();
  return segments;
}

const CodeBlock: React.FC<{
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
}> = ({ children, className, isDark = false }) => {
  const [copied, setCopied] = useState(false);
  const codeText = String(children ?? '').replace(/\n$/, '');
  const langMatch = /language-(\w+)/.exec(className || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      dir="ltr"
      className={`my-3.5 w-full max-w-full rounded-xl border overflow-hidden text-left ${
        isDark
          ? 'border-white/[0.1] bg-[#14161A]'
          : 'border-black/[0.09] bg-[#F5F5F3]'
      }`}
    >
      <div
        className={`flex items-center justify-between px-3.5 py-1.5 border-b text-[11px] font-medium ${
          isDark
            ? 'border-white/[0.08] bg-[#1B1D23] text-stone-400'
            : 'border-black/[0.06] bg-[#EBEBE7] text-[#5A5D63]'
        }`}
      >
        <span>{langMatch ? langMatch[1] : 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1.5 rounded ${
            isDark
              ? 'text-stone-400 hover:text-white'
              : 'text-[#5A5D63] hover:text-[#111214]'
          }`}
        >
          {copied ? (
            <Check className={`w-3 h-3 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        className={`p-3.5 overflow-x-auto text-[13.5px] leading-relaxed font-mono ${
          isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
        }`}
      >
        <code>{codeText}</code>
      </pre>
    </div>
  );
};

interface NoorMarkdownProps {
  text: string;
  message?: NoorAIMessage;
  isArabic?: boolean;
  isDark?: boolean;
  isStreaming?: boolean;
}

export const NoorMarkdown: React.FC<NoorMarkdownProps> = ({
  text,
  message,
  isArabic = false,
  isDark = false,
  isStreaming = false,
}) => {
  const segments = segmentMarkdownWithTables(text || '');
  const primaryDir = detectTextDirection(text);

  const renderQuranRef = (qRef?: QuranRefData | string) => {
    if (!qRef) return null;
    if (typeof qRef === 'string') {
      return (
        <blockquote
          dir="auto"
          className={`my-3 border-s-2 ps-3.5 py-1.5 text-[15px] rounded-e-lg ${
            isDark
              ? 'border-white/40 text-[#F3F4F6] bg-white/[0.04]'
              : 'border-black/45 text-[#1E2024] bg-black/[0.025]'
          }`}
        >
          {qRef}
        </blockquote>
      );
    }
    return (
      <div
        dir={detectTextDirection(qRef.textArabic || qRef.textTranslation || qRef.surahName)}
        className={`my-3 border-s-2 ps-3.5 py-2 rounded-e-lg space-y-1.5 ${
          isDark
            ? 'border-white/40 bg-white/[0.04]'
            : 'border-black/45 bg-black/[0.025]'
        }`}
      >
        {qRef.textArabic && (
          <p
            dir="rtl"
            className={`font-arabic text-[18px] leading-[1.9] ${
              isDark ? 'text-white' : 'text-[#111214]'
            }`}
          >
            {qRef.textArabic}
          </p>
        )}
        {qRef.textTranslation && (
          <p
            className={`text-[14.5px] leading-[1.6] ${
              isDark ? 'text-stone-300' : 'text-[#3B3E44]'
            }`}
          >
            {qRef.textTranslation}
          </p>
        )}
        <p
          className={`text-[12px] font-medium ${
            isDark ? 'text-stone-300' : 'text-[#111214]'
          }`}
        >
          {qRef.surahName} {qRef.verseNumber ? `· ${qRef.verseNumber}` : ''}
        </p>
      </div>
    );
  };

  const renderHadithRef = (hRef?: HadithRefData | string) => {
    if (!hRef) return null;
    if (typeof hRef === 'string') {
      return (
        <blockquote
          dir="auto"
          className={`my-3 border-s-2 ps-3.5 py-1.5 text-[14.5px] ${
            isDark
              ? 'border-white/30 text-stone-200'
              : 'border-black/25 text-[#2A2C30]'
          }`}
        >
          {hRef}
        </blockquote>
      );
    }
    return (
      <div
        dir={detectTextDirection(hRef.text)}
        className={`my-3 border-s-2 ps-3.5 py-1.5 space-y-1 ${
          isDark ? 'border-white/30' : 'border-black/25'
        }`}
      >
        <p
          className={`text-[14.5px] leading-[1.65] ${
            isDark ? 'text-stone-200' : 'text-[#2A2C30]'
          }`}
        >
          {hRef.text}
        </p>
        <p className={`text-[12px] font-medium ${isDark ? 'text-stone-400' : 'text-[#5E626A]'}`}>
          {[hRef.collection, hRef.number, hRef.status].filter(Boolean).join(' · ')}
        </p>
      </div>
    );
  };

  return (
    <div
      dir={primaryDir}
      className={`w-full break-words ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}
    >
      {message?.greeting && (
        <p
          dir="auto"
          className={`text-[15px] leading-[1.65] mb-2.5 ${
            isDark ? 'text-stone-400' : 'text-[#4E5259]'
          }`}
        >
          {message.greeting}
        </p>
      )}

      {segments.map((seg, idx) => {
        if (seg.type === 'table') {
          return (
            <div
              key={`tbl-${idx}`}
              className={`my-3.5 w-full overflow-x-auto rounded-xl border ${
                isDark
                  ? 'border-white/[0.1] bg-[#14161A]'
                  : 'border-black/[0.09] bg-white'
              }`}
            >
              <table className="w-full border-collapse text-[14px] leading-snug tabular-nums">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.08]'
                        : 'bg-[#F4F4F1] border-black/[0.08]'
                    }`}
                  >
                    {seg.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        dir="auto"
                        className={`px-3.5 py-2.5 font-semibold whitespace-nowrap ${
                          isDark ? 'text-white' : 'text-[#111214]'
                        }`}
                        style={{ textAlign: seg.alignments[hIdx] }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-white/[0.06]' : 'divide-black/[0.06]'
                  }`}
                >
                  {seg.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-black/[0.015]'
                      }`}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          dir="auto"
                          className={`px-3.5 py-2.5 align-top ${
                            isDark ? 'text-stone-200' : 'text-[#27292D]'
                          }`}
                          style={{ textAlign: seg.alignments[cIdx] }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <ReactMarkdown
            key={`md-${idx}`}
            components={{
              h1: ({ children }) => (
                <h1
                  dir="auto"
                  className={`text-[20px] sm:text-[21px] font-semibold tracking-tight mt-5 mb-2.5 first:mt-0 leading-[1.35] ${
                    isDark ? 'text-white' : 'text-[#111214]'
                  }`}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  dir="auto"
                  className={`text-[18px] font-semibold tracking-tight mt-4.5 mb-2 first:mt-0 leading-[1.35] ${
                    isDark ? 'text-white' : 'text-[#111214]'
                  }`}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  dir="auto"
                  className={`text-[16px] font-semibold mt-3.5 mb-1.5 first:mt-0 leading-[1.4] ${
                    isDark ? 'text-white' : 'text-[#111214]'
                  }`}
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p
                  dir="auto"
                  className={`text-[15.5px] sm:text-[16px] leading-[1.72] my-2.5 first:mt-0 last:mb-0 ${
                    isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                  }`}
                >
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong
                  className={`font-semibold ${
                    isDark ? 'text-white' : 'text-[#111214]'
                  }`}
                >
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className={`italic ${isDark ? 'text-stone-300' : 'text-[#27292D]'}`}>
                  {children}
                </em>
              ),
              ul: ({ children }) => (
                <ul
                  dir="auto"
                  className={`my-2.5 ps-5 list-disc space-y-1.5 text-[15.5px] sm:text-[16px] leading-[1.7] ${
                    isDark ? 'marker:text-stone-300' : 'marker:text-[#111214]'
                  }`}
                >
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol
                  dir="auto"
                  className={`my-2.5 ps-5 list-decimal space-y-1.5 text-[15.5px] sm:text-[16px] leading-[1.7] marker:font-medium ${
                    isDark ? 'marker:text-stone-300' : 'marker:text-[#111214]'
                  }`}
                >
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li dir="auto" className="leading-[1.7] ps-1">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  dir="auto"
                  className={`my-3 border-s-2 ps-3.5 py-1.5 text-[15px] leading-[1.68] rounded-e-lg ${
                    isDark
                      ? 'border-white/40 text-[#F3F4F6] bg-white/[0.04]'
                      : 'border-black/45 text-[#1E2024] bg-black/[0.025]'
                  }`}
                >
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr
                  className={`my-4 border-0 border-t ${
                    isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                  }`}
                />
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium underline underline-offset-3 transition-colors ${
                    isDark
                      ? 'text-white decoration-white/40 hover:decoration-white'
                      : 'text-[#111214] decoration-black/40 hover:decoration-black'
                  }`}
                >
                  {children}
                </a>
              ),
              pre: ({ children }) => {
                const items = React.Children.toArray(children);
                const firstChild = items[0];
                if (React.isValidElement(firstChild)) {
                  const childProps = firstChild.props as {
                    children?: React.ReactNode;
                    className?: string;
                  };
                  return (
                    <CodeBlock className={childProps?.className} isDark={isDark}>
                      {childProps?.children}
                    </CodeBlock>
                  );
                }
                return <CodeBlock isDark={isDark}>{children}</CodeBlock>;
              },
              code: ({ className, children }) => {
                const isBlock = Boolean(className && className.startsWith('language-'));
                if (isBlock) {
                  return <code className={className}>{children}</code>;
                }
                return (
                  <code
                    dir="ltr"
                    className={`px-1.5 py-0.5 rounded font-mono text-[13.5px] border ${
                      isDark
                        ? 'bg-[#1B1D23] text-white border-white/[0.1]'
                        : 'bg-[#F1F1EE] text-[#111214] border-black/[0.06]'
                    }`}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {seg.content}
          </ReactMarkdown>
        );
      })}

      {/* Legacy structured fields from earlier saved conversations */}
      {renderQuranRef(message?.quranReference)}
      {renderHadithRef(message?.hadithReference)}

      {message?.explanation && (
        <p
          dir="auto"
          className={`text-[15.5px] leading-[1.7] mt-3 ${
            isDark ? 'text-stone-300' : 'text-[#27292D]'
          }`}
        >
          {message.explanation}
        </p>
      )}

      {message?.concludingDua && (
        <p
          dir="auto"
          className={`mt-3 pt-2.5 border-t text-[14.5px] leading-[1.65] font-medium ${
            isDark
              ? 'border-white/[0.08] text-white'
              : 'border-black/[0.07] text-[#111214]'
          }`}
        >
          {message.concludingDua}
        </p>
      )}

      {message?.sources && message.sources.length > 0 && (
        <div
          className={`mt-3 pt-2.5 border-t ${
            isDark ? 'border-white/[0.08]' : 'border-black/[0.07]'
          }`}
        >
          <p
            className={`text-[11.5px] font-medium mb-1 ${
              isDark ? 'text-stone-400' : 'text-[#6B6F76]'
            }`}
          >
            {isArabic ? 'المصادر والمراجع' : 'Sources & References'}
          </p>
          <ul
            className={`space-y-1 text-[13px] ${
              isDark ? 'text-stone-300' : 'text-[#4E5259]'
            }`}
          >
            {message.sources.map((src, i) => (
              <li key={i} dir="auto" className="flex items-start gap-1.5">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {i + 1}.
                </span>
                <span>{src}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isStreaming && (
        <span
          aria-hidden="true"
          className={`inline-block w-1.5 h-4 ms-1 align-middle rounded-full animate-pulse ${
            isDark ? 'bg-white' : 'bg-[#111214]'
          }`}
        />
      )}
    </div>
  );
};
