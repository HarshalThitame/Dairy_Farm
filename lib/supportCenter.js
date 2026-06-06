import { sendDirectPushToUser } from "@/lib/notificationCenter";
import { getRequestIp, parseDevice } from "@/lib/userSettings";

export const SUPPORT_BUCKET = "support-attachments";
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const ticketCategories = [
  { id: "bug_report", label: "त्रुटी नोंदवा" },
  { id: "feature_request", label: "नवीन सुविधा" },
  { id: "account_issue", label: "खाते समस्या" },
  { id: "payment_issue", label: "Payment समस्या" },
  { id: "subscription_issue", label: "Subscription समस्या" },
  { id: "data_issue", label: "डेटा समस्या" },
  { id: "ai_assistant_issue", label: "AI सहाय्यक समस्या" },
  { id: "ocr_issue", label: "Slip/OCR समस्या" },
  { id: "technical_support", label: "तांत्रिक मदत" },
  { id: "other", label: "इतर" }
];

export const ticketCategoryLabelsMr = {
  bug_report: "त्रुटी नोंदवा",
  feature_request: "नवीन सुविधा",
  account_issue: "खाते समस्या",
  payment_issue: "Payment समस्या",
  subscription_issue: "Subscription समस्या",
  data_issue: "डेटा समस्या",
  ai_assistant_issue: "AI सहाय्यक समस्या",
  ocr_issue: "Slip/OCR समस्या",
  technical_support: "तांत्रिक मदत",
  other: "इतर"
};

export const ticketPriorities = [
  { id: "low", label: "कमी" },
  { id: "medium", label: "मध्यम" },
  { id: "high", label: "जास्त" },
  { id: "critical", label: "तातडीचे" }
];

export const ticketStatuses = [
  { id: "open", label: "उघडे" },
  { id: "in_progress", label: "काम सुरू" },
  { id: "waiting_for_user", label: "तुमचे उत्तर बाकी" },
  { id: "resolved", label: "सोडवले" },
  { id: "closed", label: "बंद" },
  { id: "rejected", label: "नाकारले" }
];

export const faqCategories = [
  { id: "all", label: "सर्व" },
  { id: "getting_started", label: "सुरुवात" },
  { id: "milk_records", label: "दूध नोंदी" },
  { id: "slip_upload", label: "Slip Upload" },
  { id: "ai_assistant", label: "AI Assistant" },
  { id: "reports", label: "अहवाल" },
  { id: "subscription", label: "Subscription" },
  { id: "account", label: "खाते" },
  { id: "notifications", label: "सूचना" },
  { id: "settings", label: "Settings" },
  { id: "security", label: "सुरक्षा" }
];

export const tutorialCategories = [
  { id: "all", label: "सर्व" },
  { id: "getting_started", label: "सुरुवात" },
  { id: "milk_entry", label: "दूध नोंद" },
  { id: "reports", label: "अहवाल" },
  { id: "ai_assistant", label: "AI Assistant" },
  { id: "ocr_slip_upload", label: "Slip Upload" },
  { id: "settings", label: "Settings" },
  { id: "subscription", label: "Subscription" }
];

export const featureStatuses = [
  { id: "requested", label: "मागणी आली" },
  { id: "planned", label: "नियोजित" },
  { id: "under_development", label: "काम सुरू" },
  { id: "released", label: "उपलब्ध झाले" },
  { id: "rejected", label: "नाकारले" }
];

export const allowedAttachmentTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function allowedId(list, value, fallback) {
  const id = String(value || fallback);
  return list.some((item) => item.id === id) ? id : fallback;
}

