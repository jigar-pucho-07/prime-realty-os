'use client';
// ConversationInbox — the Inbox page (R11, R21). One list of conversations (a lead with messages), the thread, and the office's
// controls: Take over from the AI agent, Hand back, and a reply box. Rules the screen enforces (the server enforces them too):
//   · the AI agent answers while AI_Mode = On; the reply box opens only after Take over (R21 — the agent stays quiet while Off)
//   · a typed WhatsApp reply only inside 24 hours of the client's last message (Meta refuses free text after that)
// Writes: leads.AI_Mode through a direct patch; the reply through MESSAGES.reply (simulated until the flow is wired).
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'antd';
import { toast } from 'sonner';
import { differenceInHours, format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, Bot, Hand, Mic, Phone, Send, Search, UserRound } from 'lucide-react';
import { Avatar, Callout, Chip, ChipRow } from '../components/ui/primitives';
import StatusBadge from '../components/StatusBadge';
import { digits, formatPhone } from '../components/ui/ContactActions';
import { CARD } from '../module/Charts';
import { useEntity } from '../hooks/useEntity';
import { runAction } from '../utils/api';
import { prefersReducedMotion } from '../config/motion';
import { cn } from '../utils/cn';

const WINDOW_HOURS = 24;
const MAX_REPLY = 1000;
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'office', label: 'Taken over' },
  { key: 'ai', label: 'With AI agent' },
];

const when = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
// A client time in the future is bad data (a clock or an import), never a reason to open the 24-hour window.
const past = (d) => (d && d.getTime() <= Date.now() + 60_000 ? d : null);
function stamp(v) {
  const d = when(v); if (!d) return '';
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
}

/** Conversations: every lead with at least one message (or a last message on the lead), newest activity first. */
function buildConversations(leads, messages) {
  const byLead = new Map();
  for (const m of messages) {
    if (!m.Lead_ID) continue;
    const list = byLead.get(m.Lead_ID) ?? []; list.push(m); byLead.set(m.Lead_ID, list);
  }
  const out = [];
  for (const lead of leads) {
    const thread = (byLead.get(lead.Lead_ID) ?? []).slice().sort((a, b) => (when(a.At)?.getTime() ?? 0) - (when(b.At)?.getTime() ?? 0));
    if (!thread.length && !lead.Last_Message) continue;
    const last = thread[thread.length - 1];
    const lastIn = [...thread].reverse().find((m) => m.Direction === 'In');
    out.push({
      lead, thread,
      preview: last?.Text ?? lead.Last_Message ?? '',
      lastAt: when(last?.At) ?? when(lead.Last_Message_At),
      lastClientAt: past(when(lastIn?.At) ?? when(lead.Last_Message_At)),
      voice: thread.some((m) => m.Channel === 'Voice') || lead.Source === 'Voice',
    });
  }
  return out.sort((a, b) => (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0));
}

function ConversationItem({ c, active, onOpen }) {
  const office = c.lead.AI_Mode === 'Off';
  return (
    <button type="button" onClick={onOpen} aria-current={active ? 'true' : undefined}
      className={cn('w-full text-left flex gap-3 px-4 py-3 border-b border-[color:var(--hair-5)] transition-colors duration-150',
        'hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2', active && 'bg-surface-2')}>
      <Avatar name={c.lead.Name} size={36} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-medium text-ink">{c.lead.Name}</span>
          <span className="shrink-0 text-[12px] text-ink-3 tabular">{stamp(c.lastAt)}</span>
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-ink-3">{c.preview}</span>
        <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-3">
          {office
            ? <span className="inline-flex items-center gap-1 text-warn-text"><Hand className="w-3.5 h-3.5" aria-hidden />Office</span>
            : <span className="inline-flex items-center gap-1"><Bot className="w-3.5 h-3.5" aria-hidden />AI agent</span>}
          {c.voice && <span className="inline-flex items-center gap-1"><Mic className="w-3.5 h-3.5" aria-hidden />Call</span>}
          {c.lead.Stage && <span className="truncate">· {c.lead.Stage}</span>}
        </span>
      </span>
    </button>
  );
}

