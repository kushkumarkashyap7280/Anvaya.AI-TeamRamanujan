import React, { useEffect, useState } from 'react';
import {
    FiCheck, FiX, FiArrowRight, FiLink, FiGitCommit,
    FiDatabase, FiAlertTriangle, FiEdit3, FiShield
} from 'react-icons/fi';
import { useProject } from '../providers/ProjectProvider';
import { getResolutions, generateBRD } from '../../apis/api';
import { toast } from 'sonner';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getContent(fact) {
    if (!fact) return '(fact not found)';
    return typeof fact.content === 'object'
        ? (fact.content?.statement || JSON.stringify(fact.content))
        : String(fact.content);
}

function getFactLabel(facts, factId) {
    const idx = facts.findIndex(f => f.id === factId);
    return idx >= 0 ? `FACT-${String(idx + 1).padStart(3, '0')}` : factId?.slice(-6) || '?';
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function Step4_Summary() {
    const { project, fetchProject, facts, setResolutions: setContextResolutions } = useProject() || {};
    const [resolutions, setResolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [advancing, setAdvancing] = useState(false);

    const localFacts = facts || [];
    const activeFacts = localFacts.filter(f => f.resolved !== false);
    const supersededFacts = localFacts.filter(f => f.resolved === false);

    // Fetch resolutions on mount
    useEffect(() => {
        if (project?.id) loadResolutions();
    }, [project?.id]);

    const loadResolutions = async () => {
        if (!project?.id) return;
        setLoading(true);
        try {
            const res = await getResolutions(project.id);
            const list = res?.data || res || [];
            const arr = Array.isArray(list) ? list : [];
            setResolutions(arr);
            if (setContextResolutions) setContextResolutions(arr);
        } catch {
            // toast from api.js
        } finally {
            setLoading(false);
        }
    };

    const handleAdvance = async () => {
        if (!project?.id) return;
        setAdvancing(true);
        try {
            toast.info('Generating BRD from verified source of truth…');
            await generateBRD(project.id);
            await fetchProject(project.id);
            toast.success('BRD synthesized! Moving to final stage →');
        } catch {
            toast.error('Failed to advance');
        } finally {
            setAdvancing(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center justify-center py-32">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-400">Loading source of truth…</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-100 rounded-full mb-4">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Stage 4 — Fact-Based Summary</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Source of Truth — Audit Trail</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Review all verified facts, conflict resolutions, and superseded claims before BRD generation.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
                    <div className="text-2xl font-black text-emerald-600">{activeFacts.length}</div>
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Active Facts</div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl shadow-sm">
                    <div className="text-2xl font-black text-purple-600">{resolutions.length}</div>
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Conflicts Resolved</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                    <div className="text-2xl font-black text-slate-400">{supersededFacts.length}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Superseded</div>
                </div>
            </div>

            {/* ── RESOLUTION AUDIT LOG ── */}
            {resolutions.length > 0 && (
                <div className="bg-white border border-purple-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 px-5 py-3 bg-purple-50 border-b border-purple-100">
                        <FiGitCommit className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-black text-purple-700 uppercase tracking-widest">Conflict Resolution Log</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {resolutions.map((r, i) => {
                            const isCustom = !r.winnerFactId;
                            const winnerFact = r.winnerFactId ? localFacts.find(f => f.id === r.winnerFactId) : null;
                            const conflictFactIds = r.contradiction_facts || [];
                            const loserFacts = conflictFactIds
                                .filter(id => id !== r.winnerFactId)
                                .map(id => localFacts.find(f => f.id === id))
                                .filter(Boolean);

                            return (
                                <div key={r.id || i} className="relative pl-8 pr-5 py-4">
                                    {/* Timeline node */}
                                    <div className="absolute left-3 top-5 w-4 h-4 rounded-full bg-white border-2 border-purple-400 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    </div>
                                    {i < resolutions.length - 1 && (
                                        <div className="absolute left-[18px] top-9 w-0.5 h-[calc(100%-20px)] bg-purple-100" />
                                    )}

                                    {/* Resolution Header */}
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                                            Resolution #{i + 1}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${isCustom
                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                            : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                            }`}>
                                            {isCustom ? <><FiEdit3 className="w-2 h-2" /> Custom Input</> : <><FiLink className="w-2 h-2" /> {getFactLabel(localFacts, r.winnerFactId)}</>}
                                        </span>
                                    </div>

                                    {/* Context */}
                                    {r.contradiction_context && (
                                        <p className="text-[11px] text-slate-500 mb-2 italic flex items-center gap-1.5">
                                            <FiAlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                            {r.contradiction_context}
                                        </p>
                                    )}

                                    {/* Decision */}
                                    <div className={`p-3 rounded-xl border ${isCustom ? 'bg-purple-50 border-purple-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <FiCheck className={`w-3 h-3 ${isCustom ? 'text-purple-600' : 'text-indigo-600'}`} />
                                            <span className={`text-[9px] font-black uppercase ${isCustom ? 'text-purple-700' : 'text-indigo-700'}`}>
                                                {isCustom ? 'Custom Decision' : 'Adopted Fact'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed">
                                            {isCustom ? (r.custom_input || r.final_decision) : getContent(winnerFact)}
                                        </p>
                                        {winnerFact && (
                                            <p className="mt-1 text-[10px] text-slate-400">📍 Source: {winnerFact.source}</p>
                                        )}
                                    </div>

                                    {/* Reasoning */}
                                    {r.reasoning && (
                                        <p className="mt-2 text-[10px] text-slate-500 italic">📋 Reasoning: {r.reasoning}</p>
                                    )}

                                    {/* Superseded facts */}
                                    {loserFacts.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {loserFacts.map(lf => (
                                                <div key={lf.id} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                                                    <FiX className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                                                    <span className="line-through">
                                                        {getFactLabel(localFacts, lf.id)}: {getContent(lf).slice(0, 80)}…
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── ACTIVE FACTS ── */}
            <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                    <FiShield className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Verified Active Facts</span>
                    <span className="ml-auto text-[10px] font-black text-emerald-500">{activeFacts.length} facts</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-[40vh] overflow-y-auto custom-scrollbar">
                    {activeFacts.length > 0 ? activeFacts.map((f, i) => (
                        <div key={f.id || i} className="group/fact relative flex items-center gap-3 px-5 py-3 hover:bg-emerald-50/40 transition-all cursor-default">
                            {/* Badge */}
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-[9px] font-black text-emerald-600">
                                {getFactLabel(localFacts, f.id).replace('FACT-', '')}
                            </div>
                            {/* Source + Tone (always visible) */}
                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700">
                                    <FiDatabase className="w-2.5 h-2.5" /> {f.source}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">{f.tone}</span>
                                <span className="text-[10px] text-slate-400 italic ml-1 truncate max-w-[200px]">{getContent(f).slice(0, 50)}…</span>
                            </div>
                            <FiCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />

                            {/* Hover tooltip showing full fact content */}
                            <div className="absolute left-10 right-4 top-full z-30 mt-1 hidden group-hover/fact:block animate-in fade-in duration-150">
                                <div className="bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl px-4 py-3 shadow-xl border border-slate-700">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{getFactLabel(localFacts, f.id)}</span>
                                        <span className="text-[9px] text-slate-400">·</span>
                                        <span className="text-[9px] text-slate-400">{f.source}</span>
                                    </div>
                                    <p className="text-slate-200">{getContent(f)}</p>
                                    <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="px-5 py-8 text-center text-xs text-slate-400">No active facts</div>
                    )}
                </div>
            </div>

            {/* ── SUPERSEDED FACTS ── */}
            {supersededFacts.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm opacity-75">
                    <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <FiX className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Superseded Facts (Excluded from BRD)</span>
                        <span className="ml-auto text-[10px] font-black text-slate-400">{supersededFacts.length}</span>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[25vh] overflow-y-auto custom-scrollbar">
                        {supersededFacts.map((f, i) => (
                            <div key={f.id || i} className="flex items-start gap-3 px-5 py-3">
                                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-[9px] font-black text-rose-400 mt-0.5">
                                    {getFactLabel(localFacts, f.id).replace('FACT-', '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-400 leading-relaxed line-through">{getContent(f)}</p>
                                    <span className="text-[9px] text-slate-400">📍 {f.source}</span>
                                </div>
                                <FiX className="w-3.5 h-3.5 text-rose-300 shrink-0 mt-1" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-xl shadow-emerald-200">
                <div>
                    <div className="text-white font-black text-sm">Proceed to BRD Synthesis</div>
                    <div className="text-emerald-200 text-xs mt-0.5">
                        {activeFacts.length} verified facts + {resolutions.length} resolutions → professional BRD document
                    </div>
                </div>
                <button
                    onClick={handleAdvance}
                    disabled={advancing}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {advancing ? (
                        <><span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />Synthesizing...</>
                    ) : (
                        <>Generate BRD <FiArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    );
}