export function cleanText(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

export function normalizeSearch(value) {
  return cleanText(value, 120).replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export function sanitizeTicketPayload(body = {}, request) {
  const userAgent = request?.headers?.get("user-agent") || "";
  const device = parseDevice(userAgent);
  const preferred = body.preferredContactMethod || body.preferred_contact_method;

  return {
    subject: cleanText(body.subject, 160),
    category: allowedId(ticketCategories, body.category, "technical_support"),
    priority: allowedId(ticketPriorities, body.priority, "medium"),
    description: cleanText(body.description, 5000),
    preferred_contact_method: ["app", "whatsapp", "phone", "email"].includes(preferred) ? preferred : "app",
    device_info: {
      ...device,
      browserUserAgent: userAgent,
      screenSize: cleanText(body.deviceInfo?.screenSize || body.screenSize, 80),
      appVersion: cleanText(body.deviceInfo?.appVersion || process.env.NEXT_PUBLIC_APP_VERSION || "web", 80),
      pwaVersion: cleanText(body.deviceInfo?.pwaVersion || process.env.NEXT_PUBLIC_PWA_VERSION || "web", 80),
      ...(body.deviceInfo || {})
    },
    metadata: {
      bugTitle: cleanText(body.bugTitle, 160),
      stepsToReproduce: cleanText(body.stepsToReproduce, 3000),
      expectedResult: cleanText(body.expectedResult, 1200),
      actualResult: cleanText(body.actualResult, 1200)
    }
  };
}

export function validateTicketPayload(payload) {
  if (!payload.subject || payload.subject.length < 4) {
    return "विषय किमान ४ अक्षरांचा असावा.";
  }
  if (!payload.description || payload.description.length < 10) {
    return "समस्येचे वर्णन किमान १० अक्षरांचे असावे.";
  }
  return "";
}

export function sanitizeFeaturePayload(body = {}) {
  return {
    title: cleanText(body.title, 160),
    description: cleanText(body.description, 3000),
    expected_benefit: cleanText(body.expectedBenefit || body.expected_benefit, 1200) || null
  };
}

export function validateFeaturePayload(payload) {
  if (!payload.title || payload.title.length < 4) return "Feature title भरा.";
  if (!payload.description || payload.description.length < 10) return "Feature चे वर्णन नीट भरा.";
  return "";
}

export function normalizeTicket(row = {}) {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    subject: row.subject,
    category: row.category,
    categoryLabel: ticketCategoryLabelsMr[row.category] || row.category,
    priority: row.priority,
    priorityLabel: ticketPriorities.find((item) => item.id === row.priority)?.label || row.priority,
    description: row.description,
    status: row.status,
    statusLabel: ticketStatuses.find((item) => item.id === row.status)?.label || row.status,
    preferredContactMethod: row.preferred_contact_method,
    assignedAdmin: row.super_admins || row.assigned_admin || null,
    deviceInfo: row.device_info || {},
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at
  };
}

export function normalizeMessage(row = {}) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderType: row.sender_type,
    message: row.message,
    user: row.users || null,
    admin: row.super_admins || null,
    createdAt: row.created_at
  };
}

export function normalizeAttachment(row = {}) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    messageId: row.message_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: Number(row.file_size || 0),
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    createdAt: row.created_at,
    signedUrl: row.signedUrl || null
  };
}

