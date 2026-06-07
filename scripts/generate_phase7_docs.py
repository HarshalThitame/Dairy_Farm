from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import re

OUT = Path("docs/technical/phase7")
OUT.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"

RAW = r"""
users|Application user profile synchronized with Supabase Auth identity.|One user can own farms, belong to farms, create records, receive notifications and use AI/support.|Retain while active; anonymize after deletion; audit references retained.|id UUID N auth.users.id PK/FK; email TEXT Y NULL unique when present; phone TEXT Y NULL unique when present; full_name TEXT N '' display name; default_language TEXT N mr check mr/en; role TEXT N farmer platform role; status TEXT N active active/invited/suspended/deleted; profile_photo_path TEXT Y NULL storage path; last_login_at TIMESTAMPTZ Y NULL last login; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
farms|Tenant root entity for multi-tenant data ownership.|Farm has members, animals, records, reminders, expenses, settlements, notifications, support tickets and audit logs.|Retain while subscription/account exists; protected cascade after backup/export.|id UUID N gen_random_uuid() PK; farm_code TEXT N generated unique public code; name TEXT N '' farm name; owner_user_id UUID N current user FK users; village TEXT Y NULL village; taluka TEXT Y NULL taluka; district TEXT Y NULL district; state TEXT N Maharashtra state; country TEXT N India country; timezone TEXT N Asia/Kolkata timezone; status TEXT N trial trial/active/inactive/suspended/deleted; subscription_status TEXT N trial trial/active/expired/cancelled; plan_code TEXT Y NULL plan; trial_started_at TIMESTAMPTZ Y NULL trial start; trial_ends_at TIMESTAMPTZ Y NULL trial end; subscription_ends_at TIMESTAMPTZ Y NULL paid expiry; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
farm_members|Membership and role mapping between users and farms.|Many users can belong to many farms; role controls permissions.|Retain membership history; removed memberships archived.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; user_id UUID N none FK users; role TEXT N worker owner/farmer/worker/veterinarian/accountant/support_viewer; status TEXT N active active/invited/inactive/removed; permissions JSONB N {} fine-grained overrides; invited_by UUID Y NULL FK users; joined_at TIMESTAMPTZ Y NULL joined; last_active_at TIMESTAMPTZ Y NULL activity; created_at TIMESTAMPTZ N now() created
cows|Cow lifecycle master record.|Cow has milk, feed, health, vaccination, breeding, calving, reminder and calf records.|Retain lifetime history after sold/dead/archive unless farm deletion occurs.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; tag_number TEXT Y NULL farm tag; name TEXT N '' cow name; breed TEXT Y NULL breed; dob DATE Y NULL birth; purchase_date DATE Y NULL purchase; status TEXT N active active/pregnant/dry/calved/sold/dead/archived; reproductive_status TEXT N open open/inseminated/pregnant/calved/dry; lactation_number INTEGER N 0 lactation; profile_photo_path TEXT Y NULL image; notes TEXT Y NULL notes; created_by UUID Y NULL FK users; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
calves|Calf lifecycle master record.|Calf may link to mother cow and convert into cow record.|Retain after sold/converted for lineage and financial history.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; mother_cow_id UUID Y NULL FK cows; converted_cow_id UUID Y NULL FK cows; name TEXT N '' calf name; gender TEXT N unknown female/male/unknown; birth_date DATE N none birth; status TEXT N active active/sold/dead/converted/archived; dehorning_due_start DATE Y NULL 30-day window start; dehorning_due_end DATE Y NULL 45-day window end; weaning_due_date DATE Y NULL milk reduction due; photo_path TEXT Y NULL storage; sale_date DATE Y NULL sale; sale_amount NUMERIC(12,2) Y NULL sale income; notes TEXT Y NULL notes; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
milk_records|Daily farm-level or cow-level milk production record.|Belongs to farm and optionally cow, OCR upload and settlement item.|Retain for statutory/reporting period; soft-delete preferred with audit.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; cow_id UUID Y NULL FK cows; record_date DATE N none milk date; morning_liters NUMERIC(10,2) N 0 morning; evening_liters NUMERIC(10,2) N 0 evening; total_liters NUMERIC(10,2) N 0 total; fat_percent NUMERIC(5,2) Y NULL fat; snf_percent NUMERIC(5,2) Y NULL snf; clr_score NUMERIC(5,2) Y NULL clr; rate_per_liter NUMERIC(10,2) Y NULL rate; amount NUMERIC(12,2) Y NULL amount; milk_type TEXT N cow cow/buffalo; source TEXT N manual manual/daily_slip/settlement_item/import; source_record_id UUID Y NULL source; ocr_upload_id UUID Y NULL FK ocr_uploads; accounting_month TEXT N YYYY-MM month; created_by UUID Y NULL user; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated; deleted_at TIMESTAMPTZ Y NULL soft delete
feed_records|Feed and fodder usage/cost records.|Can link to cow/calf and optionally create expense entry.|Retain as financial source record; soft-delete with audit.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; cow_id UUID Y NULL FK cows; calf_id UUID Y NULL FK calves; record_date DATE N none date; feed_type TEXT N none type; quantity NUMERIC(12,3) Y NULL quantity; unit TEXT N kg unit; rate NUMERIC(12,2) Y NULL rate; amount NUMERIC(12,2) N 0 amount; supplier TEXT Y NULL supplier; source TEXT N manual manual/settlement/import; is_expense_accounted BOOLEAN N true expense flag; notes TEXT Y NULL notes; created_by UUID Y NULL FK users; created_at TIMESTAMPTZ N now() created
health_records|Animal health treatment and observation records.|Belongs to farm and one cow or calf; can create reminders and expenses.|Retain for animal lifetime plus operational/legal period.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; cow_id UUID Y NULL FK cows; calf_id UUID Y NULL FK calves; record_date DATE N none date; health_type TEXT N general type; diagnosis TEXT Y NULL diagnosis; symptoms TEXT Y NULL symptoms; treatment TEXT Y NULL treatment; medicine TEXT Y NULL medicine; veterinarian_name TEXT Y NULL vet; cost NUMERIC(12,2) N 0 cost; next_due_date DATE Y NULL follow-up; follow_up_required BOOLEAN N false flag; attachments JSONB N [] storage paths; created_by UUID Y NULL user; created_at TIMESTAMPTZ N now() created
vaccinations|Vaccination and deworming schedule/administration records.|Links to cow/calf, reminders and veterinarian.|Retain for animal lifetime and reporting history.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; cow_id UUID Y NULL FK cows; calf_id UUID Y NULL FK calves; vaccine_name TEXT N none name; vaccine_type TEXT N vaccination vaccination/deworming; administered_date DATE Y NULL completed; due_date DATE N none due; dose TEXT Y NULL dose; batch_no TEXT Y NULL batch; veterinarian_name TEXT Y NULL vet; status TEXT N scheduled scheduled/completed/missed/cancelled; cost NUMERIC(12,2) N 0 cost; reminder_id UUID Y NULL FK reminders; created_at TIMESTAMPTZ N now() created
breeding_records|AI/natural breeding lifecycle records.|Belongs to cow and creates pregnancy/dry-off/calving reminders.|Retain permanently for reproductive history.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; cow_id UUID N none FK cows; breeding_date DATE N none AI date; method TEXT N ai ai/natural; semen_or_bull TEXT Y NULL semen/bull; technician_name TEXT Y NULL technician; status TEXT N pending pending/pregnant/not_pregnant/superseded/calved; pregnancy_check_due_date DATE N breeding_date+60 due; pregnancy_check_date DATE Y NULL actual; pregnancy_result TEXT Y NULL positive/negative/unknown; superseded_by UUID Y NULL FK breeding_records; expected_calving_date DATE Y NULL expected; notes TEXT Y NULL notes; created_at TIMESTAMPTZ N now() created
calving_records|Cow delivery record and calf creation source.|Belongs to cow, may create calf and post-calving reminders.|Retain permanently for lineage and production analysis.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; cow_id UUID N none FK cows; calf_id UUID Y NULL FK calves; breeding_record_id UUID Y NULL FK breeding_records; calving_date DATE N none date; calving_type TEXT N normal normal/assisted/difficult/c_section; outcome TEXT N live live/stillborn/abortion; complications TEXT Y NULL complications; next_breeding_window_start DATE Y NULL calving+60; next_breeding_window_end DATE Y NULL calving+90; notes TEXT Y NULL notes; created_at TIMESTAMPTZ N now() created
reminders|Unified task/reminder engine.|May link to cow, calf and source records; notifications are generated from reminders.|Keep completed/cancelled history for at least two years.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; cow_id UUID Y NULL FK cows; calf_id UUID Y NULL FK calves; related_table TEXT Y NULL source table; related_record_id UUID Y NULL source id; type TEXT N custom type; title TEXT N none title; message TEXT N none message; reminder_date DATE N none due date; priority TEXT N normal low/normal/high/urgent; status TEXT N scheduled scheduled/active/snoozed/completed/cancelled/expired; snoozed_until DATE Y NULL snooze; completed_at TIMESTAMPTZ Y NULL done; completed_by UUID Y NULL FK users; action_url TEXT Y NULL link; metadata JSONB N {} metadata; created_at TIMESTAMPTZ N now() created
expenses|Unified farm expense ledger.|May link to feed records, settlements and users.|Financial records retained for audit/reporting; soft delete with audit.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; expense_date DATE N none date; accounting_month TEXT N YYYY-MM month; category TEXT N other feed/fodder/veterinary/medicine/labour/transport/utilities/equipment/other; subcategory TEXT Y NULL subcategory; amount NUMERIC(12,2) N 0 amount; payment_method TEXT Y NULL method; source TEXT N manual manual/feed_record/settlement/import; settlement_id UUID Y NULL FK settlements; feed_record_id UUID Y NULL FK feed_records; description TEXT Y NULL description; created_by UUID Y NULL user; created_at TIMESTAMPTZ N now() created; deleted_at TIMESTAMPTZ Y NULL soft delete
settlements|15-day dairy settlement/payment slip header and financial summary.|Has settlement_items, links OCR upload/extraction and generated feed expense.|Financial settlement records retained; deletion reverses derived data transactionally.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; dairy_name TEXT Y NULL center; member_code TEXT Y NULL code; period_start DATE N none start; period_end DATE N none end; settlement_date DATE N period_end date; morning_total_liters NUMERIC(12,2) Y NULL printed morning total; evening_total_liters NUMERIC(12,2) Y NULL printed evening total; total_liters NUMERIC(12,2) N 0 printed total; average_rate NUMERIC(10,2) Y NULL avg rate; total_income NUMERIC(14,2) N 0 milk income; feed_deduction NUMERIC(14,2) N 0 total deduction as feed; other_deduction NUMERIC(14,2) N 0 other deduction; round_adjustment NUMERIC(10,2) N 0 round; net_amount NUMERIC(14,2) N 0 final paid; source_upload_id UUID Y NULL FK ocr_uploads; validation_status TEXT N pending_review status; status TEXT N active active/deleted/corrected; raw_data JSONB N {} OCR data; created_by UUID Y NULL user; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated; deleted_at TIMESTAMPTZ Y NULL soft delete
settlement_items|Daily/session line items extracted from settlement slip.|Belongs to settlement and can match milk_records.|Retain with settlement; cascade on permanent settlement deletion.|id UUID N gen_random_uuid() PK; settlement_id UUID N none FK settlements; farm_id UUID N none FK farms; record_date DATE N none date; session TEXT N morning morning/evening; liters NUMERIC(10,2) Y NULL liters; fat_percent NUMERIC(5,2) Y NULL fat; snf_percent NUMERIC(5,2) Y NULL snf; rate_per_liter NUMERIC(10,2) Y NULL rate; amount NUMERIC(12,2) Y NULL amount; source TEXT N ocr ocr/manual/daily_slip_override; matched_milk_record_id UUID Y NULL FK milk_records; confidence NUMERIC(5,2) Y NULL confidence; status TEXT N reviewed reviewed/missing/overridden/rejected; created_at TIMESTAMPTZ N now() created
reports|Generated report jobs and files.|Belongs to farm/user; generated files stored in reports bucket.|Files expire by policy; metadata retained for audit/usage.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; user_id UUID N none FK users; report_type TEXT N none type; format TEXT N pdf pdf/xlsx/csv/json; date_start DATE Y NULL start; date_end DATE Y NULL end; filters JSONB N {} filters; status TEXT N queued queued/processing/completed/failed/expired; file_path TEXT Y NULL storage; error_message TEXT Y NULL error; generated_at TIMESTAMPTZ Y NULL generated; expires_at TIMESTAMPTZ Y NULL expiry; created_at TIMESTAMPTZ N now() created
goals|Farm/user production and quality goals.|Belongs to farm and optionally user; can generate notifications/achievements.|Retain historical goals for analytics.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; user_id UUID Y NULL FK users; goal_type TEXT N daily_milk type; target_value NUMERIC(14,2) N 0 target; unit TEXT N liter unit; period_start DATE N none start; period_end DATE N none end; progress_value NUMERIC(14,2) N 0 progress; status TEXT N in_progress in_progress/completed/missed/cancelled; reminder_enabled BOOLEAN N true flag; completed_at TIMESTAMPTZ Y NULL completed; created_at TIMESTAMPTZ N now() created
notifications|Notification master record for in-app/push/admin messages.|Has notification_logs and may link to farm/admin creator.|Retain metadata for analytics; content per communication policy.|id UUID N gen_random_uuid() PK; farm_id UUID Y NULL FK farms; title TEXT N none title; message TEXT N none body; type TEXT N information type; priority TEXT N normal priority; action_text TEXT Y NULL button; action_url TEXT Y NULL link; image_url TEXT Y NULL image; audience JSONB N {} audience; channels TEXT[] N {in_app} channels; created_by UUID Y NULL FK users; scheduled_at TIMESTAMPTZ Y NULL schedule; expires_at TIMESTAMPTZ Y NULL expiry; status TEXT N draft draft/scheduled/sent/cancelled/expired; created_at TIMESTAMPTZ N now() created
notification_logs|Per-user notification delivery/read/click audit.|Belongs to notification, user and farm.|Retain delivery logs for analytics; prune old success logs by policy.|id UUID N gen_random_uuid() PK; notification_id UUID N none FK notifications; farm_id UUID Y NULL FK farms; user_id UUID N none FK users; channel TEXT N in_app channel; delivery_status TEXT N pending pending/delivered/failed/opened/clicked/skipped; delivered_at TIMESTAMPTZ Y NULL delivered; read_at TIMESTAMPTZ Y NULL read; opened_at TIMESTAMPTZ Y NULL opened; clicked_at TIMESTAMPTZ Y NULL clicked; error_message TEXT Y NULL error; push_endpoint_hash TEXT Y NULL endpoint hash; created_at TIMESTAMPTZ N now() created
ai_chats|AI assistant conversation session.|Has many ai_messages and belongs to farm/user.|Default retention 12 months or user-configured deletion.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; user_id UUID N none FK users; title TEXT Y NULL title; language TEXT N mr mr/en; status TEXT N active active/archived/deleted; metadata JSONB N {} metadata; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
ai_messages|Individual AI chat messages and tool-call audit.|Belongs to ai_chats and farm/user.|Follows AI chat retention; cost/audit metadata retained as allowed.|id UUID N gen_random_uuid() PK; chat_id UUID N none FK ai_chats; farm_id UUID N none FK farms; user_id UUID Y NULL FK users; role TEXT N user user/assistant/tool/system; content TEXT N none content; tool_calls JSONB N [] calls; data_sources JSONB N [] sources; tokens_input INTEGER N 0 input tokens; tokens_output INTEGER N 0 output tokens; latency_ms INTEGER Y NULL latency; feedback TEXT Y NULL useful/not_useful; created_at TIMESTAMPTZ N now() created
ocr_uploads|Uploaded dairy slip image/file processing job.|Has OCR extractions and may link saved records.|Keep images for audit period; allow purge after export if policy permits.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; user_id UUID N none FK users; slip_type TEXT N unknown daily/settlement/unknown; image_path TEXT N none storage; original_filename TEXT Y NULL filename; mime_type TEXT N none mime; file_size_bytes BIGINT N 0 size; original_size_bytes BIGINT Y NULL original size; compression_ratio NUMERIC(5,2) Y NULL compression; status TEXT N uploaded uploaded/processing/extracted/reviewed/saved/failed/cancelled; error_message TEXT Y NULL error; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
ocr_extractions|OCR and AI extraction result/audit.|Belongs to OCR upload and farm; can link saved record.|Retain for debugging/audit period; redact sensitive fields by policy.|id UUID N gen_random_uuid() PK; upload_id UUID N none FK ocr_uploads; farm_id UUID N none FK farms; provider TEXT N google_vision provider; raw_text TEXT Y NULL OCR text; extracted_json JSONB N {} structured; confidence NUMERIC(5,2) N 0 confidence; warnings JSONB N [] warnings; validation_errors JSONB N [] errors; model_used TEXT Y NULL model; tokens_used INTEGER N 0 tokens; status TEXT N pending_review pending_review/accepted/rejected/corrected; reviewed_by UUID Y NULL FK users; reviewed_at TIMESTAMPTZ Y NULL reviewed; linked_record_table TEXT Y NULL table; linked_record_id UUID Y NULL row; created_at TIMESTAMPTZ N now() created
achievements|Achievement catalog and rules.|Referenced by progress and notifications.|Retain inactive definitions for historical earned achievements.|id UUID N gen_random_uuid() PK; code TEXT N none unique; title_mr TEXT N none Marathi title; title_en TEXT N none English title; description_mr TEXT N none Marathi desc; description_en TEXT N none English desc; category TEXT N milk category; target_type TEXT N count type; target_value NUMERIC(14,2) N 1 target; points INTEGER N 0 points; is_hidden BOOLEAN N false hidden; is_active BOOLEAN N true active; created_at TIMESTAMPTZ N now() created
leaderboard_entries|Materialized ranking rows.|Computed from milk, activity, OCR, AI and score data.|Retain monthly/annual snapshots; recalculate current period.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; leaderboard_type TEXT N dairy_score type; scope_type TEXT N platform platform/district/taluka; scope_value TEXT Y NULL value; period_start DATE N none start; period_end DATE N none end; score NUMERIC(14,2) N 0 score; rank INTEGER N 0 rank; metrics JSONB N {} metrics; calculated_at TIMESTAMPTZ N now() calculated
support_tickets|User support ticket master.|Has support_messages and attachments; can notify users/admins.|Retain support history for service quality and legal policy.|id UUID N gen_random_uuid() PK; farm_id UUID Y NULL FK farms; user_id UUID N none FK users; ticket_no TEXT N generated unique; subject TEXT N none subject; category TEXT N technical category; priority TEXT N medium low/medium/high/critical; status TEXT N open open/in_progress/waiting_for_user/resolved/closed/rejected; assigned_to UUID Y NULL FK users; description TEXT N none description; sla_due_at TIMESTAMPTZ Y NULL due; resolved_at TIMESTAMPTZ Y NULL resolved; closed_at TIMESTAMPTZ Y NULL closed; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
support_messages|Support ticket conversation messages.|Belongs to support_tickets and sender user.|Retain with ticket according to support retention policy.|id UUID N gen_random_uuid() PK; ticket_id UUID N none FK support_tickets; farm_id UUID Y NULL FK farms; sender_user_id UUID N none FK users; sender_role TEXT N user user/support/admin/system; message TEXT N none message; attachments JSONB N [] attachments; internal_only BOOLEAN N false internal; created_at TIMESTAMPTZ N now() created
backups|Farm export/backup jobs and files.|Belongs to farm/user; file stored in backups bucket.|Retain according to user schedule and storage policy.|id UUID N gen_random_uuid() PK; farm_id UUID N none FK farms; user_id UUID N none FK users; backup_type TEXT N full full/incremental; scope JSONB N {} scope; format TEXT N json json/zip/xlsx; file_path TEXT Y NULL storage; status TEXT N queued queued/processing/completed/failed/restoring/restored/expired; size_bytes BIGINT N 0 size; record_count INTEGER N 0 count; checksum TEXT Y NULL sha256; error_message TEXT Y NULL error; expires_at TIMESTAMPTZ Y NULL expiry; restored_at TIMESTAMPTZ Y NULL restored; created_at TIMESTAMPTZ N now() created
audit_logs|Immutable audit and security event ledger.|Belongs to farm/user where applicable and references changed entity.|Retain minimum 3 years or per compliance policy; append-only.|id UUID N gen_random_uuid() PK; farm_id UUID Y NULL FK farms; user_id UUID Y NULL FK users; actor_role TEXT Y NULL role; event_type TEXT N data_change type; entity_table TEXT Y NULL table; entity_id UUID Y NULL row; action TEXT N none action; old_values JSONB Y NULL before; new_values JSONB Y NULL after; ip_address INET Y NULL ip; device_id TEXT Y NULL device; severity TEXT N info info/warning/high/critical; created_at TIMESTAMPTZ N now() event
settings|Generic user/farm settings registry.|Belongs to farm and/or user. User settings override farm defaults.|Retain latest settings; audit changes in audit_logs.|id UUID N gen_random_uuid() PK; farm_id UUID Y NULL FK farms; user_id UUID Y NULL FK users; category TEXT N general category; setting_key TEXT N none key; setting_value JSONB N {} value; updated_by UUID Y NULL FK users; created_at TIMESTAMPTZ N now() created; updated_at TIMESTAMPTZ N now() updated
"""

