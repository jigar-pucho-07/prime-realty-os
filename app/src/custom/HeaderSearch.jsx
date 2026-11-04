'use client';
// HeaderSearch — the header's global search as an always-visible box (client request, 4 Nov 2026) instead of the kernel's
// icon that opens a popup. Same search as components/HeaderTools.jsx: the os.yaml `header.search` sources the person may open,
// every declared column, two letters to start, five rows per group, Ctrl+K (no badge shown). Nothing opens until something is typed (no recent list on
// focus); records opened are still remembered under the kernel's key. The box is placed in the
// header's centre slot (a portal; the kernel's icon is hidden), and results open right under the box while typing.
// Mounted on every page by src/screens/overrides.js. Kit note: the header has no override slot, hence the portal.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { HEADER, ENTITIES, OS } from '../config/os.config';
import { useAuth, accessOf } from '../context/AuthContext';
import { useEntities } from '../hooks/useEntity';
import { titleOf, subtitleOf } from '../module/record';

const linkFor = (spec, row) => (spec.link ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => encodeURIComponent(row[k] ?? ''));
const KEY = (k) => `${OS.slug}_${k}`;   // the kernel's own keys: recent searches carry over between the two
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(KEY(k)) || 'null') ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(KEY(k), JSON.stringify(v)); } catch { /* private mode */ } };

/** The header's centre slot, once the header has rendered: the kernel search button's container. */
function useSlot() {
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    let host = null; let tries = 0; let timer = 0;
    const find = () => {
      const btn = document.querySelector('header [data-os-global-search]');
      const centre = btn?.closest('div.justify-center');   // Header.jsx's centre slot
      if (!btn || !centre) { if (tries++ < 40) timer = setTimeout(find, 100); return; }
      const kernel = btn.closest('div.relative');       // HeaderTools' search (icon + its popup): hidden, the box replaces it
      if (kernel && centre.contains(kernel)) kernel.style.display = 'none'; else btn.style.display = 'none';
      host = document.createElement('div'); host.dataset.osInlineSearch = ''; host.className = 'flex justify-center min-w-0'; host.style.width = 'min(460px, 40vw)';   // the header's centre column is sized by its content
      centre.appendChild(host); setSlot(host);
    };
    find();
    return () => { clearTimeout(timer); host?.remove(); };
  }, []);
  return slot;
}

function InlineSearch() {
  const { user } = useAuth(); const acc = accessOf(user); const navigate = useNavigate();
  const search = useMemo(() => (HEADER.search ?? []).filter((s) => !s.page || acc.shows(s.page)), [acc]);
  const { data } = useEntities([...new Set(search.map((s) => s.entity))]);
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(() => load('recent', []));
  const box = useRef(null); const input = useRef(null);
  const groups = useMemo(() => {
    if (q.trim().length < 2) return [];
    const t = q.trim().toLowerCase();
    return search.map((s) => ({ s, rows: (data[s.entity] ?? []).filter((r) => (s.columns ?? []).some((c) => String(r[c] ?? '').toLowerCase().includes(t))).slice(0, 5) })).filter((g) => g.rows.length);
  }, [q, data, search]);
  const go = (entry) => { setOpen(false); setQ(''); input.current?.blur(); const next = [entry, ...recent.filter((x) => x.link !== entry.link)].slice(0, 6); setRecent(next); save('recent', next); navigate(entry.link); };
  const pick = (s, r) => { const ent = ENTITIES[s.entity]; go({ label: s.label, title: titleOf(r, ent, s), sub: subtitleOf(r, ent, s), link: linkFor(s, r) }); };

  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); e.stopImmediatePropagation(); input.current?.focus(); setOpen(true); } };
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey, true); document.addEventListener('mousedown', away);
    return () => { window.removeEventListener('keydown', onKey, true); document.removeEventListener('mousedown', away); };
  }, []);
  if (!search.length) return null;
  // nothing opens on a click or Ctrl+K — results and suggestions appear only once something is typed (client request, 4 Nov 2026)
  const typed = q.trim(); const show = open && typed.length > 0;

  return (
    <div ref={box} className="relative w-full" data-os-global-search-inline>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" aria-hidden />
      <input ref={input} type="text" inputMode="search" enterKeyHint="search" role="combobox" aria-expanded={show} aria-controls="os-inline-search-results" aria-label="Search"
        value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); e.currentTarget.blur(); } if (e.key === 'Enter' && groups[0]) { e.preventDefault(); pick(groups[0].s, groups[0].rows[0]); } }}
        placeholder={HEADER.search_placeholder ?? `Search ${search.map((s) => s.label.toLowerCase()).join(', ')}…`}
        className="os-control w-full h-10 pl-9 pr-10 text-[14px]" autoComplete="off" />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
        {q && <button type="button" onClick={() => { setQ(''); input.current?.focus(); }} aria-label="Clear search" className="no-pill p-1.5 rounded-[var(--r-6)] text-ink-3 hover:text-ink"><X className="w-4 h-4" /></button>}
      </span>
      {show && (
        <div id="os-inline-search-results" role="listbox" data-os-popover
          className="absolute left-0 right-0 top-[calc(100%+6px)] bg-surface rounded-[var(--r-10)] shadow-overlay border border-surface-border z-50 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar py-1">
            {groups.map((g) => (
              <div key={g.s.label} data-os-search-group={g.s.label}>
                <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{g.s.label} · {g.rows.length}</p>
                {g.rows.map((r, i) => {
                  const ent = ENTITIES[g.s.entity];
                  return (
                    <button key={i} type="button" role="option" aria-selected="false" onClick={() => pick(g.s, r)} className="no-pill w-full text-left px-4 py-2 hover:bg-black/[0.03] rounded-none">
                      <span className="block text-[13px] font-medium text-ink truncate">{titleOf(r, ent, g.s)}</span>
                      {subtitleOf(r, ent, g.s) && <span className="block text-[12px] text-ink-3 truncate">{subtitleOf(r, ent, g.s)}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
            {q.trim().length >= 2 && !groups.length && <p className="px-4 py-6 text-[13px] text-ink-3">No matches for "{q}". Try a name, phone or area.</p>}
            {typed.length < 2 && <p className="px-4 py-4 text-[13px] text-ink-3">Keep typing — results show from two letters.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeaderSearch() {
  const slot = useSlot();
  return slot ? createPortal(<InlineSearch />, slot) : null;
}

