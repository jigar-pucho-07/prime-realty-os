# 05 — Data schema · Prime Realty OS
PostgreSQL, one table per entity (`app/db/schema.sql`, idempotent — apply, then apply again). Column names are the declared names in lower case; the kernel reads every value as a string. The app writes through its DAL; a flow writes through `/api/data/<entity>` with `INBOUND_TOKEN`; Studio reads with `studio_reader` (SELECT on these tables only).

## leads
| column | type |
|---|---|
| Lead_ID | text |
| Created_At | timestamptz |
| Name | text |
| Phone | text |
| Source | text |
| Stage | text |
| Purpose | text |
| Property_Type | text |
| BHK | text |
| Area_Pref | text |
| Budget_Min_INR | numeric |
| Budget_Max_INR | numeric |
| Property_Interest | text |
| Broker | text |
| AI_Mode | text |
| Lang | text |
| Last_Message | text |
| Last_Message_At | timestamptz |
| Next_Followup_At | timestamptz |
| Followup_Reason | text |
| Lost_Reason | text |
| Summary | text |
| History | text |
| Booking_Amount_INR | numeric |
| Booking_Date | date |
| Lost_Notes | text |

id: Lead_ID (LD-…) · status: Stage ['New', 'Engaged', 'Visit Scheduled', 'Booked', 'Lost']

## properties
| column | type |
|---|---|
| Property_ID | text |
| Created_At | timestamptz |
| Name | text |
| Type | text |
| Config | text |
| Area_Name | text |
| City | text |
| Price_Min_INR | numeric |
| Price_Max_INR | numeric |
| Size | numeric |
| Size_Unit | text |
| Floor | text |
| Parking | text |
| Possession | text |
| Status | text |
| Tags | text |
| Client_Name | text |
| Broker | text |
| Offered_Price_INR | numeric |
| Expected_Price_INR | numeric |
| Negotiation_Notes | text |
| Booking_Amount_INR | numeric |
| Final_Price_INR | numeric |
| Commission_INR | numeric |
| Payment_Mode | text |
| Payment_Status | text |
| Amount_Received_INR | numeric |

id: Property_ID (PR-…) · status: Status ['Available', 'Under Negotiation', 'Booked', 'Sold']

## brokers
| column | type |
|---|---|
| Broker_ID | text |
| Name | text |
| Phone | text |
| Email | text |
| Specialty | text |
| Area | text |
| Experience_Years | numeric |
| Status | text |
| Joined_On | text |

id: Broker_ID (BR-…) · status: Status ['Active', 'Inactive']

## bookings
| column | type |
|---|---|
| Booking_ID | text |
| Created_At | timestamptz |
| Lead_ID | text |
| Client_Name | text |
| Client_Phone | text |
| Property_Name | text |
| Broker | text |
| Visit_At | timestamptz |
| Budget_INR | numeric |
| Source | text |
| Created_By | text |
| Status | text |
| Deal_Value_INR | numeric |
| Commission_INR | numeric |
| Cancel_Reason | text |
| Notes | text |

id: Booking_ID (BK-…) · status: Status ['Scheduled', 'Visited', 'Booked', 'Cancelled']

## messages
| column | type |
|---|---|
| Message_ID | text |
| At | timestamptz |
| Lead_ID | text |
| Lead_Name | text |
| Phone | text |
| Broker | text |
| Channel | text |
| Direction | text |
| Sender | text |
| Text | text |
| Intent | text |
| WA_Message_ID | text |

id: Message_ID (MSG-…) · status: — 

## followups
| column | type |
|---|---|
| Followup_ID | text |
| Created_At | timestamptz |
| Lead_ID | text |
| Lead_Name | text |
| Phone | text |
| Broker | text |
| Reason | text |
| Property_Interest | text |
| Count | numeric |
| Max_Count | numeric |
| Next_Due_At | timestamptz |
| Last_Sent_At | timestamptz |
| Status | text |

id: Followup_ID (FU-…) · status: Status ['Pending', 'Replied', 'Completed', 'Stopped']

## calls
| column | type |
|---|---|
| Call_ID | text |
| Started_At | timestamptz |
| Lead_ID | text |
| Caller_Name | text |
| Phone | text |
| Broker | text |
| VAPI_Call_ID | text |
| Duration_Sec | numeric |
| Outcome | text |
| Property_Interest | text |
| Transcript | text |
| Recording_URL | text |

id: Call_ID (CALL-…) · status: Outcome ['Booking', 'Follow-up', 'Not interested', 'Info only']

## agent_runs
| column | type |
|---|---|
| Run_ID | text |
| At | timestamptz |
| Flow | text |
| Trigger | text |
| Lead_ID | text |
| Status | text |
| Duration_Ms | numeric |
| Detail | text |

id: Run_ID (RUN-…) · status: Status ['OK', 'Failed', 'Skipped']

## agent_settings
| column | type |
|---|---|
| Key | text |
| Value | text |
| Note | text |

id: Key (…) · status: — 

## audit_log
| column | type |
|---|---|
| Audit_ID | text |
| At | timestamptz |
| Who | text |
| Flow | text |
| Action | text |
| Entity | text |
| Record_ID | text |
| Summary | text |

id: Audit_ID (AUD-…) · status: — 