RELATIONSHIPS = [
("users","farms","1:N","farms.owner_user_id","RESTRICT until farm transfer"),
("users","farm_members","1:N","farm_members.user_id","CASCADE membership"),
("farms","farm_members","1:N","farm_members.farm_id","CASCADE tenant membership"),
("farms","cows","1:N","cows.farm_id","CASCADE on farm deletion"),
("farms","calves","1:N","calves.farm_id","CASCADE on farm deletion"),
("cows","calves","1:N","calves.mother_cow_id","SET NULL for lineage history"),
("farms","milk_records","1:N","milk_records.farm_id","CASCADE on farm deletion; soft delete normally"),
("cows","milk_records","1:N","milk_records.cow_id","SET NULL to retain farm record"),
("farms","settlements","1:N","settlements.farm_id","CASCADE on farm deletion"),
("settlements","settlement_items","1:N","settlement_items.settlement_id","CASCADE with settlement"),
("milk_records","settlement_items","1:N","settlement_items.matched_milk_record_id","SET NULL"),
("farms","expenses","1:N","expenses.farm_id","CASCADE on farm deletion"),
("settlements","expenses","1:N","expenses.settlement_id","SET NULL; soft-delete source preferred"),
("cows","breeding_records","1:N","breeding_records.cow_id","CASCADE animal lifecycle"),
("cows","calving_records","1:N","calving_records.cow_id","CASCADE animal lifecycle"),
("calving_records","calves","1:1 optional","calving_records.calf_id","SET NULL"),
("farms","reminders","1:N","reminders.farm_id","CASCADE tenant reminders"),
("cows","reminders","1:N","reminders.cow_id","SET NULL historical reminder"),
("calves","reminders","1:N","reminders.calf_id","SET NULL historical reminder"),
("users","goals","1:N","goals.user_id","CASCADE user goals"),
("farms","goals","1:N","goals.farm_id","CASCADE farm goals"),
("notifications","notification_logs","1:N","notification_logs.notification_id","CASCADE delivery logs"),
("users","notification_logs","1:N","notification_logs.user_id","CASCADE user logs"),
("ai_chats","ai_messages","1:N","ai_messages.chat_id","CASCADE chat messages"),
("ocr_uploads","ocr_extractions","1:N","ocr_extractions.upload_id","CASCADE extraction attempts"),
("support_tickets","support_messages","1:N","support_messages.ticket_id","CASCADE messages"),
("farms","backups","1:N","backups.farm_id","CASCADE backup metadata"),
("farms","audit_logs","1:N","audit_logs.farm_id","SET NULL after deletion/anonymization review"),
("farms","settings","1:N","settings.farm_id","CASCADE farm settings"),
("users","settings","1:N","settings.user_id","CASCADE user settings"),
]

