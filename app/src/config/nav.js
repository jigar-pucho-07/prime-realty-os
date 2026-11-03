// src/config/nav.js — generated from os.yaml portals[] + pages[]. ONE place: sidebar (with groups/children), header title/description, quick links, guards.
export const PORTALS = [{"id": "admin", "label": "Admin", "base": "/", "roles": ["admin", "broker"]}];
export const NAV = [
  {
    "id": "overview",
    "portal": "admin",
    "path": "/",
    "label": "Dashboard",
    "icon": "LayoutDashboard",
    "desc": "Leads, site visits and bookings this month — and what needs a person now",
    "kind": "overview"
  },
  {
    "id": "inbox",
    "portal": "admin",
    "path": "/inbox",
    "label": "Inbox",
    "icon": "MessagesSquare",
    "desc": "Every WhatsApp and call conversation — take over from the AI agent and reply by hand",
    "group": "Main",
    "badge": {
      "entity": "leads",
      "where": "AI_Mode=Off and Stage not in [Booked, Lost]"
    },
    "subtitle": "Read what the AI agent said, take over when a client needs a person, hand back when done"
  },
  {
    "id": "leads",
    "portal": "admin",
    "path": "/leads",
    "label": "Leads",
    "icon": "Users",
    "desc": "Every lead from WhatsApp and calls, from first message to booked or lost",
    "group": "Sales",
    "subtitle": "Every enquiry the AI agent captured, by stage"
  },
  {
    "id": "visits",
    "portal": "admin",
    "path": "/site-visits",
    "label": "Site visits",
    "icon": "CalendarCheck",
    "desc": "Every site visit and booking — confirm, record the outcome, see the broker log",
    "group": "Sales",
    "subtitle": "Visits the AI agent and the office booked, and how each one ended"
  },
  {
    "id": "inventory",
    "portal": "admin",
    "path": "/inventory",
    "label": "Inventory",
    "icon": "Building2",
    "desc": "Every property the AI agent may offer — only Available ones are offered",
    "group": "Properties",
    "subtitle": "The AI agent offers only what is Available here, the moment you change it"
  },
  {
    "id": "followups",
    "portal": "admin",
    "path": "/follow-ups",
    "label": "Follow-ups",
    "icon": "BellRing",
    "desc": "Clients who said busy or \"baad mein\" — the agent nudges them up to three times",
    "group": "Sales",
    "subtitle": "The AI agent sends up to three nudges; stop or reschedule any of them here"
  },
  {
    "id": "calls",
    "portal": "admin",
    "path": "/calls",
    "label": "Call recordings",
    "icon": "PhoneCall",
    "desc": "Calls the AI voice agent answered, with transcript and outcome",
    "group": "Automation",
    "subtitle": "Every call the AI voice agent answered — transcript, outcome and recording"
  },
  {
    "id": "brokers",
    "portal": "admin",
    "path": "/brokers",
    "label": "Brokers",
    "icon": "UserCog",
    "desc": "The brokers the AI agent assigns visits to, by specialty, with their visits and closures",
    "group": "Team",
    "subtitle": "Who gets which visit — residential, commercial or plots — and how each is closing"
  },
  {
    "id": "ai_agents",
    "portal": "admin",
    "path": "/ai-agents",
    "label": "AI agents",
    "icon": "Bot",
    "desc": "The WhatsApp agent, the voice agent and the follow-up scheduler — recent runs and failures",
    "group": "Automation",
    "subtitle": "What the three agents did, and every run that failed"
  },
  {
    "id": "agent_settings",
    "portal": "admin",
    "path": "/agent-settings",
    "label": "Agent settings",
    "icon": "SlidersHorizontal",
    "desc": "The agent's name and language, follow-up timing and company details",
    "group": "Automation",
    "subtitle": "Changes reach the agents on their next run"
  },
  {
    "id": "my_visits",
    "portal": "admin",
    "path": "/my-visits",
    "label": "My site visits",
    "icon": "CalendarCheck",
    "desc": "The visits assigned to me — call the client and record the outcome",
    "subtitle": "Your visits, today first"
  },
  {
    "id": "my_leads",
    "portal": "admin",
    "path": "/my-leads",
    "label": "My leads",
    "icon": "Users",
    "desc": "Leads assigned to me, with the full conversation",
    "subtitle": "Your leads and what each client said to the AI agent"
  },
  {
    "id": "my_followups",
    "portal": "admin",
    "path": "/my-follow-ups",
    "label": "My follow-ups",
    "icon": "BellRing",
    "desc": "My clients who asked to be contacted later",
    "subtitle": "Your clients the agent is nudging"
  },
  {
    "id": "users",
    "portal": "admin",
    "path": "/users",
    "label": "Users & roles",
    "icon": "Users",
    "desc": "Everyone who can sign in, and what each role may open",
    "group": "Setup",
    "kind": "users",
    "subtitle": "Add people, reset passwords, change roles"
  },
  {
    "id": "settings",
    "portal": "admin",
    "path": "/settings",
    "label": "Settings",
    "icon": "Settings",
    "desc": "Profile and password",
    "kind": "settings"
  }
];
export function portalFor(pathname) {
  return [...PORTALS].sort((a, b) => b.base.length - a.base.length).find((p) => pathname === p.base || pathname.startsWith(p.base === '/' ? '/' : p.base + '/')) ?? PORTALS[0];
}
export function navFor(portalId) { return NAV.filter((n) => n.portal === portalId); }
export function metaForPath(pathname) {
  const hit = [...NAV].sort((a, b) => b.path.length - a.path.length).find((n) => pathname === n.path || (n.path !== '/' && pathname.startsWith(n.path + '/')));
  return hit ?? { label: 'Prime Realty OS', desc: '' };
}