function Bubble({ m, reduce }) {
  const mine = m.Direction === 'Out';
  const tone = m.Sender === 'AI agent' ? 'bg-primary-50' : m.Sender === 'Office' ? 'bg-info-soft' : 'bg-surface-2';
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[78%] rounded-xl px-3.5 py-2.5', tone)}>
        <div className="mb-1 flex items-center gap-1.5 text-[12px] text-ink-3">
          {m.Sender === 'AI agent' ? <Bot className="w-3.5 h-3.5" aria-hidden /> : m.Sender === 'Office' ? <UserRound className="w-3.5 h-3.5" aria-hidden /> : null}
          {m.Channel === 'Voice' && <Mic className="w-3.5 h-3.5" aria-hidden />}
          <span>{m.Sender === 'Client' ? 'Client' : m.Sender}</span>
          <span aria-hidden>·</span>
          <time dateTime={String(m.At ?? '')}>{stamp(m.At)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-ink">{m.Text}</p>
      </div>
    </motion.div>
  );
}

function Composer({ c, onSent }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const office = c.lead.AI_Mode === 'Off';
  const hours = c.lastClientAt ? differenceInHours(new Date(), c.lastClientAt) : Infinity;
  const open = office && hours < WINDOW_HOURS;

  if (!office) return (
    <Callout tone="info" icon={Bot} className="m-4">The AI agent is answering this client. Take over to reply yourself — the agent stays quiet until you hand back.</Callout>
  );
  if (!open) return (
    <Callout tone="warn" className="m-4">
      {c.lastClientAt
        ? <>The client last wrote {formatDistanceToNowStrict(c.lastClientAt)} ago. WhatsApp allows a typed reply only within {WINDOW_HOURS} hours of the client's last message — reach them with a template from Site visits or Follow-ups, or call.</>
        : <>There is no recent WhatsApp message from this client on record, so a typed reply cannot be sent. Call them, or book a visit from Leads.</>}
    </Callout>
  );

  const send = async () => {
    const body = text.trim(); if (!body || busy) return;
    setBusy(true);
    try {
      const res = await runAction({ flow: 'MESSAGES', action: 'reply' }, { Lead_ID: c.lead.Lead_ID, Lead_Name: c.lead.Name, Phone: c.lead.Phone, Broker: c.lead.Broker ?? '', Text: body });
      setText('');
      if (res?.simulated) toast.warning('Saved to the conversation — WhatsApp not sent (workflow simulated)');
      else toast.success('Reply sent on WhatsApp');
      onSent?.();
    } catch (e) {
      toast.error(e.errors ? Object.values(e.errors).join(' · ') : e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="border-t border-[color:var(--hair-5)] p-3">
      <label htmlFor="inbox-reply" className="sr-only">Reply to {c.lead.Name}</label>
      <textarea id="inbox-reply" className="os-control w-full resize-none" rows={2} maxLength={MAX_REPLY} value={text} disabled={busy}
        placeholder={`Reply to ${c.lead.Name} on WhatsApp…`} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }} />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[12px] text-ink-3 tabular">{hours < 1 ? 'Client wrote under an hour ago' : `Window closes in ${WINDOW_HOURS - hours} h`} · Ctrl + Enter sends</span>
        <Button type="primary" icon={<Send className="w-4 h-4" />} loading={busy} disabled={!text.trim()} onClick={send}>Send</Button>
      </div>
    </div>
  );
}