BUCKETS = [
("profile-images","User avatars","5 MB","JPG, PNG, WEBP","Owner write; members read allowed avatars","Account lifetime"),
("cow-images","Cow photos","8 MB","JPG, PNG, WEBP","Farm animal editors write; farm members read","Animal lifetime"),
("calf-images","Calf photos","8 MB","JPG, PNG, WEBP","Farm animal editors write; farm members read","Animal lifetime"),
("health-documents","Health attachments","10 MB","JPG, PNG, WEBP, PDF","Health editors write; farm/vet read","Health record lifetime"),
("ocr-slips","Daily and settlement slips","12 MB","JPG, PNG, WEBP, PDF","Farm manager write/read through signed URLs","Audit retention period"),
("reports","Generated reports","50 MB","PDF, XLSX, CSV, JSON","Signed URL to authorized farm members","Configurable expiry"),
("backups","Farm backups","1 GB","ZIP, JSON, XLSX","Owner/admin only, signed URLs, no public access","Backup retention policy"),
("support-attachments","Ticket attachments","10 MB","JPG, PNG, PDF, DOCX","Ticket owner and support/admin read","Ticket retention period"),
]

def parse_entities():
    out = []
    for line in RAW.strip().splitlines():
        name, purpose, rel, retention, cols = line.split("|", 4)
        columns = []
        for c in cols.split(";"):
            parts = c.strip().split(" ", 4)
            if len(parts) < 5:
                continue
            columns.append(tuple(parts))
        out.append({"name": name, "purpose": purpose, "relationships": rel, "retention": retention, "columns": columns})
    return out

