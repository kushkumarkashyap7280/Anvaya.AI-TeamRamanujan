import React, { useState, useRef, useEffect } from 'react';
import {
    FiDownload, FiCopy, FiCheck, FiFileText, FiAward,
    FiSend, FiSave, FiCpu, FiUser, FiRefreshCw, FiLayers
} from 'react-icons/fi';
import { useProject } from '../providers/ProjectProvider';
import { refineBRD, saveBRD } from '../../apis/api';
import { toast } from 'sonner';

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────

/* ── Inline formatter: bold, italic (citations stripped) ── */
function renderInline(text) {
    // Strip all [Ref: FACT-xxx] citations first
    const cleaned = text.replace(/\[Ref:\s*FACT-\d+\]/gi, '');
    // Split on bold
    const withBold = cleaned.split(/\*\*(.*?)\*\*/g);
    return withBold.map((segment, j) => {
        if (j % 2 === 1) {
            return <strong key={j} className="font-bold text-slate-800">{segment}</strong>;
        }
        return segment || null;
    });
}

function renderMarkdown(md) {
    if (!md) return null;
    // Strip code fences Gemini sometimes wraps around the BRD
    md = md.replace(/^```(?:markdown|md)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    const lines = md.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // ── Table block ──
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            const tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                tableLines.push(lines[i]);
                i++;
            }
            // Parse header row
            const headerCells = tableLines[0].split('|').filter(c => c.trim() !== '');
            // Skip separator row (|---|---|)
            const dataStartIdx = (tableLines.length > 1 && /^[\s|:-]+$/.test(tableLines[1])) ? 2 : 1;
            const dataRows = tableLines.slice(dataStartIdx).map(r => r.split('|').filter(c => c.trim() !== ''));

            elements.push(
                <div key={`tbl-${i}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-indigo-50 border-b border-indigo-100">
                                {headerCells.map((h, ci) => (
                                    <th key={ci} className="px-3 py-2 text-left font-black text-indigo-800 uppercase tracking-wider text-[10px]">
                                        {h.trim()}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dataRows.map((row, ri) => (
                                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="px-3 py-2 text-slate-600 border-t border-slate-100">
                                            {renderInline(cell.trim())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        // ── Numbered / ordered list ──
        if (/^\d+\.\s/.test(line.trim())) {
            const listItems = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={`ol-${i}`} className="my-2 ml-4 list-decimal list-outside space-y-1">
                    {listItems.map((item, li) => (
                        <li key={li} className="text-xs text-slate-600 leading-relaxed pl-1">
                            {renderInline(item)}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // ── Blockquote ──
        if (line.startsWith('> ')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                quoteLines.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <blockquote key={`bq-${i}`} className="my-2 pl-3 border-l-3 border-indigo-300 bg-indigo-50/40 py-2 pr-3 rounded-r-lg">
                    {quoteLines.map((ql, qi) => (
                        <p key={qi} className="text-xs text-slate-600 leading-relaxed">{renderInline(ql)}</p>
                    ))}
                </blockquote>
            );
            continue;
        }

        // ── Headings ──
        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-xl font-black text-slate-900 mt-6 mb-2 pb-2 border-b border-slate-200">{line.slice(2)}</h1>);
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-base font-black text-slate-800 mt-5 mb-2">{line.slice(3)}</h2>);
            i++; continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-sm font-bold text-indigo-700 mt-3 mb-1">{line.slice(4)}</h3>);
            i++; continue;
        }

        // ── Horizontal rule ──
        if (line.startsWith('---')) {
            elements.push(<hr key={i} className="my-3 border-slate-200" />);
            i++; continue;
        }

        // ── Bullet list item ──
        if (line.startsWith('- ')) {
            elements.push(
                <div key={i} className="flex items-start gap-2 my-0.5">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span className="text-xs text-slate-600">{renderInline(line.slice(2))}</span>
                </div>
            );
            i++; continue;
        }

        // ── Empty line ──
        if (line.trim() === '') {
            elements.push(<div key={i} className="h-1.5" />);
            i++; continue;
        }

        // ── Default paragraph ──
        elements.push(
            <p key={i} className="text-xs text-slate-600 leading-relaxed my-0.5">
                {renderInline(line)}
            </p>
        );
        i++;
    }

    return elements;
}

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────

function exportToPDF(projectName, brdMdx) {
    /* ── Convert markdown to HTML with full table/list/citation support ── */
    function mdToHtml(md) {
        // Strip code fences Gemini sometimes wraps around the BRD
        md = md.replace(/^```(?:markdown|md)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        const lines = md.split('\n');
        const out = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Table block
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                const tbl = [];
                while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                    tbl.push(lines[i]);
                    i++;
                }
                const hdr = tbl[0].split('|').filter(c => c.trim());
                const dataStart = (tbl.length > 1 && /^[\s|:-]+$/.test(tbl[1])) ? 2 : 1;
                const rows = tbl.slice(dataStart).map(r => r.split('|').filter(c => c.trim()));
                out.push('<table>');
                out.push('<thead><tr>' + hdr.map(h => `<th>${inlineFmt(h.trim())}</th>`).join('') + '</tr></thead>');
                out.push('<tbody>');
                rows.forEach((r, ri) => {
                    const cls = ri % 2 === 0 ? '' : ' class="alt"';
                    out.push(`<tr${cls}>` + r.map(c => `<td>${inlineFmt(c.trim())}</td>`).join('') + '</tr>');
                });
                out.push('</tbody></table>');
                continue;
            }

            // Ordered list
            if (/^\d+\.\s/.test(line.trim())) {
                out.push('<ol>');
                while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                    out.push(`<li>${inlineFmt(lines[i].trim().replace(/^\d+\.\s/, ''))}</li>`);
                    i++;
                }
                out.push('</ol>');
                continue;
            }

            // Bullet list
            if (line.startsWith('- ')) {
                out.push('<ul>');
                while (i < lines.length && lines[i].startsWith('- ')) {
                    out.push(`<li>${inlineFmt(lines[i].slice(2))}</li>`);
                    i++;
                }
                out.push('</ul>');
                continue;
            }

            // Blockquote
            if (line.startsWith('> ')) {
                out.push('<blockquote>');
                while (i < lines.length && lines[i].startsWith('> ')) {
                    out.push(`<p>${inlineFmt(lines[i].slice(2))}</p>`);
                    i++;
                }
                out.push('</blockquote>');
                continue;
            }

            // Headings
            if (line.startsWith('# ')) { out.push(`<h1>${inlineFmt(line.slice(2))}</h1>`); i++; continue; }
            if (line.startsWith('## ')) { out.push(`<h2>${inlineFmt(line.slice(3))}</h2>`); i++; continue; }
            if (line.startsWith('### ')) { out.push(`<h3>${inlineFmt(line.slice(4))}</h3>`); i++; continue; }

            // Horizontal rule
            if (line.startsWith('---')) { out.push('<hr/>'); i++; continue; }

            // Empty line
            if (line.trim() === '') { out.push('<br/>'); i++; continue; }

            // Default paragraph
            out.push(`<p>${inlineFmt(line)}</p>`);
            i++;
        }
        return out.join('\n');
    }

    /* ── Inline: bold (citations stripped) ── */
    function inlineFmt(txt) {
        return txt
            .replace(/\[Ref:\s*FACT-\d+\]/gi, '')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>BRD · ${projectName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;font-size:11px;color:#1e293b;line-height:1.65;padding:40px 56px 60px}

    /* ── Cover header ── */
    .cover{margin-bottom:28px;padding-bottom:18px;border-bottom:3px solid #4f46e5}
    .cover h1{font-size:24px;font-weight:900;color:#0f172a;margin:0 0 4px}
    .cover .meta{font-size:10px;color:#64748b;margin-top:2px}
    .cover .badge{display:inline-block;background:#eef2ff;color:#4f46e5;font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:3px 10px;border-radius:100px;margin-top:10px}

    /* ── Typography ── */
    h1{font-size:20px;font-weight:900;margin:28px 0 8px;padding-bottom:6px;border-bottom:2px solid #4f46e5;color:#0f172a}
    h2{font-size:14px;font-weight:800;margin:22px 0 6px;color:#1e293b;padding-bottom:3px;border-bottom:1px solid #e2e8f0}
    h3{font-size:12px;font-weight:700;margin:14px 0 4px;color:#4f46e5}
    p{margin:3px 0;font-size:11px;color:#475569}
    strong{font-weight:700;color:#1e293b}

    /* ── Lists ── */
    ul,ol{margin:6px 0 6px 20px;font-size:11px;color:#475569}
    li{margin:3px 0;line-height:1.55}

    /* ── Tables ── */
    table{width:100%;border-collapse:collapse;margin:12px 0;font-size:10.5px;border:1px solid #cbd5e1}
    thead tr{background:#eef2ff}
    th{text-align:left;padding:8px 12px;font-weight:800;font-size:9.5px;color:#3730a3;text-transform:uppercase;letter-spacing:.08em;border:1px solid #cbd5e1;background:#eef2ff}
    td{padding:7px 12px;border:1px solid #cbd5e1;color:#334155}
    tr.alt{background:#f8fafc}
    tbody tr:hover{background:#f1f5f9}

    /* ── (citations removed — clean professional output) ── */

    /* ── Blockquotes ── */
    blockquote{margin:10px 0;padding:8px 14px;border-left:3px solid #a5b4fc;background:#f5f3ff;border-radius:0 6px 6px 0}
    blockquote p{font-size:10.5px;color:#4338ca;margin:2px 0}

    /* ── Misc ── */
    hr{margin:16px 0;border:none;border-top:1px solid #e2e8f0}

    /* ── Footer ── */
    .footer{margin-top:40px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center}

    /* ── Print ── */
    @media print{
      body{padding:32px 48px 48px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
      h1,h2,h3{page-break-after:avoid}
      table,blockquote{page-break-inside:avoid}
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1 style="border:none;margin:0;padding:0">${projectName}</h1>
    <div class="meta">Business Requirements Document · Generated ${dateStr}</div>
    <div class="badge">Verified by Anvaya.Ai</div>
  </div>
  ${mdToHtml(brdMdx)}
  <div class="footer">Generated by Anvaya.Ai · ${dateStr}</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
        toast.error('Pop-up blocked — allow pop-ups for this site and try again.');
        return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
}

// ─── CHAT BUBBLE ─────────────────────────────────────────────────────────────

function ChatBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isUser ? 'bg-indigo-600' : 'bg-slate-100 border border-slate-200'}`}>
                {isUser
                    ? <FiUser className="w-3.5 h-3.5 text-white" />
                    : <FiCpu className="w-3.5 h-3.5 text-slate-500" />}
            </div>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                {msg.role === 'assistant' && msg.content === '...'
                    ? (
                        <div className="flex items-center gap-1 py-0.5">
                            {[0, 150, 300].map(d => (
                                <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                    )
                    : msg.content}
            </div>
        </div>
    );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function Step5_BRD() {
    const ctx = useProject() || {};
    const { project, setProject } = ctx;

    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [liveBRD, setLiveBRD] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm the Anvaya Refinement Engine. Describe any changes — e.g. \"Add a risk section for PCI compliance\" or \"Make the executive summary more concise\".",
        },
    ]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const chatEndRef = useRef(null);

    // Sync liveBRD from project when it loads
    useEffect(() => {
        if (project?.brdMdx && !liveBRD) {
            setLiveBRD(project.brdMdx);
        }
    }, [project?.brdMdx]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // ── Actions ──

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(liveBRD);
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Copy failed');
        }
    };

    const handleDownloadMD = () => {
        const blob = new Blob([liveBRD], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BRD_${(project?.projectName || 'document').replace(/\s+/g, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Downloaded BRD.md');
    };

    const handleExportPDF = () => {
        if (!liveBRD) return toast.error('No BRD content to export');
        exportToPDF(project?.projectName || 'BRD', liveBRD);
    };

    const handleSave = async () => {
        if (!project?.id || !liveBRD) return;
        setSaving(true);
        try {
            await saveBRD(project.id, liveBRD);
            setIsDirty(false);
            // Update local project context if setter exists
            if (typeof setProject === 'function') {
                setProject(prev => prev ? { ...prev, brdMdx: liveBRD } : prev);
            }
        } catch {
            // toast already shown by api.js
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        const msg = input.trim();
        if (!msg || thinking || !project?.id) return;
        setInput('');

        setChatHistory(prev => [
            ...prev,
            { role: 'user', content: msg },
            { role: 'assistant', content: '...' },
        ]);
        setThinking(true);

        try {
            const res = await refineBRD(project.id, msg);
            // api response shape: { data: { refinedBRD: '...' } } or { refinedBRD: '...' }
            const refined =
                res?.data?.refinedBRD ||
                res?.refinedBRD ||
                '';

            if (refined) {
                setLiveBRD(refined);
                setIsDirty(true);
            }

            setChatHistory(prev => [
                ...prev.slice(0, -1),
                {
                    role: 'assistant',
                    content: refined
                        ? '✅ BRD updated on the left. Review and hit "Save to Project" when ready.'
                        : '⚠️ Refinement returned empty content — please try again.',
                },
            ]);
        } catch {
            setChatHistory(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: '❌ Refinement failed. The backend may be unavailable.' },
            ]);
        } finally {
            setThinking(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Render ──

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full mb-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Stage 5 — Truth Synthesis</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">BRD · Refine & Export</h2>
                    <p className="text-sm text-slate-500 mt-1">Chat with Gemini to refine your BRD, then export as Markdown or PDF.</p>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60"
                        >
                            {saving
                                ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <FiSave className="w-3.5 h-3.5" />}
                            {saving ? 'Saving…' : 'Save to Project'}
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                        {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy MD'}
                    </button>
                    <button
                        onClick={handleDownloadMD}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                        <FiDownload className="w-3.5 h-3.5" /> .md
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg"
                    >
                        <FiDownload className="w-3.5 h-3.5" /> Export PDF
                    </button>
                </div>
            </div>

            {/* ── STATUS BADGE ── */}
            <div className="flex items-center gap-4 p-4 bg-linear-to-r from-emerald-50 to-indigo-50 border border-emerald-200 rounded-2xl flex-wrap">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <FiAward className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-800">Anvaya Pipeline Complete</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Project: <strong>{project?.projectName || '—'}</strong> · All 5 stages · Full data lineage preserved
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-full">
                        <FiCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase">Verified</span>
                    </div>
                    {isDirty && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-amber-700 uppercase">Unsaved</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SPLIT VIEW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

                {/* LEFT — BRD Document */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:sticky lg:top-32">
                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
                        <FiFileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest truncate">
                            {project?.projectName || 'BRD Document'}
                        </span>
                        {isDirty && <span className="ml-auto text-amber-400 text-lg leading-none">●</span>}
                    </div>
                    <div className="px-6 py-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        {liveBRD
                            ? renderMarkdown(liveBRD)
                            : (
                                <div className="flex flex-col items-center py-16 text-center">
                                    <FiLayers className="w-10 h-10 text-slate-200 mb-3" />
                                    <p className="text-sm text-slate-400 font-medium">No BRD content loaded</p>
                                    <p className="text-xs text-slate-400 mt-1">Ask the Anvaya Engine on the right to generate or refine content.</p>
                                </div>
                            )
                        }
                    </div>
                </div>

                {/* RIGHT — Gemini Chat */}
                <div
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
                    style={{ height: '70vh' }}
                >
                    {/* Chat header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100 shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                            <FiCpu className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <div className="text-xs font-black text-indigo-700">Anvaya Refinement Engine</div>
                            <div className="text-[10px] text-indigo-400">Grounded in verified facts · Powered by Gemini</div>
                        </div>
                        <div className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                        {chatHistory.map((msg, i) => (
                            <ChatBubble key={i} msg={msg} />
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-slate-50/70">
                        <div className="flex items-end gap-2">
                            <textarea
                                className="flex-1 px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-indigo-400 transition-all max-h-28 custom-scrollbar"
                                rows={2}
                                placeholder={`e.g. "Add a risk section" or "Rewrite the summary…"`}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={thinking}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || thinking}
                                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-indigo-200"
                            >
                                {thinking
                                    ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <FiSend className="w-3.5 h-3.5" />
                                }
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1.5 text-center">
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