export default function ConversationInbox({ rows: messages = [], data }) {
  const { rows: leadRows } = useEntity('leads');
  const leads = data?.leads?.length ? data.leads : leadRows;
  const conversations = useMemo(() => buildConversations(leads ?? [], messages ?? []), [leads, messages]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const [mobileThread, setMobileThread] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const reduce = typeof window !== 'undefined' && prefersReducedMotion();

  const counts = useMemo(() => ({
    all: conversations.length,
    office: conversations.filter((c) => c.lead.AI_Mode === 'Off').length,
    ai: conversations.filter((c) => c.lead.AI_Mode !== 'Off').length,
  }), [conversations]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase(); const d = digits(q);
    return conversations.filter((c) => {
      if (filter === 'office' && c.lead.AI_Mode !== 'Off') return false;
      if (filter === 'ai' && c.lead.AI_Mode === 'Off') return false;
      if (!s) return true;
      return String(c.lead.Name ?? '').toLowerCase().includes(s) || (d.length > 2 && digits(c.lead.Phone).includes(d)) || c.preview.toLowerCase().includes(s);
    });
  }, [conversations, filter, q]);

  const current = conversations.find((c) => c.lead.Lead_ID === openId) ?? shown[0] ?? null;
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' }); }, [current?.lead.Lead_ID, current?.thread.length, reduce]);

  const setMode = async (mode) => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await runAction({ direct: 'patch', entity: 'leads' }, { Lead_ID: current.lead.Lead_ID, AI_Mode: mode });
      toast.success(mode === 'Off' ? `You are answering ${current.lead.Name} — the AI agent is paused` : `${current.lead.Name} is back with the AI agent`);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!conversations.length) return (
    <div className={cn(CARD, 'p-10 text-center')}>
      <p className="text-[15px] font-medium text-ink">No conversations yet</p>
      <p className="mt-1 text-[13px] text-ink-3">When a client messages the WhatsApp number or calls, the AI agent answers and the conversation appears here.</p>
    </div>
  );

  return (
    <div className={cn(CARD, 'grid grid-cols-[minmax(0,1fr)] md:grid-cols-[320px_minmax(0,1fr)] h-[calc(100dvh-170px)] min-h-[520px]')} data-os-inbox>
      {/* list */}
      <section aria-label="Conversations" className={cn('min-h-0 flex-col border-r border-[color:var(--hair-5)]', mobileThread ? 'hidden md:flex' : 'flex')}>
        <div className="p-3 space-y-2 border-b border-[color:var(--hair-5)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" aria-hidden />
            <input type="search" className="os-control w-full pl-9" placeholder="Search name, phone or message" aria-label="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <ChipRow>{FILTERS.map((f) => <Chip key={f.key} label={f.label} count={counts[f.key]} pressed={filter === f.key} onClick={() => setFilter(f.key)} />)}</ChipRow>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {shown.length
            ? shown.map((c) => <ConversationItem key={c.lead.Lead_ID} c={c} active={current?.lead.Lead_ID === c.lead.Lead_ID} onOpen={() => { setOpenId(c.lead.Lead_ID); setMobileThread(true); }} />)
            : <p className="p-6 text-[13px] text-ink-3">No conversation matches — clear the search or pick another filter.</p>}
        </div>
      </section>

      {/* thread */}
      {current && (
        <section aria-label={`Conversation with ${current.lead.Name}`} className={cn('min-h-0 flex-col', mobileThread ? 'flex' : 'hidden md:flex')}>
          <header className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--hair-5)]">
            <button type="button" className="md:hidden -ml-1 p-1.5 rounded-lg text-ink-2 hover:bg-surface-2" aria-label="Back to conversations" onClick={() => setMobileThread(false)}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Avatar name={current.lead.Name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-ink">{current.lead.Name}</h2>
                {current.lead.Stage && <StatusBadge status={current.lead.Stage} size="small" />}
              </div>
              <p className="truncate text-[12px] text-ink-3">
                {formatPhone(current.lead.Phone)}{current.lead.Property_Interest ? ` · ${current.lead.Property_Interest}` : ''}{current.lead.Broker ? ` · ${current.lead.Broker}` : ' · Unassigned'}
              </p>
            </div>
            {current.lead.Phone && (
              <a href={`tel:${digits(current.lead.Phone)}`} aria-label={`Call ${current.lead.Name}`} title={formatPhone(current.lead.Phone)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[color:var(--hair-5)] text-ink-2 hover:bg-surface-2">
                <Phone className="w-4 h-4" />
              </a>
            )}
            {current.lead.AI_Mode === 'Off'
              ? <Button icon={<Bot className="w-4 h-4" />} loading={busy} onClick={() => setMode('On')}>Hand back</Button>
              : <Button type="primary" icon={<Hand className="w-4 h-4" />} loading={busy} onClick={() => setMode('Off')}>Take over</Button>}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
            {current.thread.length
              ? current.thread.map((m) => <Bubble key={m.Message_ID} m={m} reduce={reduce} />)
              : <p className="text-[13px] text-ink-3">Only the last message is on record: “{current.lead.Last_Message}”.</p>}
            <div ref={endRef} />
          </div>
          <Composer key={current.lead.Lead_ID} c={current} />
        </section>
      )}
    </div>
  );
}