ENTITIES = parse_entities()

def table(headers, rows):
    def cell(x): return str(x).replace("\n", "<br>").replace("|", ";")
    s = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for r in rows:
        s.append("| " + " | ".join(cell(x) for x in r) + " |")
    return "\n".join(s) + "\n"

def entity_inventory():
    return table(["#","Entity","Purpose","Key Relationships","Retention"], [(i+1,e["name"],e["purpose"],e["relationships"],e["retention"]) for i,e in enumerate(ENTITIES)])

def relationship_matrix():
    return table(["Parent","Child","Cardinality","Foreign Key","Delete / Update Rule"], RELATIONSHIPS)

def constraints_for(e):
    n = e["name"]
    indexes = [f"idx_{n}_farm_date", f"idx_{n}_farm_status"] if any(c[0]=="farm_id" for c in e["columns"]) else [f"idx_{n}_created"]
    if n in {"milk_records","settlements","expenses","audit_logs","notification_logs","ai_messages","ocr_extractions"}:
        indexes.append(f"idx_{n}_farm_created_or_period")
    uniques = {
        "users": "email unique where not null; phone unique where not null",
        "farms": "farm_code unique",
        "farm_members": "unique farm_id plus user_id",
        "cows": "unique farm_id plus tag_number where tag_number is not null",
        "settlements": "unique farm_id plus period_start plus period_end where deleted_at is null",
        "settlement_items": "unique settlement_id plus record_date plus session",
        "notifications": "none",
        "notification_logs": "unique notification_id plus user_id plus channel",
        "achievements": "code unique",
        "leaderboard_entries": "unique leaderboard_type plus scope plus period plus farm_id",
        "support_tickets": "ticket_no unique",
        "settings": "unique farm/user category setting_key",
    }.get(n, "none")
    fks = [f"{c[0]} references related table" for c in e["columns"] if c[0].endswith("_id") or c[0] == "farm_id"]
    checks = ["non-negative numeric values", "status/type enum checks where applicable", "farm_id required for tenant-owned tables"]
    return indexes, uniques, fks, checks

