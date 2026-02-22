import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiMessageSquare, FiArrowRight, FiShield, FiCheckCircle } from 'react-icons/fi';

// ── Pipeline stage config (status 0–5) ──
const PIPELINE_STAGES = [
  { label: 'New', short: 'Ingestion', color: 'slate' },
  { label: 'Stakeholders', short: 'Stakeholders', color: 'indigo' },
  { label: 'Facts', short: 'Facts', color: 'violet' },
  { label: 'Conflicts', short: 'Conflicts', color: 'amber' },
  { label: 'Summary', short: 'Summary', color: 'sky' },
  { label: 'Completed', short: 'BRD Done', color: 'emerald' },
];

const STATUS_STYLE = {
  slate: { dot: 'bg-slate-400 animate-pulse', text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-slate-300' },
  indigo: { dot: 'bg-indigo-500 animate-pulse', text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', bar: 'bg-indigo-500' },
  violet: { dot: 'bg-violet-500 animate-pulse', text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', bar: 'bg-violet-500' },
  amber: { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
  sky: { dot: 'bg-sky-500 animate-pulse', text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', bar: 'bg-sky-500' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
};

export default function ProjectCard({ project }) {
  const name = project?.projectName || project?.name || project?.title || 'Untitled Project';
  const desc = project?.project_description || project?.description || project?.desc || 'No description provided for this instance.';
  const sources = Array.isArray(project?.included_messaging_source) ? project.included_messaging_source : project?.included_messaging_source ? [project.included_messaging_source] : [];
  const files = Array.isArray(project?.files) ? project.files : project?.files ? [project.files] : [];

  const status = typeof project?.status === 'number' ? Math.min(project.status, 5) : 0;
  const stage = PIPELINE_STAGES[status] || PIPELINE_STAGES[0];
  const style = STATUS_STYLE[stage.color];
  const isCompleted = status >= 5;
  const progressPct = Math.round((status / 5) * 100);

  const navigate = useNavigate();
  const projectId = project?.id || project?._id || project?.projectId;

  const goToProject = () => {
    if (!projectId) return;
    navigate(`/project/${projectId}`);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToProject}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goToProject(); }}
      className="group relative flex flex-col bg-white/70 backdrop-blur-md rounded-4xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-300 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-50"
      aria-label={`Open project ${name}`}
    >
      {/* --- HEADER: STATUS & TRACE ID --- */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isCompleted
            ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            : <div className={`w-2 h-2 rounded-full ${style.dot}`} />
          }
          <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
            {stage.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-indigo-400 transition-colors">
          <FiShield className="w-3 h-3" />
          <span className="text-[9px] font-mono font-bold uppercase">
            ID: {projectId?.toString().slice(-6) || "ANV-???"}
          </span>
        </div>
      </header>

      {/* --- CONTENT: IDENTITY --- */}
      <div className="flex-1">
        <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
          {name}
        </h4>
        <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
          {desc}
        </p>
      </div>

      {/* --- PIPELINE PROGRESS BAR --- */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pipeline</span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${style.text}`}>
            {isCompleted ? '✓ Complete' : `Stage ${status}/5`}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
            style={{ width: `${Math.max(progressPct, 4)}%` }}
          />
        </div>
        {/* Mini stage dots */}
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          {PIPELINE_STAGES.map((s, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${idx < status ? STATUS_STYLE[s.color].bar
                  : idx === status ? `${STATUS_STYLE[s.color].bar} ring-2 ring-offset-1 ${STATUS_STYLE[s.color].border}`
                    : 'bg-slate-200'
                }`}
              title={s.short}
            />
          ))}
        </div>
      </div>

      {/* --- DATA METRICS: LINEAGE STATS --- */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
            <FiMessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">Sources</span>
            <span className="text-xs font-bold text-slate-700">{sources.length || 0} Nodes</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
            <FiFileText className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">Files</span>
            <span className="text-xs font-bold text-slate-700">{files.length || 0} Assets</span>
          </div>
        </div>
      </div>

      {/* --- ACTION INDICATOR --- */}
      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
        <FiArrowRight className="text-indigo-600 w-5 h-5" />
      </div>
    </article>
  );
}