export function normalizeFaq(row = {}) {
  return {
    id: row.id,
    category: row.category,
    categoryLabel: faqCategories.find((item) => item.id === row.category)?.label || row.category,
    title: row.title,
    body: row.body,
    keywords: row.keywords || [],
    viewsCount: Number(row.views_count || 0),
    helpfulCount: Number(row.helpful_count || 0),
    notHelpfulCount: Number(row.not_helpful_count || 0),
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

export function normalizeTutorial(row = {}) {
  return {
    id: row.id,
    category: row.category,
    categoryLabel: tutorialCategories.find((item) => item.id === row.category)?.label || row.category,
    title: row.title,
    description: row.description,
    type: row.type,
    content: row.content,
    mediaUrl: row.media_url,
    steps: row.steps || [],
    viewsCount: Number(row.views_count || 0),
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

export function normalizeFeature(row = {}, userVoteIds = new Set()) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    expectedBenefit: row.expected_benefit,
    status: row.status,
    statusLabel: featureStatuses.find((item) => item.id === row.status)?.label || row.status,
    votesCount: Number(row.votes_count || 0),
    hasVoted: userVoteIds.has(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function logSupportAudit(supabase, request, auth, action, details = {}, ticketId = null) {
  try {
    await supabase.from("support_audit_logs").insert({
      farm_id: auth?.farmId || null,
      user_id: auth?.userId || null,
      ticket_id: ticketId,
      action,
      details,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent") || ""
    });
  } catch {
    // Audit logging must not block user support flows.
  }
}

export async function createSupportNotification(supabase, auth, { title, message, url = "/support/tickets", priority = "normal" }) {
  if (!auth?.userId || !auth?.farmId) return null;

  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        type: priority === "urgent" ? "critical" : "information",
        priority,
        target_audience: "specific_users",
        target_filter: { farmIds: [auth.farmId], userIds: [auth.userId] },
        channels: ["in_app", "push"],
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: 1,
        delivered_count: 1,
        action_text: "Ticket बघा",
        action_url: url
      })
      .select("id")
      .single();

    if (error || !notification?.id) return null;

    await supabase
      .from("notification_delivery_logs")
      .upsert({
        notification_id: notification.id,
        farm_id: auth.farmId,
        user_id: auth.userId,
        channel: "in_app",
        delivery_status: "delivered",
        delivered_at: new Date().toISOString(),
        metadata: { source: "support_center" }
      }, { onConflict: "notification_id,user_id,channel" });

    try {
      await sendDirectPushToUser(supabase, auth.userId, {
        id: notification.id,
        title,
        body: message,
        url,
        tag: `support:${notification.id}`
      });
    } catch {
      // Push may be disabled. In-app notification remains available.
    }

    return notification.id;
  } catch {
    return null;
  }
}

export async function getTicketForFarm(supabase, farmId, ticketId) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, super_admins(id, name, email)")
    .eq("id", ticketId)
    .eq("farm_id", farmId)
    .single();

  if (error || !data) {
    const notFound = new Error("Ticket सापडले नाही.");
    notFound.status = 404;
    throw notFound;
  }

  return data;
}

export async function signedAttachmentRows(supabase, rows = []) {
  const signed = [];
  for (const row of rows) {
    let signedUrl = null;
    try {
      const { data } = await supabase.storage
        .from(row.storage_bucket || SUPPORT_BUCKET)
        .createSignedUrl(row.storage_path, 60 * 10, { download: row.file_name });
      signedUrl = data?.signedUrl || null;
    } catch {
      signedUrl = null;
    }
    signed.push({ ...row, signedUrl });
  }
  return signed;
}

export async function loadTicketBundle(supabase, farmId, ticketId) {
  const ticket = await getTicketForFarm(supabase, farmId, ticketId);
  const [messagesResult, attachmentsResult, ratingResult] = await Promise.all([
    supabase
      .from("ticket_messages")
      .select("*, users(id, name), super_admins(id, name)")
      .eq("ticket_id", ticketId)
      .eq("farm_id", farmId)
      .order("created_at", { ascending: true }),
    supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false }),
    supabase
      .from("support_ratings")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("farm_id", farmId)
      .maybeSingle()
  ]);

  if (messagesResult.error) throw messagesResult.error;
  if (attachmentsResult.error) throw attachmentsResult.error;
  if (ratingResult.error) throw ratingResult.error;

  const attachments = await signedAttachmentRows(supabase, attachmentsResult.data || []);
  return {
    ticket: normalizeTicket(ticket),
    messages: (messagesResult.data || []).map(normalizeMessage),
    attachments: attachments.map(normalizeAttachment),
    rating: ratingResult.data || null
  };
}

export function ticketSummaryStats(rows = []) {
  return {
    total: rows.length,
    open: rows.filter((ticket) => ["open", "in_progress", "waiting_for_user"].includes(ticket.status)).length,
    resolved: rows.filter((ticket) => ["resolved", "closed"].includes(ticket.status)).length,
    critical: rows.filter((ticket) => ticket.priority === "critical").length
  };
}

export function validateAttachment(file) {
  if (!file) return "File निवडा.";
  if (!allowedAttachmentTypes.includes(file.type)) return "फक्त JPG, PNG, PDF किंवा DOCX file upload करा.";
  if (file.size > MAX_ATTACHMENT_SIZE) return "File size १० MB पेक्षा कमी असावी.";
  return "";
}