def table_design(e):
    idx, uniq, fks, checks = constraints_for(e)
    return f"""### {e['name']}

**Description:** {e['purpose']}

**Relationships:** {e['relationships']}

**Retention:** {e['retention']}

**Columns**

{table(['Column','Type','Nullable','Default','Notes'], e['columns'])}
**Indexes**

{chr(10).join('- `' + x + '`' for x in idx)}

**Unique Constraints**

- {uniq}

**Foreign Keys**

{chr(10).join('- `' + x + '`' for x in fks) if fks else '- None'}

**Check Constraints**

{chr(10).join('- ' + x for x in checks)}
"""

def mermaid_erd():
    lines = ["```mermaid", "erDiagram"]
    for a,b,card,fk,rule in RELATIONSHIPS:
        rel = "||--o{" if card.startswith("1:N") else "||--||"
        lines.append(f'  {a.upper()} {rel} {b.upper()} : "{fk}"')
    for e in ENTITIES:
        lines.append(f"  {e['name'].upper()} {{")
        for col, typ, *_ in e["columns"][:8]:
            lines.append(f"    {typ.replace('(', '').replace(')', '').replace(',', '_')} {col}")
        lines.append("  }")
    lines.append("```")
    return "\n".join(lines)

def data_design_doc():
    body = f"""# Majhi Dairy Database Design Document

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy  
**Database Platform:** PostgreSQL on Supabase  
**Authentication:** Supabase Auth  
**Storage:** Supabase Storage  
**Languages:** Marathi and English  
**Target Scale:** 100,000+ users, 50,000+ farms, millions of milk records

## 1. Database Architecture Overview

Majhi Dairy uses a multi-tenant PostgreSQL database where `farms` is the primary tenant boundary. Supabase Auth owns credential identity in `auth.users`; application tables in `public` store farm operations, AI/OCR history, notifications, support, backups and audit logs.

### 1.1 Data Flow Diagram

```text
User -> Supabase Auth -> users profile -> farm_members role resolution
     -> farms tenant boundary -> cows/calves/records/accounting/reminders
     -> reports/goals/leaderboards/AI/OCR/notifications/audit logs
```

### 1.2 Data Ownership Model

- `auth.users.id` is the identity root.
- `public.users.id` mirrors the authenticated user.
- `farms.id` is the tenant root for operational data.
- `farm_members` controls access, roles and future multi-farm membership.
- Every farm-owned table contains `farm_id` for RLS, indexing and partitioning.
- Admin/support access must be explicit, audited and never dependent on client-side filtering.

### 1.3 Multi-Tenant Strategy

{table(['Topic','Decision'], [
('Tenant key','farm_id on every farm-owned table'),
('Membership','farm_members many-to-many user-farm table'),
('RLS','Enabled on all public tables with helper functions'),
('Admin access','Role-based policies plus audit logs'),
('Support access','Ticket-scoped and optionally farm-scoped read access'),
('Service role','Trusted server APIs, Edge Functions and scheduled jobs only'),
('Data isolation','All queries and policies filter by farm_id or ownership'),
])}
### 1.4 Scalability Considerations

- Partition high-volume tables by month or quarter: `milk_records`, `audit_logs`, `notification_logs`, `ai_messages`, `ocr_extractions`.
- Use composite indexes beginning with `farm_id` and date/status columns.
- Use materialized views for dashboard/report summaries.
- Use background jobs for OCR, reports, backups, leaderboards and reminders.

## 2. Entity Inventory

{entity_inventory()}

## 3. Table Design

The following is the target production schema. Existing project tables such as `dairy_settlements`, `dairy_slips`, `slip_uploads`, `ai_records`, `finance_records`, `monthly_expenses`, and `ai_assistant_logs` should be mapped through migrations or compatibility views.

"""
    for e in ENTITIES:
        body += table_design(e) + "\n"
    body += f"""## 4. Entity Relationships

{relationship_matrix()}

## 5. Reporting and Aggregation Design

{table(['View','Purpose','Refresh'], [
('mv_daily_farm_milk_summary','Daily morning/evening/total liters, amount, fat, SNF','On save or hourly'),
('mv_monthly_farm_milk_summary','Monthly production and income','On settlement save and nightly'),
('mv_monthly_financial_summary','Income, feed deduction, manual expenses, profit','On expense/settlement save'),
('mv_farm_health_snapshot','Farm health score components','Nightly and on admin request'),
('mv_leaderboard_current','Current ranking by scope and metric','Every 6 hours'),
])}
## 6. Performance Design

- All list queries must include `farm_id`, date range and pagination.
- Financial and milk reports should read from summary/materialized views where possible.
- OCR and AI logs should be partitioned or archived after the active analysis window.
- Export jobs should stream data in chunks instead of loading complete farm backups into memory.

## 7. Backup and Disaster Recovery Data Design

- `backups` stores metadata, checksum and restore status.
- Backup files are stored in the `backups` bucket with owner-only signed URLs.
- RPO target: 24 hours or better through Supabase managed backups.
- RTO target: 4 hours for database metadata, 24 hours for full file restore.

## 8. Migration Strategy

{table(['Current / Legacy Table','Target Table / Strategy'], [
('dairy_settlements','settlements; keep compatibility view during migration'),
('dairy_slips and slip_uploads','ocr_uploads, ocr_extractions, milk_records'),
('ai_records','breeding_records; keep view for old UI until migrated'),
('finance_records and monthly_expenses','expenses and monthly summary views'),
('ai_assistant_logs','ai_chats and ai_messages'),
('notification_delivery_logs','notification_logs'),
])}
## 9. Implementation Roadmap and Effort Estimate

{table(['Phase','Scope','Backend Deliverables','Estimate'], [
('1','Authentication','Supabase Auth, users, farm_members, RLS helpers','5-8 days'),
('2','Farm Management','farms, settings, membership workflows','4-6 days'),
('3','Cow/Calf Management','cows, calves, lifecycle triggers','7-10 days'),
('4','Milk Records','milk_records, summaries, duplicate rules','8-12 days'),
('5','Accounting','settlements, expenses, financial summaries','10-14 days'),
('6','AI and OCR','ocr_uploads, ocr_extractions, ai_chats/messages','10-15 days'),
('7','Reports','reports, export jobs, materialized views','7-10 days'),
('8','Admin','admin analytics, support, notifications, audit','10-15 days'),
])}
## 10. Acceptance Checklist

- All farm-owned tables have `farm_id` and RLS enabled.
- All high-volume tables have composite farm/date indexes.
- Every financial table has non-negative amount checks.
- Every AI/OCR-generated financial record stores raw extraction/audit metadata.
- Settlement deletion reverses derived expense/report data in a transaction.
- Support/admin actions create audit logs.
"""
    return body

