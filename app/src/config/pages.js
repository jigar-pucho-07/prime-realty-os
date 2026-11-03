// src/config/pages.js — generated from os.yaml pages[]. Do not edit; edit os.yaml.
export const PAGES = [
  {
    "id": "overview",
    "covers": [
      "R14",
      "R15"
    ],
    "kind": "overview",
    "route": "/",
    "label": "Dashboard",
    "icon": "LayoutDashboard",
    "desc": "Leads, site visits and bookings this month — and what needs a person now",
    "greeting": "Here is the desk today.",
    "quick_links": false,
    "kpis": [
      {
        "metric": "leads_month",
        "entity": "leads",
        "label": "Leads this month",
        "tone": "info",
        "icon": "Inbox",
        "formula": "count where Created_At in month",
        "filter": "Created_At in month",
        "alert": false
      },
      {
        "metric": "visits_open",
        "entity": "bookings",
        "label": "Visits scheduled",
        "tone": "info",
        "icon": "CalendarCheck",
        "formula": "count where Status=Scheduled",
        "filter": "Status=Scheduled",
        "alert": false
      },
      {
        "metric": "booked_month",
        "entity": "bookings",
        "label": "Booked this month",
        "tone": "ok",
        "icon": "BadgeCheck",
        "formula": "count where Status=Booked and Created_At in month",
        "filter": "Status=Booked and Created_At in month",
        "alert": false
      },
      {
        "metric": "pipeline_value",
        "entity": "bookings",
        "label": "Revenue pipeline",
        "tone": "info",
        "icon": "IndianRupee",
        "formula": "sum Budget_INR where Status in [Scheduled, Visited]",
        "filter": "Status in [Scheduled, Visited]",
        "format": "money_l",
        "alert": false
      }
    ],
    "queues": [
      {
        "metric": "unassigned",
        "entity": "leads",
        "action": "assign_broker",
        "action_label": "Assign",
        "sub": "Property_Interest",
        "link": "/leads",
        "label": "Unassigned",
        "tone": "warn",
        "icon": "UserX",
        "where": "Broker is empty and Stage not in [Booked, Lost]"
      },
      {
        "metric": "visits_today",
        "entity": "bookings",
        "action": "visit_outcome",
        "action_label": "Visit outcome",
        "sub": "Property_Name",
        "link": "/site-visits",
        "label": "Visits today",
        "tone": "warn",
        "icon": "CalendarClock",
        "where": "Visit_At=today and Status=Scheduled"
      },
      {
        "metric": "followups_due",
        "entity": "followups",
        "action": "stop_followup",
        "action_label": "Stop",
        "sub": "Reason",
        "link": "/follow-ups",
        "label": "Follow-ups due",
        "tone": "warn",
        "icon": "BellRing",
        "where": "Next_Due_At<=today and Status=Pending"
      }
    ],
    "charts": [
      {
        "id": "lead-funnel",
        "type": "funnel",
        "entity": "leads",
        "title": "Lead funnel",
        "where": "Stage!=Lost"
      },
      {
        "id": "lead-sources",
        "type": "breakdown",
        "entity": "leads",
        "title": "Lead sources",
        "group": "Source"
      }
    ],
    "recent": {
      "title": "Recent bookings",
      "entity": "bookings",
      "date": "Created_At",
      "limit": 8,
      "link": "/site-visits",
      "columns": [
        {
          "key": "Client_Name",
          "type": "text",
          "sub": "Property_Name",
          "grow": true
        },
        {
          "key": "Visit_At",
          "type": "date"
        },
        {
          "key": "Status",
          "type": "badge"
        }
      ]
    },
    "modals": [
      {
        "id": "assign_broker",
        "kind": "edit",
        "title": "Assign broker",
        "entity": "leads",
        "direct": "patch",
        "summary": [
          "Name",
          "Area_Pref"
        ],
        "submit": "Assign",
        "success": "Broker assigned",
        "fields": [
          {
            "key": "Broker",
            "label": "Broker",
            "type": "select",
            "options_from": "brokers.Name",
            "required": true
          }
        ]
      },
      {
        "id": "visit_outcome",
        "kind": "status",
        "title": "Visit outcome",
        "entity": "bookings",
        "direct": "patch",
        "summary": [
          "Client_Name",
          "Property_Name"
        ],
        "submit": "Save outcome",
        "fields": [
          {
            "key": "Status",
            "label": "Outcome",
            "type": "select",
            "options": [
              "Visited",
              "Booked",
              "Cancelled"
            ],
            "required": true
          },
          {
            "key": "Deal_Value_INR",
            "label": "Deal value (₹)",
            "type": "number",
            "show_when": "Status=Booked",
            "required_when": "Status=Booked"
          },
          {
            "key": "Commission_INR",
            "label": "Commission (₹)",
            "type": "number",
            "show_when": "Status=Booked"
          },
          {
            "key": "Cancel_Reason",
            "label": "Reason",
            "type": "textarea",
            "rows": 2,
            "show_when": "Status=Cancelled",
            "required_when": "Status=Cancelled"
          }
        ]
      },
      {
        "id": "stop_followup",
        "kind": "status",
        "title": "Stop follow-ups",
        "entity": "followups",
        "direct": "patch",
        "summary": [
          "Lead_Name",
          "Count"
        ],
        "submit": "Stop",
        "context": {
          "Status": "Stopped"
        },
        "fields": []
      }
    ],
    "portal": "admin"
  },
  {
    "id": "inbox",
    "covers": [
      "R11",
      "R21"
    ],
    "route": "/inbox",
    "group": "Main",
    "label": "Inbox",
    "icon": "MessagesSquare",
    "desc": "Every WhatsApp and call conversation — take over from the AI agent and reply by hand",
    "subtitle": "Read what the AI agent said, take over when a client needs a person, hand back when done",
    "entity": "messages",
    "badge": {
      "entity": "leads",
      "where": "AI_Mode=Off and Stage not in [Booked, Lost]"
    },
    "blocks": [
      {
        "type": "custom",
        "name": "ConversationInbox",
        "covers": [
          "R11",
          "R21"
        ],
        "id": "inbox-custom"
      }
    ],
    "modals": [
      {
        "id": "take_over",
        "kind": "status",
        "title": "Take over from the AI agent",
        "entity": "leads",
        "direct": "patch",
        "summary": [
          "Name",
          "Phone"
        ],
        "submit": "Take over",
        "context": {
          "AI_Mode": "Off"
        },
        "fields": []
      },
      {
        "id": "hand_back",
        "kind": "status",
        "title": "Hand back to the AI agent",
        "entity": "leads",
        "direct": "patch",
        "summary": [
          "Name",
          "Phone"
        ],
        "submit": "Hand back",
        "context": {
          "AI_Mode": "On"
        },
        "fields": []
      }
    ],
    "actions": {
      "header": [],
      "row": [
        "take_over",
        "hand_back"
      ]
    },
    "portal": "admin"
  },
  {
    "id": "leads",
    "covers": [
      "R20",
      "R1"
    ],
    "route": "/leads",
    "group": "Sales",
    "label": "Leads",
    "icon": "Users",
    "desc": "Every lead from WhatsApp and calls, from first message to booked or lost",
    "subtitle": "Every enquiry the AI agent captured, by stage",
    "entity": "leads",
    "blocks": [
      {
        "type": "kpis",
        "kpis": [
          {
            "metric": "leads_month",
            "entity": "leads",
            "label": "Leads this month",
            "tone": "info",
            "icon": "Inbox",
            "formula": "count where Created_At in month",
            "filter": "Created_At in month",
            "alert": false
          },
          {
            "metric": "unassigned",
            "entity": "leads",
            "label": "Unassigned",
            "tone": "warn",
            "icon": "UserX",
            "formula": "count where Broker is empty and Stage not in [Booked, Lost]",
            "filter": "Broker is empty and Stage not in [Booked, Lost]",
            "alert": true
          },
          {
            "metric": "taken_over",
            "entity": "leads",
            "label": "Taken over from AI",
            "tone": "info",
            "icon": "Hand",
            "formula": "count where AI_Mode=Off and Stage not in [Booked, Lost]",
            "filter": "AI_Mode=Off and Stage not in [Booked, Lost]",
            "alert": false
          }
        ],
        "id": "leads-kpis"
      },
      {
        "type": "table",
        "segments": {
          "column": "Stage",
          "all": "All leads"
        },
        "period": {
          "column": "Created_At",
          "presets": [
            "7d",
            "30d",
            "month",
            "all"
          ],
          "default": "all"
        },
        "views": [
          "kanban",
          "table"
        ],
        "columns": [
          {
            "key": "Name",
            "type": "text",
            "sub": "Phone"
          },
          {
            "key": "Stage",
            "type": "badge"
          },
          {
            "key": "Next_Followup_At",
            "header": "Follow-up",
            "type": "due"
          },
          {
            "key": "Budget_Max_INR",
            "header": "Budget up to",
            "type": "money"
          },
          {
            "key": "Broker",
            "type": "owner"
          },
          {
            "key": "Area_Pref",
            "header": "Area",
            "type": "tag"
          },
          {
            "key": "Source",
            "type": "tag"
          },
          {
            "key": "AI_Mode",
            "header": "AI",
            "type": "badge"
          },
          {
            "key": "Lead_ID",
            "type": "id",
            "priority": "low"
          }
        ],
        "search": [
          "Name",
          "Phone",
          "Lead_ID",
          "Area_Pref",
          "Property_Interest"
        ],
        "filters": [
          "Source",
          "Broker",
          "Property_Type"
        ],
        "bulk": [
          "assign_broker"
        ],
        "assign": "assign_broker",
        "kanban": {
          "column": "Stage",
          "stages": [
            "New",
            "Engaged",
            "Visit Scheduled",
            "Booked",
            "Lost"
          ],
          "locked": [
            "Lost"
          ],
          "title": "Name",
          "subtitle": "Area_Pref",
          "meta": [
            "Budget_Max_INR",
            "Next_Followup_At"
          ],
          "avatar": "Broker",
          "move": {
            "direct": "patch"
          }
        },
        "drawer": {
          "title_column": "Name",
          "tabs": [
            {
              "label": "Lead",
              "sections": [
                {
                  "type": "tiles",
                  "title": "Requirement",
                  "columns": [
                    "Purpose",
                    "Property_Type",
                    "BHK",
                    "Area_Pref",
                    "Budget_Min_INR",
                    "Budget_Max_INR"
                  ]
                },
                {
                  "type": "callout",
                  "column": "Summary",
                  "title": "What the AI agent understood",
                  "tone": "neutral"
                },
                {
                  "type": "fields",
                  "columns": [
                    "Phone",
                    "Source",
                    "Broker",
                    "AI_Mode",
                    "Lang",
                    "Property_Interest",
                    "Lost_Reason"
                  ],
                  "hide_empty": true
                }
              ]
            },
            {
              "label": "Conversation",
              "sections": [
                {
                  "type": "timeline",
                  "entity": "messages",
                  "by": "Lead_ID",
                  "date": "At",
                  "actor": "Sender",
                  "body": "Text",
                  "limit": 20
                }
              ]
            },
            {
              "label": "Visits",
              "sections": [
                {
                  "type": "related",
                  "entity": "bookings",
                  "by": "Lead_ID",
                  "title": "Site visits",
                  "columns": [
                    "Property_Name",
                    "Visit_At",
                    "Broker",
                    "Status"
                  ]
                }
              ]
            }
          ]
        },
        "empty": {
          "title": "No leads yet",
          "reason": "Leads arrive on their own when a client messages the WhatsApp number or calls.",
          "action": "add_lead"
        },
        "actions": {
          "header": [
            "add_lead"
          ],
          "row": [
            "book_visit",
            "assign_broker",
            "lose"
          ]
        },
        "id": "leads-table"
      }
    ],
    "modals": [
      {
        "id": "add_lead",
        "kind": "create",
        "title": "Add lead",
        "direct": "insert",
        "submit": "Add lead",
        "success": "Lead added",
        "context": {
          "Stage": "New",
          "AI_Mode": "Off"
        },
        "primary": true,
        "fields": [
          {
            "key": "Name",
            "label": "Client name",
            "type": "text",
            "required": true
          },
          {
            "key": "Phone",
            "label": "Mobile",
            "type": "text",
            "required": true,
            "placeholder": "+91…"
          },
          {
            "key": "Source",
            "label": "Source",
            "type": "select",
            "options": [
              "Walk-in",
              "Referral",
              "WhatsApp",
              "Voice"
            ],
            "default": "Walk-in",
            "required": true
          },
          {
            "key": "Property_Type",
            "label": "Looking for",
            "type": "select",
            "options": [
              "Residential",
              "Commercial",
              "Plot"
            ]
          },
          {
            "key": "Area_Pref",
            "label": "Area",
            "type": "text",
            "placeholder": "e.g. Kolar Road"
          },
          {
            "key": "Budget_Max_INR",
            "label": "Budget up to (₹)",
            "type": "number"
          },
          {
            "key": "Broker",
            "label": "Broker",
            "type": "select",
            "options_from": "brokers.Name"
          }
        ]
      },
      {
        "id": "book_visit",
        "covers": [
          "R13"
        ],
        "kind": "custom",
        "title": "Book site visit",
        "flow": "VISITS",
        "action": "schedule_visit",
        "submit": "Book visit",
        "pending": "Booking…",
        "success": "Visit booked — broker alerted on WhatsApp",
        "summary": [
          "Name",
          "Phone"
        ],
        "pass": [
          "Lead_ID",
          "Name",
          "Phone",
          "Source"
        ],
        "fields": [
          {
            "key": "Property_Name",
            "label": "Property",
            "type": "select",
            "options_from": "properties.Name",
            "required": true
          },
          {
            "key": "Broker",
            "label": "Broker",
            "type": "select",
            "options_from": "brokers.Name",
            "required": true
          },
          {
            "key": "Visit_At",
            "label": "Visit date and time",
            "type": "date",
            "required": true
          },
          {
            "key": "Budget_INR",
            "label": "Budget (₹)",
            "type": "number"
          },
          {
            "key": "Notes",
            "label": "Notes for the broker",
            "type": "textarea",
            "rows": 2
          }
        ]
      },
      {
        "id": "assign_broker",
        "kind": "edit",
        "title": "Assign broker",
        "direct": "patch",
        "summary": [
          "Name",
          "Area_Pref"
        ],
        "submit": "Assign",
        "success": "Broker assigned",
        "fields": [
          {
            "key": "Broker",
            "label": "Broker",
            "type": "select",
            "options_from": "brokers.Name",
            "required": true
          }
        ]
      },
      {
        "id": "lose",
        "kind": "status",
        "title": "Mark lost",
        "direct": "patch",
        "summary": [
          "Name",
          "Stage"
        ],
        "submit": "Mark lost",
        "context": {
          "Stage": "Lost"
        },
        "fields": [
          {
            "key": "Lost_Reason",
            "label": "Reason",
            "type": "textarea",
            "rows": 2,
            "required": true
          }
        ]
      }
    ],
    "portal": "admin"
  },
  {
    "id": "visits",
    "covers": [
      "R13",
      "R16"
    ],
    "route": "/site-visits",
    "group": "Sales",
    "label": "Site visits",
    "icon": "CalendarCheck",
    "desc": "Every site visit and booking — confirm, record the outcome, see the broker log",
    "subtitle": "Visits the AI agent and the office booked, and how each one ended",
    "entity": "bookings",
    "blocks": [
      {
        "type": "kpis",
        "kpis": [
          {
            "metric": "visits_today",
            "entity": "bookings",
            "label": "Visits today",
            "tone": "warn",
            "icon": "CalendarClock",
            "formula": "count where Visit_At=today and Status=Scheduled",
            "filter": "Visit_At=today and Status=Scheduled",
            "alert": true
          },
          {
            "metric": "visits_open",
            "entity": "bookings",
            "label": "Visits scheduled",
            "tone": "info",
            "icon": "CalendarCheck",
            "formula": "count where Status=Scheduled",
            "filter": "Status=Scheduled",
            "alert": false
          },
          {
            "metric": "booked_month",
            "entity": "bookings",
            "label": "Booked this month",
            "tone": "ok",
            "icon": "BadgeCheck",
            "formula": "count where Status=Booked and Created_At in month",
            "filter": "Status=Booked and Created_At in month",
            "alert": false
          },
          {
            "metric": "pipeline_value",
            "entity": "bookings",
            "label": "Revenue pipeline",
            "tone": "info",
            "icon": "IndianRupee",
            "formula": "sum Budget_INR where Status in [Scheduled, Visited]",
            "filter": "Status in [Scheduled, Visited]",
            "format": "money_l",
            "alert": false
          }
        ],
        "id": "visits-kpis"
      },
      {
        "type": "table",
        "segments": {
          "column": "Status",
          "all": "All visits"
        },
        "period": {
          "column": "Visit_At",
          "presets": [
            "today",
            "7d",
            "30d",
            "month",
            "all"
          ],
          "default": "all"
        },
        "views": [
          "table",
          "kanban"
        ],
        "columns": [
          {
            "key": "Client_Name",
            "type": "text",
            "sub": "Client_Phone"
          },
          {
            "key": "Property_Name",
            "header": "Property",
            "type": "text"
          },
          {
            "key": "Visit_At",
            "header": "Visit",
            "type": "due"
          },
          {
            "key": "Broker",
            "type": "owner"
          },
          {
            "key": "Budget_INR",
            "header": "Budget",
            "type": "money"
          },
          {
            "key": "Status",
            "type": "badge"
          },
          {
            "key": "Created_By",
            "header": "Booked by",
            "type": "tag"
          },
          {
            "key": "Commission_INR",
            "header": "Commission",
            "type": "money",
            "priority": "low"
          },
          {
            "key": "Booking_ID",
            "type": "id",
            "priority": "low"
          }
        ],
        "search": [
          "Client_Name",
          "Client_Phone",
          "Property_Name",
          "Booking_ID"
        ],
        "filters": [
          "Broker",
          "Source",
          "Created_By"
        ],
        "kanban": {
          "column": "Status",
          "stages": [
            "Scheduled",
            "Visited",
            "Booked",
            "Cancelled"
          ],
          "locked": [
            "Booked",
            "Cancelled"
          ],
          "title": "Client_Name",
          "subtitle": "Property_Name",
          "meta": [
            "Visit_At",
            "Budget_INR"
          ],
          "avatar": "Broker",
          "move": {
            "direct": "patch"
          }
        },
        "actions": {
          "header": [],
          "row": [
            "visit_outcome",
            "reassign",
            "confirm_client"
          ]
        },
        "id": "visits-table"
      }
    ],
    "modals": [
      {
        "id": "visit_outcome",
        "kind": "status",
        "title": "Visit outcome",
        "direct": "patch",
        "summary": [
          "Client_Name",
          "Property_Name"
        ],
        "submit": "Save outcome",
        "fields": [
          {
            "key": "Status",
            "label": "Outcome",
            "type": "select",
            "options": [
              "Visited",
              "Booked",
              "Cancelled",
              "Scheduled"
            ],
            "required": true
          },
          {
            "key": "Deal_Value_INR",
            "label": "Deal value (₹)",
            "type": "number",
            "show_when": "Status=Booked",
            "required_when": "Status=Booked"
          },
          {
            "key": "Commission_INR",
            "label": "Commission (₹)",
            "type": "number",
            "show_when": "Status=Booked"
          },
          {
            "key": "Cancel_Reason",
            "label": "Reason",
            "type": "textarea",
            "rows": 2,
            "show_when": "Status=Cancelled",
            "required_when": "Status=Cancelled"
          }
        ]
      },
      {
        "id": "reassign",
        "kind": "edit",
        "title": "Reschedule or reassign",
        "direct": "patch",
        "summary": [
          "Client_Name",
          "Visit_At"
        ],
        "submit": "Save",
        "fields": [
          {
            "key": "Visit_At",
            "label": "Visit date and time",
            "type": "date"
          },
          {
            "key": "Broker",
            "label": "Broker",
            "type": "select",
            "options_from": "brokers.Name"
          }
        ]
      },
      {
        "id": "confirm_client",
        "covers": [
          "R13"
        ],
        "kind": "status",
        "title": "Send confirmation to client",
        "flow": "VISITS",
        "action": "confirm_client",
        "submit": "Send on WhatsApp",
        "pending": "Sending…",
        "success": "Confirmation sent",
        "summary": [
          "Client_Name",
          "Property_Name",
          "Visit_At"
        ],
        "intro": "Sends the approved visit-confirmation template to the client's WhatsApp.",
        "pass": [
          "Booking_ID",
          "Client_Name",
          "Client_Phone",
          "Property_Name",
          "Visit_At",
          "Broker"
        ],
        "fields": []
      }
    ],
    "portal": "admin"
  },
  {
    "id": "inventory",
    "covers": [
      "R12",
      "R14",
      "R4"
    ],
    "route": "/inventory",
    "group": "Properties",
    "label": "Inventory",
    "icon": "Building2",
    "desc": "Every property the AI agent may offer — only Available ones are offered",
    "subtitle": "The AI agent offers only what is Available here, the moment you change it",
    "entity": "properties",
    "blocks": [
      {
        "type": "kpis",
        "kpis": [
          {
            "metric": "active_props",
            "entity": "properties",
            "label": "Active properties",
            "tone": "info",
            "icon": "Building2",
            "formula": "count where Status in [Available, Under Negotiation]",
            "filter": "Status in [Available, Under Negotiation]",
            "alert": false
          },
          {
            "label": "Sold",
            "formula": "count where Status=Sold",
            "icon": "BadgeCheck",
            "entity": "properties"
          },
          {
            "label": "Under negotiation",
            "formula": "count where Status=Under Negotiation",
            "icon": "Handshake",
            "entity": "properties"
          }
        ],
        "id": "inventory-kpis"
      },
      {
        "type": "table",
        "segments": {
          "column": "Status",
          "all": "All properties"
        },
        "views": [
          "cards",
          "table"
        ],
        "columns": [
          {
            "key": "Name",
            "type": "text",
            "sub": "Area_Name"
          },
          {
            "key": "Type",
            "type": "tag"
          },
          {
            "key": "Config",
            "type": "tag"
          },
          {
            "key": "Price_Min_INR",
            "header": "From",
            "type": "money"
          },
          {
            "key": "Price_Max_INR",
            "header": "To",
            "type": "money"
          },
          {
            "key": "Size",
            "type": "number"
          },
          {
            "key": "Size_Unit",
            "header": "Unit",
            "type": "text"
          },
          {
            "key": "Status",
            "type": "badge"
          },
          {
            "key": "Property_ID",
            "type": "id",
            "priority": "low"
          }
        ],
        "card": {
          "title": "Name",
          "subtitle": [
            "Area_Name",
            "Config"
          ],
          "badge": "Status",
          "fields": [
            {
              "key": "Price_Min_INR",
              "label": "From",
              "icon": "IndianRupee"
            },
            {
              "key": "Price_Max_INR",
              "label": "To",
              "icon": "IndianRupee"
            },
            {
              "key": "Size",
              "label": "Size",
              "icon": "Ruler"
            },
            {
              "key": "Possession",
              "label": "Possession",
              "icon": "CalendarDays"
            }
          ],
          "tags": {
            "column": "Tags"
          },
          "actions": [
            "edit_property",
            "set_status"
          ]
        },
        "search": [
          "Name",
          "Area_Name",
          "Property_ID",
          "Tags"
        ],
        "filters": [
          "Type",
          "Area_Name",
          "Config"
        ],
        "actions": {
          "header": [
            "add_property"
          ],
          "row": [
            "edit_property",
            "set_status"
          ]
        },
        "id": "inventory-table"
      }
    ],
    "modals": [
      {
        "id": "add_property",
        "covers": [
          "R12"
        ],
        "kind": "create",
        "title": "Add property",
        "direct": "insert",
        "size": "lg",
        "submit": "Add property",
        "success": "Property added",
        "context": {
          "City": "Bhopal",
          "Status": "Available",
          "Size_Unit": "sq.ft"
        },
        "primary": true,
        "fields": [
          {
            "key": "Name",
            "label": "Property name",
            "type": "text",
            "required": true,
            "placeholder": "e.g. 3BHK Luxury Apartment"
          },
          {
            "key": "Type",
            "label": "Type",
            "type": "select",
            "options": [
              "Residential",
              "Commercial",
              "Plot"
            ],
            "required": true
          },
          {
            "key": "Area_Name",
            "label": "Location",
            "type": "text",
            "required": true,
            "placeholder": "Area, e.g. Kolar Road"
          },
          {
            "key": "Config",
            "label": "BHK / config",
            "type": "select",
            "options": [
              "1 BHK",
              "2 BHK",
              "3 BHK",
              "4 BHK",
              "Shop",
              "Office",
              "Plot",
              "Land"
            ],
            "required": true
          },
          {
            "key": "Price_Min_INR",
            "label": "Price from (₹)",
            "type": "number",
            "required": true
          },
          {
            "key": "Price_Max_INR",
            "label": "Price to (₹)",
            "type": "number",
            "required": true
          },
          {
            "key": "Size",
            "label": "Area (sq.ft)",
            "type": "number"
          },
          {
            "key": "Tags",
            "label": "Tags (comma separated)",
            "type": "text",
            "placeholder": "Ready to Move, Gated Society, RERA Approved"
          }
        ]
      },
      {
        "id": "edit_property",
        "kind": "edit",
        "title": "Edit property",
        "direct": "patch",
        "summary": [
          "Name",
          "Area_Name"
        ],
        "submit": "Save",
        "fields": [
          {
            "key": "Price_Min_INR",
            "label": "Price from (₹)",
            "type": "number"
          },
          {
            "key": "Price_Max_INR",
            "label": "Price to (₹)",
            "type": "number"
          },
          {
            "key": "Size",
            "label": "Area",
            "type": "number"
          },
          {
            "key": "Size_Unit",
            "label": "Unit",
            "type": "select",
            "options": [
              "sq.ft",
              "sq.yd",
              "acre"
            ]
          },
          {
            "key": "Floor",
            "label": "Floor",
            "type": "text"
          },
          {
            "key": "Parking",
            "label": "Parking",
            "type": "text"
          },
          {
            "key": "Possession",
            "label": "Possession",
            "type": "text",
            "placeholder": "Ready to Move / Dec 2026"
          },
          {
            "key": "Tags",
            "label": "Tags",
            "type": "text"
          }
        ]
      },
      {
        "id": "set_status",
        "kind": "status",
        "title": "Change status",
        "direct": "patch",
        "summary": [
          "Name",
          "Status"
        ],
        "submit": "Save",
        "fields": [
          {
            "key": "Status",
            "label": "Status",
            "type": "select",
            "options_status": true,
            "required": true
          }
        ]
      }
    ],
    "portal": "admin"
  },
  {
    "id": "followups",
    "covers": [
      "R9",
      "R22",
      "R8"
    ],
    "route": "/follow-ups",
    "group": "Sales",
    "label": "Follow-ups",
    "icon": "BellRing",
    "desc": "Clients who said busy or \"baad mein\" — the agent nudges them up to three times",
    "subtitle": "The AI agent sends up to three nudges; stop or reschedule any of them here",
    "entity": "followups",
    "blocks": [
      {
        "type": "kpis",
        "kpis": [
          {
            "metric": "followups_due",
            "entity": "followups",
            "label": "Follow-ups due",
            "tone": "warn",
            "icon": "BellRing",
            "formula": "count where Next_Due_At<=today and Status=Pending",
            "filter": "Next_Due_At<=today and Status=Pending",
            "alert": true
          },
          {
            "label": "Pending",
            "formula": "count where Status=Pending",
            "icon": "Clock",
            "entity": "followups"
          },
          {
            "label": "Replied",
            "formula": "count where Status=Replied",
            "icon": "MessageSquareReply",
            "tone": "ok",
            "entity": "followups"
          }
        ],
        "id": "followups-kpis"
      },
      {
        "type": "table",
        "segments": {
          "column": "Status",
          "all": "All follow-ups"
        },
        "columns": [
          {
            "key": "Lead_Name",
            "header": "Client",
            "type": "text",
            "sub": "Phone"
          },
          {
            "key": "Reason",
            "type": "tag"
          },
          {
            "key": "Next_Due_At",
            "header": "Next nudge",
            "type": "due"
          },
          {
            "key": "Count",
            "header": "Sent",
            "type": "number"
          },
          {
            "key": "Max_Count",
            "header": "Of",
            "type": "number"
          },
          {
            "key": "Broker",
            "type": "owner"
          },
          {
            "key": "Status",
            "type": "badge"
          },
          {
            "key": "Property_Interest",
            "header": "Interested in",
            "type": "truncate",
            "priority": "low"
          }
        ],
        "search": [
          "Lead_Name",
          "Phone",
          "Property_Interest"
        ],
        "filters": [
          "Reason",
          "Broker"
        ],
        "actions": {
          "header": [],
          "row": [
            "reschedule_followup",
            "stop_followup"
          ]
        },
        "id": "followups-table"
      }
    ],
    "modals": [
      {
        "id": "reschedule_followup",
        "kind": "edit",
        "title": "Reschedule nudge",
        "direct": "patch",
        "summary": [
          "Lead_Name",
          "Next_Due_At"
        ],
        "submit": "Save",
        "fields": [
          {
            "key": "Next_Due_At",
            "label": "Next nudge",
            "type": "date",
            "required": true
          }
        ]
      },
      {
        "id": "stop_followup",
        "kind": "status",
        "title": "Stop follow-ups",
        "direct": "patch",
        "summary": [
          "Lead_Name",
          "Count"
        ],
        "submit": "Stop",
        "context": {
          "Status": "Stopped"
        },
        "fields": []
      }
    ],
    "portal": "admin"
  },
  {
    "id": "calls",
    "covers": [
      "R10"
    ],
    "route": "/calls",
    "group": "Automation",
    "label": "Call recordings",
    "icon": "PhoneCall",
    "desc": "Calls the AI voice agent answered, with transcript and outcome",
    "subtitle": "Every call the AI voice agent answered — transcript, outcome and recording",
    "entity": "calls",
    "read_only": "Calls are written by the voice agent; the office reads them and acts on the lead",
    "blocks": [
      {
        "type": "kpis",
        "kpis": [
          {
            "label": "Calls this month",
            "formula": "count where Started_At in month",
            "icon": "PhoneCall",
            "entity": "calls"
          },
          {
            "label": "Converted to visit",
            "formula": "count where Outcome=Booking",
            "icon": "CalendarCheck",
            "tone": "ok",
            "entity": "calls"
          },
          {
            "label": "Avg duration (s)",
            "formula": "avg Duration_Sec",
            "icon": "Timer",
            "entity": "calls"
          }
        ],
        "id": "calls-kpis"
      },
      {
        "type": "table",
        "segments": {
          "column": "Outcome",
          "all": "All calls"
        },
        "period": {
          "column": "Started_At",
          "presets": [
            "7d",
            "30d",
            "month",
            "all"
          ],
          "default": "30d"
        },
        "columns": [
          {
            "key": "Caller_Name",
            "header": "Caller",
            "type": "text",
            "sub": "Phone"
          },
          {
            "key": "Started_At",
            "header": "When",
            "type": "date",
            "time": true
          },
          {
            "key": "Duration_Sec",
            "header": "Seconds",
            "type": "number"
          },
          {
            "key": "Outcome",
            "type": "badge"
          },
          {
            "key": "Property_Interest",
            "header": "Interested in",
            "type": "text"
          },
          {
            "key": "Broker",
            "type": "owner"
          },
          {
            "key": "Call_ID",
            "type": "id",
            "priority": "low"
          }
        ],
        "search": [
          "Caller_Name",
          "Phone",
          "Call_ID"
        ],
        "drawer": {
          "title_column": "Caller_Name",
          "sections": [
            {
              "type": "tiles",
              "columns": [
                "Started_At",
                "Duration_Sec",
                "Outcome",
                "Broker"
              ]
            },
            {
              "type": "callout",
              "column": "Transcript",
              "title": "Transcript",
              "tone": "neutral"
            },
            {
              "type": "fields",
              "columns": [
                "Recording_URL",
                "Lead_ID",
                "VAPI_Call_ID"
              ],
              "hide_empty": true
            }
          ]
        },
        "id": "calls-table"
      }
    ],
    "portal": "admin"
  },
  {
    "id": "brokers",
    "covers": [
      "R16",
      "R6"
    ],
    "route": "/brokers",
    "group": "Team",
    "label": "Brokers",
    "icon": "UserCog",
    "desc": "The brokers the AI agent assigns visits to, by specialty, with their visits and closures",
    "subtitle": "Who gets which visit — residential, commercial or plots — and how each is closing",
    "entity": "brokers",
    "blocks": [
      {
        "type": "charts",
        "charts": [
          {
            "id": "broker-visits",
            "type": "breakdown",
            "entity": "bookings",
            "title": "Visits by broker",
            "group": "Broker",
            "series": "Status",
            "series_order": [
              "Scheduled",
              "Visited",
              "Booked",
              "Cancelled"
            ]
          },
          {
            "id": "broker-revenue",
            "type": "breakdown",
            "entity": "bookings",
            "title": "Booked value by broker",
            "group": "Broker",
            "sum": "Deal_Value_INR",
            "where": "Status=Booked",
            "style": "bar"
          }
        ],
        "id": "brokers-charts"
      },
      {
        "type": "table",
        "views": [
          "cards",
          "table"
        ],
        "columns": [
          {
            "key": "Name",
            "type": "text",
            "sub": "Phone"
          },
          {
            "key": "Specialty",
            "type": "tag"
          },
          {
            "key": "Experience_Years",
            "header": "Years",
            "type": "number"
          },
          {
            "key": "Status",
            "type": "badge"
          },
          {
            "key": "Broker_ID",
            "type": "id",
            "priority": "low"
          }
        ],
        "card": {
          "title": "Name",
          "subtitle": [
            "Specialty"
          ],
          "badge": "Status",
          "fields": [
            {
              "key": "Phone",
              "label": "Phone",
              "icon": "Phone"
            },
            {
              "key": "Experience_Years",
              "label": "Years",
              "icon": "Award"
            }
          ],
          "actions": [
            "edit_broker"
          ]
        },
        "drawer": {
          "title_column": "Name",
          "sections": [
            {
              "type": "fields",
              "columns": [
                "Phone",
                "Email",
                "Specialty",
                "Experience_Years",
                "Joined_On"
              ]
            },
            {
              "type": "related",
              "entity": "bookings",
              "by": "Broker",
              "title": "Assignment log",
              "columns": [
                "Client_Name",
                "Property_Name",
                "Visit_At",
                "Status",
                "Commission_INR"
              ]
            }
          ]
        },
        "search": [
          "Name",
          "Phone"
        ],
        "actions": {
          "header": [
            "add_broker"
          ],
          "row": [
            "edit_broker"
          ]
        },
        "id": "brokers-table"
      }
    ],
    "modals": [
      {
        "id": "add_broker",
        "kind": "create",
        "title": "Add broker",
        "direct": "insert",
        "submit": "Add broker",
        "success": "Broker added — create their sign-in in Users & roles",
        "context": {
          "Status": "Active"
        },
        "fields": [
          {
            "key": "Name",
            "label": "Name",
            "type": "text",
            "required": true,
            "help": "Must match the person's name in Users & roles so they see their own visits"
          },
          {
            "key": "Phone",
            "label": "Mobile",
            "type": "text",
            "required": true
          },
          {
            "key": "Email",
            "label": "Email",
            "type": "text"
          },
          {
            "key": "Specialty",
            "label": "Specialty",
            "type": "select",
            "options": [
              "Residential",
              "Commercial",
              "Plots"
            ],
            "required": true
          },
          {
            "key": "Experience_Years",
            "label": "Years of experience",
            "type": "number"
          }
        ]
      },
      {
        "id": "edit_broker",
        "kind": "edit",
        "title": "Edit broker",
        "direct": "patch",
        "summary": [
          "Name",
          "Specialty"
        ],
        "submit": "Save",
        "fields": [
          {
            "key": "Phone",
            "label": "Mobile",
            "type": "text"
          },
          {
            "key": "Specialty",
            "label": "Specialty",
            "type": "select",
            "options": [
              "Residential",
              "Commercial",
              "Plots"
            ]
          },
          {
            "key": "Status",
            "label": "Status",
            "type": "select",
            "options": [
              "Active",
              "Inactive"
            ]
          }
        ]
      }
    ],
    "portal": "admin"
  },
  {
    "id": "ai_agents",
    "covers": [
      "R17"
    ],
    "route": "/ai-agents",
    "label": "AI agents",
    "icon": "Bot",
    "group": "Automation",
    "desc": "The WhatsApp agent, the voice agent and the follow-up scheduler — recent runs and failures",
    "subtitle": "What the three agents did, and every run that failed",
    "entity": "agent_runs",
    "read_only": "Runs are written by the agents themselves; a failure is fixed in Studio or Settings, not here",
    "blocks": [
      {
        "type": "kpis",
        "kpis": [
          {
            "metric": "failed_runs",
            "entity": "agent_runs",
            "label": "Failed runs",
            "tone": "bad",
            "icon": "AlertTriangle",
            "formula": "count where Status=Failed",
            "filter": "Status=Failed",
            "alert": true
          },
          {
            "label": "Runs this week",
            "formula": "count where At in last 7 days",
            "icon": "Activity",
            "entity": "agent_runs"
          },
          {
            "label": "Follow-up runs",
            "formula": "count where Flow=FOLLOWUP_RUN",
            "icon": "BellRing",
            "entity": "agent_runs"
          }
        ],
        "id": "ai_agents-kpis"
      },
      {
        "type": "table",
        "segments": {
          "column": "Status",
          "all": "All runs"
        },
        "period": {
          "column": "At",
          "presets": [
            "today",
            "7d",
            "30d",
            "all"
          ],
          "default": "7d"
        },
        "columns": [
          {
            "key": "Flow",
            "type": "tag"
          },
          {
            "key": "At",
            "type": "date",
            "time": true
          },
          {
            "key": "Trigger",
            "type": "text"
          },
          {
            "key": "Status",
            "type": "badge"
          },
          {
            "key": "Detail",
            "type": "truncate"
          },
          {
            "key": "Lead_ID",
            "type": "id",
            "priority": "low"
          }
        ],
        "filters": [
          "Flow"
        ],
        "id": "ai_agents-table"
      }
    ],
    "portal": "admin"
  },
  {
    "id": "agent_settings",
    "covers": [
      "R19"
    ],
    "route": "/agent-settings",
    "label": "Agent settings",
    "icon": "SlidersHorizontal",
    "group": "Automation",
    "desc": "The agent's name and language, follow-up timing and company details",
    "subtitle": "Changes reach the agents on their next run",
    "entity": "agent_settings",
    "blocks": [
      {
        "type": "table",
        "columns": [
          {
            "key": "Key",
            "header": "Setting",
            "type": "text",
            "sub": "Note"
          },
          {
            "key": "Value",
            "type": "text"
          }
        ],
        "actions": {
          "header": [],
          "row": [
            "edit_setting"
          ]
        },
        "id": "agent_settings-table"
      }
    ],
    "modals": [
      {
        "id": "edit_setting",
        "kind": "edit",
        "title": "Change setting",
        "direct": "patch",
        "summary": [
          "Key",
          "Note"
        ],
        "submit": "Save",
        "fields": [
          {
            "key": "Value",
            "label": "Value",
            "type": "text",
            "required": true
          }
        ]
      }
    ],
    "portal": "admin"
  },
  {
    "id": "my_visits",
    "covers": [
      "R18"
    ],
    "route": "/my-visits",
    "label": "My site visits",
    "icon": "CalendarCheck",
    "desc": "The visits assigned to me — call the client and record the outcome",
    "subtitle": "Your visits, today first",
    "entity": "bookings",
    "blocks": [
      {
        "type": "queue",
        "title": "Your site visits",
        "empty": "No visits assigned to you yet — the office or the AI agent books them, and they appear here.",
        "entity": "bookings",
        "where": "Broker={{user}}",
        "log": "my_visit_outcome",
        "row_actions": [
          "my_visit_outcome"
        ],
        "groups": [
          {
            "metric": "visits_today",
            "action": "my_visit_outcome",
            "action_label": "Visit outcome",
            "entity": "bookings",
            "label": "Visits today",
            "tone": "warn",
            "icon": "CalendarClock",
            "where": "Visit_At=today and Status=Scheduled"
          },
          {
            "label": "Coming up",
            "entity": "bookings",
            "where": "Broker={{user}} and Status=Scheduled and Visit_At>today",
            "action": "my_visit_outcome",
            "action_label": "Visit outcome"
          },
          {
            "label": "Visited — not closed",
            "entity": "bookings",
            "where": "Broker={{user}} and Status=Visited",
            "action": "my_visit_outcome",
            "action_label": "Visit outcome"
          }
        ],
        "id": "my_visits-queue"
      }
    ],
    "actions": {
      "header": [],
      "row": [
        "my_visit_outcome"
      ]
    },
    "modals": [
      {
        "id": "my_visit_outcome",
        "kind": "status",
        "title": "Visit outcome",
        "direct": "patch",
        "summary": [
          "Client_Name",
          "Property_Name"
        ],
        "submit": "Save outcome",
        "primary": true,
        "fields": [
          {
            "key": "Status",
            "label": "Outcome",
            "type": "select",
            "options": [
              "Visited",
              "Booked",
              "Cancelled"
            ],
            "required": true
          },
          {
            "key": "Deal_Value_INR",
            "label": "Deal value (₹)",
            "type": "number",
            "show_when": "Status=Booked",
            "required_when": "Status=Booked"
          },
          {
            "key": "Cancel_Reason",
            "label": "Reason",
            "type": "textarea",
            "rows": 2,
            "show_when": "Status=Cancelled",
            "required_when": "Status=Cancelled"
          },
          {
            "key": "Notes",
            "label": "Notes",
            "type": "textarea",
            "rows": 2
          }
        ]
      }
    ],
    "portal": "admin"
  },
  {
    "id": "my_leads",
    "covers": [
      "R18"
    ],
    "route": "/my-leads",
    "label": "My leads",
    "icon": "Users",
    "desc": "Leads assigned to me, with the full conversation",
    "subtitle": "Your leads and what each client said to the AI agent",
    "entity": "leads",
    "read_only": "A broker reads their leads and the conversation; stage and assignment are the office's",
    "blocks": [
      {
        "type": "table",
        "where": "Broker={{user}}",
        "segments": {
          "column": "Stage",
          "all": "All my leads"
        },
        "columns": [
          {
            "key": "Name",
            "type": "text",
            "sub": "Phone"
          },
          {
            "key": "Stage",
            "type": "badge"
          },
          {
            "key": "Next_Followup_At",
            "header": "Follow-up",
            "type": "due"
          },
          {
            "key": "Budget_Max_INR",
            "header": "Budget up to",
            "type": "money"
          },
          {
            "key": "Area_Pref",
            "header": "Area",
            "type": "tag"
          },
          {
            "key": "Property_Interest",
            "header": "Interested in",
            "type": "truncate"
          }
        ],
        "search": [
          "Name",
          "Phone"
        ],
        "drawer": {
          "title_column": "Name",
          "tabs": [
            {
              "label": "Lead",
              "sections": [
                {
                  "type": "tiles",
                  "title": "Requirement",
                  "columns": [
                    "Purpose",
                    "Property_Type",
                    "BHK",
                    "Area_Pref",
                    "Budget_Min_INR",
                    "Budget_Max_INR"
                  ]
                },
                {
                  "type": "callout",
                  "column": "Summary",
                  "title": "What the AI agent understood",
                  "tone": "neutral"
                }
              ]
            },
            {
              "label": "Conversation",
              "sections": [
                {
                  "type": "timeline",
                  "entity": "messages",
                  "by": "Lead_ID",
                  "date": "At",
                  "actor": "Sender",
                  "body": "Text",
                  "limit": 20
                }
              ]
            }
          ]
        },
        "id": "my_leads-table"
      }
    ],
    "portal": "admin"
  },
  {
    "id": "my_followups",
    "covers": [
      "R18"
    ],
    "route": "/my-follow-ups",
    "label": "My follow-ups",
    "icon": "BellRing",
    "desc": "My clients who asked to be contacted later",
    "subtitle": "Your clients the agent is nudging",
    "entity": "followups",
    "read_only": "The agent sends the nudges; a broker sees who is waiting",
    "blocks": [
      {
        "type": "table",
        "where": "Broker={{user}}",
        "segments": {
          "column": "Status",
          "all": "All"
        },
        "columns": [
          {
            "key": "Lead_Name",
            "header": "Client",
            "type": "text",
            "sub": "Phone"
          },
          {
            "key": "Reason",
            "type": "tag"
          },
          {
            "key": "Next_Due_At",
            "header": "Next nudge",
            "type": "due"
          },
          {
            "key": "Count",
            "header": "Sent",
            "type": "number"
          },
          {
            "key": "Status",
            "type": "badge"
          }
        ],
        "id": "my_followups-table"
      }
    ],
    "portal": "admin"
  },
  {
    "id": "settings",
    "kind": "settings",
    "route": "/settings",
    "label": "Settings",
    "icon": "Settings",
    "desc": "Profile and password",
    "portal": "admin"
  },
  {
    "id": "users",
    "kind": "users",
    "route": "/users",
    "label": "Users & roles",
    "icon": "Users",
    "group": "Setup",
    "desc": "Everyone who can sign in, and what each role may open",
    "subtitle": "Add people, reset passwords, change roles",
    "portal": "admin",
    "kernel": true
  }
];
