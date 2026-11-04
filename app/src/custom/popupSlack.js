'use client';
// src/custom/popupSlack.js — releases the temporary scroll room the kernel adds for dropdowns (client report, 4 Nov 2026).
//
// Root cause: src/config/popup.js `ensureRoomBelow` makes every Select / DatePicker open downward. When a field near the bottom
// of a panel opens and the window has too little room below it, it adds extra padding-bottom to that panel (a modal
// `[data-modal-panel]`, a drawer body or <main>) so the panel can scroll — and nothing ever takes the padding away. In the Add lead
// modal the Broker field is the last one, so in a short window choosing a broker left blank space under the form and the dialog
// grew (and grew again on every open). Kit defect, reported to the skill owner; fixed here without editing a generated file.
//
// Fix: once no dropdown or date picker is open any more, give each panel back its own padding. Opening still scrolls as before.
const OPEN = '.ant-select-open, .ant-select-focused.ant-select-open, .ant-picker-focused.ant-picker-open, .ant-picker-open';

export function releaseSlack(root = typeof document !== 'undefined' ? document : null) {
  if (!root) return;
  for (const el of root.querySelectorAll('[data-os-slack]')) {
    el.style.paddingBottom = '';
    delete el.dataset.osSlack;
  }
}

let timer = 0;
function settle() {
  // after the popup's own close (option click, Escape, Tab, a click elsewhere) has run, whatever closed it
  clearTimeout(timer);
  timer = setTimeout(() => { if (document.querySelector('[data-os-slack]') && !document.querySelector(OPEN)) releaseSlack(); }, 200);
}

if (typeof window !== 'undefined' && !window.__osSlackWatch) {
  window.__osSlackWatch = true;
  // a Select / DatePicker opening or closing toggles its class: watch that, so no way of closing is missed
  new MutationObserver((records) => { if (records.some((r) => r.target.classList?.contains('ant-select') || r.target.classList?.contains('ant-picker'))) settle(); })
    .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('click', settle, true);
}