def erd_doc():
    return f"""# ERD Specification

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy

## 1. High-Level ERD

The Majhi Dairy domain model is centered on the `farms` tenant. Users authenticate through Supabase Auth, join farms through `farm_members`, and then create records against farm-owned entities.

{mermaid_erd()}

## 2. Logical ERD by Domain

### Identity and Tenant Domain
- `auth.users` to `users` is one-to-one.
- `users` to `farm_members` to `farms` implements many-to-many membership.
- `farms.owner_user_id` identifies the primary owner, but access is governed by `farm_members`.

### Animal Lifecycle Domain
- `farms` has many `cows` and `calves`.
- `calves.mother_cow_id` tracks lineage.
- `breeding_records` and `calving_records` maintain reproductive lifecycle.
- `reminders` link to cows/calves and source records.

### Milk and Accounting Domain
- `milk_records` stores manual, OCR and settlement-derived production records.
- `settlements` stores authoritative 15-day payment slip summaries.
- `settlement_items` stores daily/session table rows from settlements.
- `expenses` stores manual expenses and settlement-derived feed deductions.

### AI, OCR and Reporting Domain
- `ocr_uploads` has many `ocr_extractions`.
- `ai_chats` has many `ai_messages`.
- `reports` and `backups` store generated file metadata.
- `audit_logs` records significant changes and sensitive operations.

## 3. Relationship Matrix

{relationship_matrix()}

## 4. Physical ERD Considerations

- Use UUID primary keys with `gen_random_uuid()`.
- Use `TIMESTAMPTZ` for timestamps and `DATE` for farm business dates.
- Use `NUMERIC` for financial and milk measurements.
- Denormalize `farm_id` into child tables like `settlement_items`, `ai_messages`, and `notification_logs` for RLS and index performance.
- Use partial unique indexes for active records where soft delete applies.
- Use JSONB only for metadata and AI/OCR payloads; core business fields remain typed columns.
"""

