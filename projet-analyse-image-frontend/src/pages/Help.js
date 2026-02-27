import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchIndex, fetchPage } from '../services/docsService';

// ── Icon map ────────────────────────────────────────────────────────────────
const IconMap = {
  rocket: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  folder: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  database: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3M4 7v5c0 1.657 3.582 3 8 3s8-1.343 8-3V7M4 7v5m16-5v5m-16 5c0 1.657 3.582 3 8 3s8-1.343 8-3v-5" />
    </svg>
  ),
  question: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  ),
};

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-night-700 rounded ${className}`} />
  );
}

// ── Markdown renderer with custom Tailwind styling ───────────────────────────
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-night-600 gradient-heading">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-900 dark:text-gray-100 border-l-4 border-cyan-400 dark:border-[#00F7FF] pl-3">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer"
      className="text-bioluminescent-400 hover:text-bioluminescent-300 underline underline-offset-2 transition-colors"
    >{children}</a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300 pl-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300 pl-2">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-yellow-400 pl-4 py-1 my-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-r-lg text-gray-700 dark:text-gray-300 italic">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-night-700 rounded text-xs font-mono text-bioluminescent-600 dark:text-bioluminescent-400">
        {children}
      </code>
    ) : (
      <pre className="bg-gray-100 dark:bg-night-700 rounded-lg p-4 overflow-x-auto my-3">
        <code className="text-sm font-mono text-gray-800 dark:text-gray-200">{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-night-600">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 dark:bg-night-700 text-gray-700 dark:text-gray-300 uppercase text-xs">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-200 dark:divide-night-600">{children}</tbody>
  ),
  tr: ({ children }) => <tr className="hover:bg-gray-50 dark:hover:bg-night-700/50">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{children}</td>,
  hr: () => <hr className="my-6 border-gray-200 dark:border-night-600" />,
  strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
};

// ── Main component ───────────────────────────────────────────────────────────
function Help() {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [content, setContent] = useState('');
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState(null);
  const [contentError, setContentError] = useState(null);

  // Load index ----------------------------------------------------------------
  useEffect(() => {
    setLoadingIndex(true);
    setError(null);
    fetchIndex()
      .then((data) => {
        setPages(data.pages || []);
        setLoadingIndex(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not load documentation.');
        setLoadingIndex(false);
      });
  }, []);

  // Select page from URL param OR default to first -------------------------
  useEffect(() => {
    if (!pages.length) return;
    const target = pageId
      ? pages.find((p) => p.id === pageId)
      : pages[0];
    if (target) {
      setActivePage(target);
    }
  }, [pages, pageId]);

  // Load page content --------------------------------------------------------
  useEffect(() => {
    if (!activePage) return;
    setLoadingContent(true);
    setContentError(null);
    fetchPage(activePage.file)
      .then((md) => {
        setContent(md);
        setLoadingContent(false);
      })
      .catch((err) => {
        setContentError(err.message || 'Could not load page content.');
        setLoadingContent(false);
      });
  }, [activePage]);

  const handleSelectPage = useCallback(
    (page) => {
      navigate(`/help/${page.id}`);
      setActivePage(page);
    },
    [navigate]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6 max-w-6xl mx-auto">
      {/* GitHub docs link */}
      <div className="mb-4">
        <a
          href="https://github.com/UniversalBuilder/BIOME/tree/main/docs/user"
          target="_blank"
          rel="noreferrer"
          className="text-bioluminescent-400 hover:text-bioluminescent-300 underline underline-offset-2 text-xs"
        >
          View source docs on GitHub ↗
        </a>
      </div>

      {/* Full-page network error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-700 dark:text-red-300 font-medium mb-1">Could not load documentation</p>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Make sure you are connected to the internet. The docs are hosted on GitHub.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-bioluminescent-500/20 text-bioluminescent-600 dark:text-bioluminescent-400 hover:bg-bioluminescent-500/30 border border-bioluminescent-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main layout: sidebar + content */}
      {!error && (
        <div className="flex gap-6 min-h-[600px]">
          {/* Sidebar */}
          <nav className="w-56 flex-shrink-0">
            <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm overflow-hidden">
              {loadingIndex ? (
                <div className="p-4 space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <ul>
                  {pages.map((page, idx) => {
                    const isActive = activePage?.id === page.id;
                    return (
                      <li key={page.id}>
                        <button
                          onClick={() => handleSelectPage(page)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                            ${idx !== pages.length - 1 ? 'border-b border-gray-100 dark:border-night-700' : ''}
                            ${isActive
                              ? 'bg-bioluminescent-500/10 text-bioluminescent-600 dark:text-bioluminescent-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-night-700'}
                          `}
                          style={isActive ? { borderLeft: '3px solid #00F7FF', paddingLeft: '13px' } : {}}
                          /* Note: borderLeft uses inline style to achieve exactly 3px – Tailwind border-l is 4px */
                        >
                          <span className={isActive ? 'text-bioluminescent-400' : 'text-gray-400'}>
                            {IconMap[page.icon] || IconMap.folder}
                          </span>
                          {page.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </nav>

          {/* Content panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm p-8 min-h-full">
              {loadingContent || loadingIndex ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="pt-4 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              ) : contentError ? (
                <div className="text-center py-12">
                  <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                    Could not load this page
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{contentError}</p>
                  <button
                    onClick={() => setActivePage({ ...activePage })}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-bioluminescent-500/20 text-bioluminescent-600 dark:text-bioluminescent-400 hover:bg-bioluminescent-500/30 border border-bioluminescent-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default Help;
