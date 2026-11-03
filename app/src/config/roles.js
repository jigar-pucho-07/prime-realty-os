// src/config/roles.js — generated from os.yaml roles[].
export const ROLES = {"ADMIN": "admin", "BROKER": "broker"};
export const ROLE_PERMISSIONS = {"admin": ["overview", "inbox", "leads", "visits", "followups", "inventory", "calls", "ai_agents", "agent_settings", "brokers", "settings", "users"], "broker": ["my_visits", "my_leads", "my_followups", "settings"]};
export const ROLE_LABELS = {"admin": "Office admin", "broker": "Broker"};
export const ROLE_COLORS = {"admin": "bg-brand-500", "broker": "bg-brand-500"};
export const ROLE_HOME = {"admin": "/", "broker": "/my-visits"};
export const ROLE_DESC = {"admin": "Runs the desk: inbox, leads, site visits, inventory, brokers and the AI agent", "broker": "Works the site visits and leads assigned to them"};   // plain-language access description shown in Settings (audit M12)
// v5.1: the pages Administrator's menu lists (os.yaml roles[admin].pages); null = every page. Access stays unrestricted.
export const ADMIN_MENU = ["overview", "inbox", "leads", "visits", "followups", "inventory", "calls", "ai_agents", "agent_settings", "brokers", "settings", "users"];
export function homeFor(role) { return ROLE_HOME[role] ?? '/'; }