def supabase_doc():
    return f"""# Supabase Architecture Document

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy

## 1. Supabase Components

{table(['Component','Use in Majhi Dairy'], [
('Supabase Auth','Signup, login, password recovery, session management and JWT identity'),
('PostgreSQL','Primary relational database and tenant data store'),
('Row Level Security','Tenant isolation and role-based access'),
('Supabase Storage','Profile photos, animal photos, OCR slips, reports, backups and support attachments'),
('Realtime','Notification inbox updates, selected dashboard events and admin monitoring'),
('Edge Functions / Server APIs','OCR, AI, report export, backup/restore, push notifications'),
('Cron / Scheduled Jobs','Reminder generation, leaderboard refresh, backups and summary refresh'),
])}
## 2. Auth Architecture

- Supabase Auth stores credentials and identity.
- `public.users` is created/updated by signup trigger or onboarding API.
- New users select Marathi or English before entering the app; default is Marathi.
- Farm authorization is resolved through `farm_members`, not client state.

## 3. Storage Buckets

{table(['Bucket','Purpose','Max Size','Allowed Types','Access Rules','Retention'], BUCKETS)}

## 4. OCR Architecture

1. Client captures or selects native-camera image and compresses only if needed.
2. Client uploads to `ocr-slips` using signed URL.
3. Server creates `ocr_uploads` and processes OCR with provider key server-side.
4. AI structures OCR text into strict JSON.
5. Validation engine checks totals, formulae and impossible values.
6. User reviews and explicitly saves.
7. Save creates `milk_records` or `settlements`, `settlement_items`, `expenses` and audit rows.

## 5. AI Assistant Architecture

- AI never directly executes raw SQL.
- Server exposes typed read-only tools for farm analytics.
- AI permissions are checked against settings before tool execution.
- Tool results are stored in `ai_messages.data_sources`.

## 6. Notification Architecture

- `notifications` stores message content and schedule.
- `notification_logs` stores recipient delivery/read/click status.
- Push keys and fanout run only server-side.
- Sensitive financial details should not be included in push payload unless explicitly allowed.

## 7. Security and Secrets

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are client-safe.
- `SUPABASE_SERVICE_ROLE_KEY`, AI keys, OCR keys and push keys are server-only.
- Service role must never be bundled into browser code.
"""

def rls_doc():
    helper_sql = """```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_farm(target_farm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.farm_members fm
    JOIN public.users u ON u.id = fm.user_id
    WHERE fm.farm_id = target_farm_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'active'
      AND u.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_farm(target_farm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = target_farm_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner','farmer','accountant')
  );
$$;
```"""
    body = f"""# RLS Policy Specification

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy

## 1. Principles

- RLS must be enabled on every public table.
- Service role is used only in trusted server APIs/jobs.
- Every farm-owned table uses `farm_id` with helper functions.
- Admin and support access must be explicit and auditable.

## 2. Helper Functions

{helper_sql}

## 3. Policy Pattern

"""
    for e in ENTITIES:
        n = e["name"]
        if n == "users":
            body += f"""### {n}

```sql
ALTER TABLE public.{n} ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select_own_or_admin ON public.users FOR SELECT USING (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY users_update_own_or_admin ON public.users FOR UPDATE USING (id = auth.uid() OR public.is_platform_admin()) WITH CHECK (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY users_delete_super_admin ON public.users FOR DELETE USING (public.is_super_admin());
```

"""
        elif n == "farms":
            body += f"""### {n}

```sql
ALTER TABLE public.{n} ENABLE ROW LEVEL SECURITY;
CREATE POLICY farms_select_member ON public.farms FOR SELECT USING (public.can_access_farm(id));
CREATE POLICY farms_insert_owner ON public.farms FOR INSERT WITH CHECK (owner_user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY farms_update_owner ON public.farms FOR UPDATE USING (public.can_manage_farm(id)) WITH CHECK (public.can_manage_farm(id));
CREATE POLICY farms_delete_super_admin ON public.farms FOR DELETE USING (public.is_super_admin());
```

"""
        elif n == "achievements":
            body += f"""### {n}

```sql
ALTER TABLE public.{n} ENABLE ROW LEVEL SECURITY;
CREATE POLICY achievements_select_active ON public.achievements FOR SELECT USING (is_active = true OR public.is_platform_admin());
CREATE POLICY achievements_insert_admin ON public.achievements FOR INSERT WITH CHECK (public.is_platform_admin());
CREATE POLICY achievements_update_admin ON public.achievements FOR UPDATE USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY achievements_delete_super_admin ON public.achievements FOR DELETE USING (public.is_super_admin());
```

"""
        else:
            body += f"""### {n}

```sql
ALTER TABLE public.{n} ENABLE ROW LEVEL SECURITY;
CREATE POLICY {n}_select_farm_member ON public.{n} FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY {n}_insert_farm_manager ON public.{n} FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY {n}_update_farm_manager ON public.{n} FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY {n}_delete_owner_or_admin ON public.{n} FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

"""
    body += """## 4. Storage Policy Pattern

```sql
CREATE POLICY storage_ocr_slips_read
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ocr-slips'
  AND public.can_access_farm((split_part(name, '/', 1))::uuid)
);

CREATE POLICY storage_ocr_slips_write
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ocr-slips'
  AND public.can_manage_farm((split_part(name, '/', 1))::uuid)
);
```

## 5. Verification Checklist

- Cross-farm URL manipulation is blocked.
- Non-member insert/update/delete fails.
- Support cannot read unrelated farm data.
- Admin action reads/writes create audit logs.
- Storage object path access follows farm ownership.
"""
    return body

