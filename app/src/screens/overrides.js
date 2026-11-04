// src/screens/overrides.js — never regenerated. If the agent replaces a whole page, register it here: { enquiries: MyEnquiriesPage }.
import { createElement, Fragment } from 'react';
import Page from '../module/Page';
import OverviewPage from '../module/OverviewPage';
import SettingsPage from '../module/SettingsPage';
import UsersPage from '../module/UsersPage';
import DashboardPage from '../custom/DashboardPage';
import PrPage from '../custom/PrPage';
import HeaderSearch from '../custom/HeaderSearch';

// overview: the kernel Dashboard with the KPI cards and charts first (client request, 3 Nov 2026) — same parts, new order.
// PrPage = the kernel page with two changes (client request, 4 Nov 2026): multi-select status chips (custom/PrTableBlock) and the
// phone control in forms (custom/PrFields). Every page with status chips uses it, plus brokers (Add / Edit broker take a mobile).
// A new page with `segments:` in os.yaml should be added here too, or its chips stay single-select.
const STATUS_CHIP_PAGES = ['leads', 'visits', 'inventory', 'followups', 'calls', 'ai_agents', 'my_leads', 'my_followups'];
const PAGES = { overview: DashboardPage, brokers: PrPage, ...Object.fromEntries(STATUS_CHIP_PAGES.map((id) => [id, PrPage])) };

// Every page also carries the header's always-visible search box (custom/HeaderSearch, client request 4 Nov 2026). AppShell asks
// OVERRIDES[page id] for every page, so each id resolves to its page — the one above, else the kernel's for the page's kind (the same
// table as components/AppShell.jsx) — wrapped once (cached: a page never remounts because of the wrapper). Detail pages (kind
// `detail`) are not routed through OVERRIDES by the kernel; this OS declares none.
const KIND = { module: Page, page: Page, overview: OverviewPage, settings: SettingsPage, users: UsersPage };
const wrapped = new Map();
function withSearch(id) {
  if (!wrapped.has(id)) {
    const W = ({ config }) => createElement(Fragment, null, createElement(HeaderSearch), createElement(PAGES[id] ?? KIND[config.kind ?? 'module'] ?? Page, { config }));
    W.displayName = `WithHeaderSearch(${id})`;
    wrapped.set(id, W);
  }
  return wrapped.get(id);
}
export const OVERRIDES = new Proxy(PAGES, { get: (_, id) => (typeof id === 'string' ? withSearch(id) : undefined) });
