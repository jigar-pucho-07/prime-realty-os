// src/custom/index.js — the agent's 20%. Register custom sections/components by name; os.yaml refers to them via `custom: <Name>`.
// This file and this folder are never regenerated.
import './custom.css';
import './popupSlack';   // gives panels back the scroll room a dropdown borrowed (Add lead grew when a broker was picked)
import ConversationInbox from './ConversationInbox';

export const CUSTOM = { ConversationInbox };