def backend_doc():
    return f"""# Backend Technical Design

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy

## 1. Backend Architecture

Majhi Dairy uses Supabase as the primary backend with Next.js server routes for trusted operations requiring secrets or service-role access. Browser code uses Supabase anon client for normal RLS-protected reads and writes.

## 2. Backend Service Boundaries

{table(['Service','Tables','Server Required','Notes'], [
('Auth/Profile','users, farm_members, settings','Partial','Signup trigger plus onboarding APIs'),
('Farm/Animals','farms, cows, calves','No for normal CRUD','RLS protected direct Supabase allowed'),
('Records/Reminders','milk_records, health_records, reminders','Partial','Server for lifecycle jobs and bulk imports'),
('Accounting','settlements, settlement_items, expenses','Yes','Financial save must be transactional and auditable'),
('OCR','ocr_uploads, ocr_extractions','Yes','Provider API keys never exposed'),
('AI Assistant','ai_chats, ai_messages','Yes','Function calling, data permissions, rate limiting'),
('Reports','reports','Yes','Async generation and storage signed URLs'),
('Notifications','notifications, notification_logs','Yes for push','Push keys and fanout server-only'),
('Support','support_tickets, support_messages','Partial','RLS plus admin assignment server-side'),
('Backup','backups','Yes','Service role and file generation'),
('Admin','all','Yes','Role checks and audit required'),
])}
## 3. API / RPC Catalog

{table(['Endpoint / Function','Method','Purpose','Security'], [
('/api/onboarding/language','POST','Save first-time language preference','Auth required; own profile/settings only'),
('/api/auth/pin/setup','POST','Set PIN hash if enabled','Re-auth required'),
('rpc.create_farm_for_user','RPC','Create farm and owner membership transaction','Auth required; SECURITY DEFINER with validation'),
('rpc.register_cow','RPC','Create cow and optional calved calf form','Farm manager'),
('rpc.record_calving_with_calf','RPC','Create calving, calf, cow status and reminders','Farm manager; transaction'),
('rpc.save_milk_record','RPC','Insert/update manual or daily-slip milk record','Farm manager'),
('rpc.save_settlement','RPC','Save reviewed 15-day settlement and derived feed expense','Farm manager; transaction'),
('rpc.delete_settlement','RPC','Soft delete settlement and reverse derived rows','Owner/admin; transaction'),
('/api/ocr/upload','POST','Create signed upload and job','Farm manager'),
('/api/ocr/process','POST','Run OCR, AI extraction and validation','Server-only service role'),
('/api/ocr/review-save','POST','Save user-confirmed extraction','Farm manager; never auto-save'),
('/api/ai/chat','POST','Function-calling dairy assistant','Auth, farm access, AI enabled'),
('/api/reports/generate','POST','Queue report generation','Report permission'),
('/api/backups/create','POST','Queue full/incremental backup','Owner/admin'),
('/api/notifications/send','POST','Admin broadcast or targeted notification','Admin/super admin'),
('/api/admin/farms/:id','GET','Farm monitoring dashboard','Admin/super admin; audit read'),
])}
## 4. Transaction Requirements

### Settlement Save

```text
BEGIN
  validate farm access and status
  insert/update settlements
  replace settlement_items for corrected settlement
  create/update derived feed expense using settlement period month
  link accepted OCR extraction if OCR-originated
  refresh or enqueue monthly summary
  write audit_logs
COMMIT
```

### Calving With Calf

```text
BEGIN
  create calving_records
  create calf if provided
  update cow status
  cancel completed lifecycle reminders
  create calf care and next breeding reminders
  write audit_logs
COMMIT
```

## 5. Validation Engine

{table(['Domain','Validation Rules'], [
('Milk','No negative liters; fat/SNF range; amount equals liters times rate within tolerance; duplicate policy enforced'),
('Settlement','Summary totals have priority; feed deduction equals slip total deduction; net amount formula validated'),
('OCR','Impossible values flagged; low confidence blocks direct save; torn rows stored as NULL'),
('Reminders','Sold/dead/archived animals do not receive future reminders; source duplicates blocked'),
('AI','Data permissions checked before tool execution; no raw SQL from model'),
('Backup','Checksum and schema version verified before restore'),
])}
## 6. Background Jobs

{table(['Job','Frequency','Purpose'], [
('Reminder activation','Daily/hourly','Move scheduled reminders to active and send notifications'),
('Slip due banner','Daily','Detect missing 1-15 and 16-end settlement uploads'),
('Materialized summary refresh','Hourly/nightly','Refresh dashboard/report aggregates'),
('Leaderboard refresh','Every 6 hours','Recalculate rankings'),
('Backup schedule','Daily','Create auto backups'),
('Notification retry','Every 15 minutes','Retry failed push notifications'),
('Audit archive','Monthly','Move old audit partitions to archive storage'),
])}
## 7. Performance Targets

{table(['Operation','Target'], [
('Home dashboard API','Under 500 ms from summary views'),
('Milk record save','Under 700 ms'),
('Settlement save after review','Under 2 seconds'),
('OCR processing','Show progress; target 10-30 seconds provider-dependent'),
('AI answer','Under 5 seconds for simple analytics'),
('Monthly report generation','Under 30 seconds; async for annual exports'),
])}
"""

def write_files():
    files = {
        "Majhi_Dairy_Database_Design.md": data_design_doc(),
        "ERD_Specification.md": erd_doc(),
        "Supabase_Architecture.md": supabase_doc(),
        "RLS_Policy_Specification.md": rls_doc(),
        "Backend_Technical_Design.md": backend_doc(),
    }
    for name, content in files.items():
        (OUT / name).write_text(content, encoding="utf-8")
    md_to_docx(files["Majhi_Dairy_Database_Design.md"], OUT / "Majhi_Dairy_Database_Design.docx")

def clean_inline(s):
    s = re.sub(r"\*\*(.*?)\*\*", r"\1", s.strip())
    s = re.sub(r"`([^`]*)`", r"\1", s)
    return s.replace("<br>", "; ")

def p_xml(text, style=None):
    text = clean_inline(text)
    if not text: return "<w:p/>"
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return f'<w:p>{ppr}<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'

def table_xml(rows):
    cols = max(len(r) for r in rows)
    body = ['<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr>']
    for r in rows:
        body.append("<w:tr>")
        for c in r + [""] * (cols - len(r)):
            body.append("<w:tc>" + p_xml(c) + "</w:tc>")
        body.append("</w:tr>")
    body.append("</w:tbl>")
    return "".join(body)

def md_to_docx(md, path):
    lines = md.splitlines(); body=[]; i=0; code=False; codebuf=[]
    while i < len(lines):
        s = lines[i].strip()
        if s.startswith("```"):
            if not code:
                code=True; codebuf=[]
            else:
                body.append(p_xml("\n".join(codebuf), "Code")); code=False
            i += 1; continue
        if code:
            codebuf.append(lines[i]); i += 1; continue
        if not s:
            i += 1; continue
        if s.startswith("|"):
            rows=[]
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells=[clean_inline(x) for x in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[-:\s]+", x or "") for x in cells):
                    rows.append(cells)
                i += 1
            body.append(table_xml(rows)); continue
        h = re.match(r"^(#{1,6})\s+(.*)$", s)
        if h:
            style = {1:"Heading1",2:"Heading2",3:"Heading3"}.get(min(len(h.group(1)),3), "Heading3")
            body.append(p_xml(h.group(2), style)); i += 1; continue
        if s.startswith("- "):
            body.append(p_xml("• " + s[2:])); i += 1; continue
        body.append(p_xml(s)); i += 1
    document=f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{"".join(body)}<w:sectPr/></w:body></w:document>'
    styles='''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style></w:styles>'''
    ct='''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'''
    rels='''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
    docrels='''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'''
    with ZipFile(path, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", ct); z.writestr("_rels/.rels", rels); z.writestr("word/document.xml", document); z.writestr("word/_rels/document.xml.rels", docrels); z.writestr("word/styles.xml", styles)

if __name__ == "__main__":
    write_files()
    for p in sorted(OUT.iterdir()):
        print(p.name, p.stat().st_size)
