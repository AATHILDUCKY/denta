import express from "express";
import path from "path";
import { prisma } from "./src/lib/prisma";
import { UserRole } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

function getPort() {
  const portArgIndex = process.argv.findIndex((arg) => arg === "-p" || arg === "--port");
  const cliPort = portArgIndex >= 0 ? process.argv[portArgIndex + 1] : "";
  const port = Number(process.env.PORT || cliPort || 3001);
  return Number.isFinite(port) && port > 0 ? port : 3001;
}

async function startServer() {
  const app = express();
  const PORT = getPort();
  const SESSION_COOKIE = "dentacare_auth";
  const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8;
  const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";
  const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || "");
  const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "");
  const SESSION_SECRET = String(process.env.SESSION_SECRET || "");
  const SMTP_HOST = String(process.env.SMTP_HOST || "");
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
  const SMTP_USER = String(process.env.SMTP_USER || "");
  const SMTP_PASS = String(process.env.SMTP_PASS || "");
  const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || "no-reply@dentacare.pro");

  app.use(express.json());
  app.disable("x-powered-by");

  interface AuthUser {
    uid: string;
    email: string;
    displayName: string;
    role: "admin" | "staff";
    createdAt: string;
  }

  type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
  interface AppointmentPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nic?: string;
    age?: number;
    gender?: string;
    treatmentType: string;
    date: string;
    time: string;
    notes?: string;
    status?: AppointmentStatus;
    durationMins?: number;
  }

  const allowedStatuses: AppointmentStatus[] = ["pending", "confirmed", "cancelled", "completed"];
  const canSendEmail = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
  const mailer = canSendEmail
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })
    : null;

  function escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createAppointmentEmailTemplate(input: {
    heading: string;
    intro: string;
    firstName: string;
    lastName: string;
    date: string;
    time: string;
    treatmentType: string;
    durationMins: number;
    phone: string;
    notes?: string;
  }) {
    const fullName = `${input.firstName} ${input.lastName}`.trim();
    const safeName = escapeHtml(fullName);
    const safeTreatment = escapeHtml(input.treatmentType);
    const safeDate = escapeHtml(input.date);
    const safeTime = escapeHtml(input.time);
    const safePhone = escapeHtml(input.phone);
    const safeNotes = escapeHtml(input.notes || "No additional notes.");
    const safeDuration = escapeHtml(String(input.durationMins));

    const text = [
      `Dear ${fullName},`,
      "",
      input.intro,
      `Treatment: ${input.treatmentType}`,
      `Date: ${input.date}`,
      `Time: ${input.time}`,
      `Duration: ${input.durationMins} minutes`,
      `Phone: ${input.phone}`,
      "",
      "If you need to reschedule, please contact our care desk.",
      "",
      "Dentiva Care Team",
    ].join("\n");

    const html = `
      <div style="margin:0;padding:0;background:#eff6ff;font-family:Arial,sans-serif;color:#0f172a;">
        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:26px 30px;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">${escapeHtml(input.heading)}</h1>
                    <p style="margin:8px 0 0 0;color:#dbeafe;font-size:13px;">Dentiva Clinical Care</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 30px;">
                    <p style="margin:0 0 16px 0;font-size:15px;">Dear <strong>${safeName}</strong>,</p>
                    <p style="margin:0 0 18px 0;font-size:14px;color:#334155;">${escapeHtml(input.intro)} Here are your appointment details:</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse;background:#f8fbff;border:1px solid #e2e8f0;border-radius:12px;">
                      <tr><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;"><strong>Treatment</strong><br/>${safeTreatment}</td></tr>
                      <tr><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;"><strong>Date & Time</strong><br/>${safeDate} at ${safeTime}</td></tr>
                      <tr><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;"><strong>Estimated Duration</strong><br/>${safeDuration} minutes</td></tr>
                      <tr><td style="padding:12px 14px;font-size:13px;"><strong>Contact Number</strong><br/>${safePhone}</td></tr>
                    </table>
                    <p style="margin:16px 0 0 0;font-size:13px;color:#475569;"><strong>Notes:</strong> ${safeNotes}</p>
                    <p style="margin:20px 0 0 0;font-size:13px;color:#475569;">Need to change your slot? Reply to this email or contact our care desk.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:12px;color:#64748b;">Dentiva Care Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    return { text, html };
  }

  async function sendAppointmentEmail(input: {
    eventName: "booking" | "confirmed" | "rescheduled";
    to: string;
    firstName: string;
    lastName: string;
    date: string;
    time: string;
    treatmentType: string;
    durationMins: number;
    phone: string;
    notes?: string;
  }) {
    if (!mailer) return;
    const meta = input.eventName === "confirmed"
      ? {
          subject: `Appointment Confirmed - ${input.date} ${input.time}`,
          heading: "Appointment Confirmed",
          intro: "Your dental appointment is confirmed.",
        }
      : input.eventName === "rescheduled"
        ? {
            subject: `Appointment Rescheduled - ${input.date} ${input.time}`,
            heading: "Appointment Rescheduled",
            intro: "Your appointment schedule has been updated.",
          }
        : {
            subject: `Appointment Booked - ${input.date} ${input.time}`,
            heading: "Appointment Booked",
            intro: "Your dental appointment has been booked successfully.",
          };
    const content = createAppointmentEmailTemplate({
      heading: meta.heading,
      intro: meta.intro,
      ...input,
    });
    await mailer.sendMail({
      from: SMTP_FROM,
      to: input.to,
      subject: meta.subject,
      text: content.text,
      html: content.html,
    });
  }

  function parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return {} as Record<string, string>;
    return cookieHeader
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, item) => {
        const index = item.indexOf("=");
        if (index <= 0) return acc;
        const key = item.slice(0, index);
        const value = decodeURIComponent(item.slice(index + 1));
        acc[key] = value;
        return acc;
      }, {});
  }

  function signToken(payload: AuthUser) {
    const exp = Date.now() + SESSION_MAX_AGE_MS;
    const body = Buffer.from(JSON.stringify({ payload, exp })).toString("base64url");
    const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
    return `${body}.${sig}`;
  }

  function getAuthUser(req: express.Request): AuthUser | null {
    if (!SESSION_SECRET) return null;
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (!token || !token.includes(".")) return null;
    const [body, sig] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
    const validSig =
      sig.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    if (!validSig) return null;

    try {
      const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { payload: AuthUser; exp: number };
      if (!parsed.exp || parsed.exp < Date.now()) return null;
      if (parsed.payload.role !== "admin" && parsed.payload.role !== "staff") return null;
      return parsed.payload;
    } catch {
      return null;
    }
  }

  function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    next();
  }

  function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }
    next();
  }

  async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString("hex");
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, hash) => {
        if (err) reject(err);
        else resolve(`${salt}:${hash.toString("hex")}`);
      });
    });
  }

  async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedHash) => {
        if (err) reject(err);
        else resolve(crypto.timingSafeEqual(Buffer.from(hash, "hex"), derivedHash));
      });
    });
  }

  app.post("/api/auth/login", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET) {
      return res.status(500).json({ success: false, message: "Auth is not configured." });
    }
    const validUser = username === ADMIN_USERNAME;
    const validPass =
      password.length === ADMIN_PASSWORD.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));
    if (validUser && validPass) {
      const user: AuthUser = {
        uid: "admin",
        email: `${ADMIN_USERNAME}@dentacare.pro`,
        displayName: "Clinic Admin",
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      const token = signToken(user);
      res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "strict",
        maxAge: SESSION_MAX_AGE_MS,
        path: "/",
      });
      return res.json({ success: true, data: user });
    }

    // Check staff/doctor DB credentials
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; email: string; displayName: string; role: string; passwordHash: string | null; createdAt: Date }>>(
      `SELECT "id", "email", "displayName", "role", "passwordHash", "createdAt" FROM "User" WHERE "username" = ? AND "passwordHash" IS NOT NULL LIMIT 1`,
      username
    );
    const staffRow = rows[0];
    if (staffRow && staffRow.passwordHash) {
      const valid = await verifyPassword(password, staffRow.passwordHash);
      if (valid) {
        const staffUser: AuthUser = {
          uid: staffRow.id,
          email: staffRow.email,
          displayName: staffRow.displayName,
          role: staffRow.role as AuthUser["role"],
          createdAt: staffRow.createdAt instanceof Date ? staffRow.createdAt.toISOString() : String(staffRow.createdAt),
        };
        const token = signToken(staffUser);
        res.cookie(SESSION_COOKIE, token, { httpOnly: true, secure: COOKIE_SECURE, sameSite: "strict", maxAge: SESSION_MAX_AGE_MS, path: "/" });
        return res.json({ success: true, data: staffUser });
      }
    }
    return res.status(401).json({ success: false, message: "Invalid username or password." });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "strict",
      path: "/",
    });
    return res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    return res.json({ success: true, data: user });
  });

  function isValidDate(date: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

  function isValidTime(time: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  }

  function isFifteenMinuteSlot(time: string) {
    const minutes = Number(time.split(":")[1] || "0");
    return minutes % 15 === 0;
  }
  function isValidDurationMins(value: number) {
    return Number.isInteger(value) && value >= 15 && value <= 240 && value % 15 === 0;
  }
  function timeToMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }
  function minutesToTime(total: number) {
    const h = String(Math.floor(total / 60)).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
  type HourRange = { start: string; end: string };
  interface NotificationSettings {
    recipients: string[];
    sendToPatientOnBooking: boolean;
    sendToPatientOnConfirmed: boolean;
    sendToPatientOnReschedule: boolean;
    sendToTeamOnBooking: boolean;
    sendToTeamOnConfirmed: boolean;
    sendToTeamOnReschedule: boolean;
  }

  function normalize(input: AppointmentPayload) {
    return {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      nic: input.nic?.trim() || null,
      age: input.age != null ? Number(input.age) : null,
      gender: input.gender?.trim() || null,
      treatmentType: input.treatmentType.trim(),
      date: input.date.trim(),
      time: input.time.trim(),
      notes: (input.notes || "").trim(),
      status: input.status || "pending",
      durationMins: Number(input.durationMins || 60),
    };
  }

  function validateAppointmentInput(input: AppointmentPayload) {
    const appointment = normalize(input);
    if (!appointment.firstName || !appointment.lastName) return "First name and last name are required.";
    if (appointment.email && !appointment.email.includes("@")) return "Invalid email format.";
    if (!appointment.phone) return "Phone number is required.";
    if (!appointment.treatmentType) return "Treatment type is required.";
    if (!isValidDate(appointment.date)) return "Date must be in YYYY-MM-DD format.";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(appointment.date) < today) return "Appointments cannot be booked for past dates.";
    if (!isValidTime(appointment.time)) return "Time must be in HH:MM format.";
    if (!isFifteenMinuteSlot(appointment.time)) return "Appointments must be scheduled on 15-minute slot boundaries.";
    if (!allowedStatuses.includes(appointment.status)) return "Invalid status value.";
    if (!isValidDurationMins(appointment.durationMins)) return "Duration must be between 15 and 240 minutes in 15-minute steps.";
    return null;
  }

  async function ensureSettingsTable() {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClinicSettings" (
        "id" INTEGER PRIMARY KEY CHECK ("id" = 1),
        "openTime" TEXT NOT NULL,
        "closeTime" TEXT NOT NULL,
        "rangesJson" TEXT
      )
    `);
    const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `PRAGMA table_info("ClinicSettings")`
    );
    const hasRangesJson = columns.some((column) => column.name === "rangesJson");
    const hasNotificationRecipientsJson = columns.some((column) => column.name === "notificationRecipientsJson");
    const hasNotificationRulesJson = columns.some((column) => column.name === "notificationRulesJson");
    if (!hasRangesJson) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ClinicSettings" ADD COLUMN "rangesJson" TEXT`);
    }
    if (!hasNotificationRecipientsJson) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ClinicSettings" ADD COLUMN "notificationRecipientsJson" TEXT`);
    }
    if (!hasNotificationRulesJson) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ClinicSettings" ADD COLUMN "notificationRulesJson" TEXT`);
    }
    const hasTreatmentTypesJson = columns.some((column) => column.name === "treatmentTypesJson");
    if (!hasTreatmentTypesJson) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ClinicSettings" ADD COLUMN "treatmentTypesJson" TEXT`);
    }
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ClinicSettings" ("id", "openTime", "closeTime")
      SELECT 1, '08:00', '18:00'
      WHERE NOT EXISTS (SELECT 1 FROM "ClinicSettings" WHERE "id" = 1)
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "ClinicSettings"
      SET "rangesJson" = '[{"start":"08:00","end":"12:00"},{"start":"14:00","end":"18:00"}]'
      WHERE "id" = 1 AND ("rangesJson" IS NULL OR "rangesJson" = '')
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "ClinicSettings"
      SET "notificationRecipientsJson" = '[]'
      WHERE "id" = 1 AND ("notificationRecipientsJson" IS NULL OR "notificationRecipientsJson" = '')
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "ClinicSettings"
      SET "notificationRulesJson" = '{"sendToPatientOnBooking":true,"sendToPatientOnConfirmed":true,"sendToPatientOnReschedule":true,"sendToTeamOnBooking":true,"sendToTeamOnConfirmed":true,"sendToTeamOnReschedule":true}'
      WHERE "id" = 1 AND ("notificationRulesJson" IS NULL OR "notificationRulesJson" = '')
    `);
    await prisma.$executeRawUnsafe(
      `UPDATE "ClinicSettings" SET "treatmentTypesJson" = ? WHERE "id" = 1 AND ("treatmentTypesJson" IS NULL OR "treatmentTypesJson" = '')`,
      JSON.stringify([
        "Consultation", "Dental Cleaning / Scaling", "Tooth Extraction", "Root Canal Treatment",
        "Crown Placement", "Composite Filling", "Amalgam Filling", "Dental Implant", "Teeth Whitening",
        "Orthodontic Consultation", "Dentures", "Bridge", "Veneer", "Periodontal Treatment",
        "Fluoride Treatment", "Dental X-Ray", "Cavity Check-up", "Wisdom Tooth Removal",
      ])
    );
  }

  async function ensureHistoryEventsTable() {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClinicHistoryEvent" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "eventType" TEXT NOT NULL,
        "actorRole" TEXT,
        "source" TEXT,
        "patientId" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "appointmentId" TEXT,
        "payloadJson" TEXT,
        "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  function normalizePhone(value: string | null | undefined) {
    return String(value || "").replace(/\s|-/g, "").trim();
  }

  async function logHistoryEvent(input: {
    eventType: string;
    actorRole?: string;
    source?: string;
    patientId?: string | null;
    email?: string | null;
    phone?: string | null;
    appointmentId?: string | null;
    payload?: unknown;
  }) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ClinicHistoryEvent"
        ("eventType", "actorRole", "source", "patientId", "email", "phone", "appointmentId", "payloadJson")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      input.eventType,
      input.actorRole || null,
      input.source || null,
      input.patientId || null,
      input.email ? String(input.email).trim().toLowerCase() : null,
      normalizePhone(input.phone),
      input.appointmentId || null,
      input.payload ? JSON.stringify(input.payload) : null
    );
  }

  async function getHospitalHours() {
    const rows = await prisma.$queryRawUnsafe<Array<{ openTime: string; closeTime: string; rangesJson: string | null }>>(
      `SELECT "openTime", "closeTime", "rangesJson" FROM "ClinicSettings" WHERE "id" = 1 LIMIT 1`
    );
    const row = rows[0];
    if (!row) {
      return {
        openTime: "08:00",
        closeTime: "18:00",
        ranges: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }] as HourRange[],
      };
    }
    let ranges: HourRange[] = [];
    try {
      ranges = JSON.parse(row.rangesJson || "[]") as HourRange[];
    } catch {
      ranges = [];
    }
    if (!ranges.length) {
      ranges = [{ start: row.openTime, end: row.closeTime }];
    }
    return { openTime: row.openTime, closeTime: row.closeTime, ranges };
  }

  function normalizeRecipients(input: string[]) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return Array.from(new Set(input.map((item) => String(item || "").trim().toLowerCase()).filter((item) => emailRegex.test(item))));
  }

  async function getNotificationSettings(): Promise<NotificationSettings> {
    const rows = await prisma.$queryRawUnsafe<Array<{
      notificationRecipientsJson: string | null;
      notificationRulesJson: string | null;
    }>>(
      `SELECT "notificationRecipientsJson", "notificationRulesJson" FROM "ClinicSettings" WHERE "id" = 1 LIMIT 1`
    );
    const row = rows[0];
    let recipients: string[] = [];
    let rules: Partial<NotificationSettings> = {};
    try {
      recipients = normalizeRecipients(JSON.parse(row?.notificationRecipientsJson || "[]"));
    } catch {
      recipients = [];
    }
    try {
      rules = JSON.parse(row?.notificationRulesJson || "{}") as Partial<NotificationSettings>;
    } catch {
      rules = {};
    }
    return {
      recipients,
      sendToPatientOnBooking: rules.sendToPatientOnBooking ?? true,
      sendToPatientOnConfirmed: rules.sendToPatientOnConfirmed ?? true,
      sendToPatientOnReschedule: rules.sendToPatientOnReschedule ?? true,
      sendToTeamOnBooking: rules.sendToTeamOnBooking ?? true,
      sendToTeamOnConfirmed: rules.sendToTeamOnConfirmed ?? true,
      sendToTeamOnReschedule: rules.sendToTeamOnReschedule ?? true,
    };
  }

  async function getTreatmentTypes(): Promise<string[]> {
    const rows = await prisma.$queryRawUnsafe<Array<{ treatmentTypesJson: string | null }>>(
      `SELECT "treatmentTypesJson" FROM "ClinicSettings" WHERE "id" = 1 LIMIT 1`
    );
    try {
      return JSON.parse(rows[0]?.treatmentTypesJson || "[]") as string[];
    } catch {
      return [];
    }
  }

  async function sendTeamNotificationEmail(input: {
    recipients: string[];
    eventName: "booking" | "confirmed" | "rescheduled";
    patientName: string;
    treatmentType: string;
    date: string;
    time: string;
    phone: string;
  }) {
    if (!mailer || input.recipients.length === 0) return;
    const eventLabel = input.eventName === "confirmed" ? "Appointment Confirmed" : input.eventName === "rescheduled" ? "Appointment Rescheduled" : "New Booking";
    const subject = `[Dentiva] ${eventLabel} - ${input.patientName}`;
    const html = `
      <div style="font-family:Arial,sans-serif;background:#eff6ff;padding:20px;color:#0f172a">
        <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:18px">
          <h2 style="margin:0 0 12px 0;color:#1d4ed8">${eventLabel}</h2>
          <p style="margin:0 0 8px 0"><strong>Patient:</strong> ${escapeHtml(input.patientName)}</p>
          <p style="margin:0 0 8px 0"><strong>Treatment:</strong> ${escapeHtml(input.treatmentType)}</p>
          <p style="margin:0 0 8px 0"><strong>Schedule:</strong> ${escapeHtml(input.date)} ${escapeHtml(input.time)}</p>
          <p style="margin:0"><strong>Phone:</strong> ${escapeHtml(input.phone)}</p>
        </div>
      </div>
    `;
    await mailer.sendMail({
      from: SMTP_FROM,
      to: input.recipients.join(","),
      subject,
      html,
      text: `${eventLabel}\nPatient: ${input.patientName}\nTreatment: ${input.treatmentType}\nSchedule: ${input.date} ${input.time}\nPhone: ${input.phone}`,
    });
  }

  function isValidRanges(ranges: HourRange[]) {
    if (!Array.isArray(ranges) || ranges.length === 0) return false;
    const normalized = ranges.map((item) => ({
      start: item.start,
      end: item.end,
      startMin: timeToMinutes(item.start),
      endMin: timeToMinutes(item.end),
    })).sort((a, b) => a.startMin - b.startMin);

    for (let i = 0; i < normalized.length; i += 1) {
      const r = normalized[i];
      if (!isValidTime(r.start) || !isValidTime(r.end)) return false;
      if (!isFifteenMinuteSlot(r.start) || !isFifteenMinuteSlot(r.end)) return false;
      if (r.startMin >= r.endMin) return false;
      if (i > 0 && r.startMin < normalized[i - 1].endMin) return false;
    }
    return true;
  }

  function isTimeWithinRanges(time: string, ranges: HourRange[]) {
    const minutes = timeToMinutes(time);
    return ranges.some((range) => minutes >= timeToMinutes(range.start) && minutes < timeToMinutes(range.end));
  }
  function isRangeAvailable(time: string, durationMins: number, ranges: HourRange[]) {
    const start = timeToMinutes(time);
    const end = start + durationMins;
    return ranges.some((range) => {
      const rangeStart = timeToMinutes(range.start);
      const rangeEnd = timeToMinutes(range.end);
      return start >= rangeStart && end <= rangeEnd;
    });
  }

  function getEnvelope(ranges: HourRange[]) {
    const mins = ranges.flatMap((range) => [timeToMinutes(range.start), timeToMinutes(range.end)]);
    return { openTime: minutesToTime(Math.min(...mins)), closeTime: minutesToTime(Math.max(...mins)) };
  }

  async function hasConflict(date: string, time: string, durationMins: number, ignoreId?: string) {
    const results = await prisma.appointment.findMany({
      where: {
        date,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        status: { not: "cancelled" },
      },
    });

    const start = timeToMinutes(time);
    const end = start + durationMins;
    return results.some((item) => {
      const itemStart = timeToMinutes(item.time);
      const itemDuration = item.durationMins || 60;
      const itemEnd = itemStart + itemDuration;
      return start < itemEnd && itemStart < end;
    });
  }

  app.get("/api/appointments", requireAuth, async (_req, res) => {
    try {
      const data = await prisma.appointment.findMany({
        orderBy: [{ createdAt: "desc" }],
        include: { treatment: true, payment: true },
      });
      // Merge nic/age/gender from raw columns (not in Prisma schema)
      const extras = await prisma.$queryRawUnsafe<Array<{ id: string; nic: string | null; age: number | null; gender: string | null }>>(
        `SELECT "id", "nic", "age", "gender" FROM "Appointment"`
      );
      const extrasMap = new Map(extras.map((e) => [e.id, e]));
      const enriched = data.map((a) => ({ ...a, ...extrasMap.get(a.id) }));
      res.json({ success: true, data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to load appointments." });
    }
  });

  app.get("/api/appointments/availability", async (_req, res) => {
    try {
      const data = await prisma.appointment.findMany({
        where: { status: { not: "cancelled" } },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        select: {
          id: true,
          date: true,
          time: true,
          durationMins: true,
          status: true,
        },
      });
      res.json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load availability." });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    const input = req.body as AppointmentPayload;
    const validationError = validateAppointmentInput(input);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const appointment = normalize(input);
    try {
      const settings = await getHospitalHours();
      if (!isTimeWithinRanges(appointment.time, settings.ranges) || !isRangeAvailable(appointment.time, appointment.durationMins, settings.ranges)) {
        return res.status(400).json({
          success: false,
          message: `Appointments must fit fully inside configured hospital opening periods.`,
        });
      }
      const conflict = await hasConflict(appointment.date, appointment.time, appointment.durationMins);
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "This time slot is already assigned. Please choose another one.",
        });
      }

      const normalizedEmail = appointment.email.trim().toLowerCase();
      const normalizedPhone = normalizePhone(appointment.phone);
      const actorRole = getAuthUser(req)?.role || "public";
      const source = getAuthUser(req) ? "dashboard" : "booking";

      // Identify patient by email first (only if email provided), then by NIC
      const hasEmail = Boolean(normalizedEmail);
      let linkedPatient = hasEmail
        ? await prisma.patient.findFirst({ where: { email: normalizedEmail } })
        : null;

      if (!linkedPatient && appointment.nic?.trim()) {
        const byNic = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT "id" FROM "Patient" WHERE "nic" = ? LIMIT 1`,
          appointment.nic.trim()
        );
        if (byNic.length > 0) {
          linkedPatient = await prisma.patient.findUnique({ where: { id: byNic[0].id } });
        }
      }

      if (linkedPatient) {
        // Known patient — refresh their last-visit date
        await prisma.patient.update({
          where: { id: linkedPatient.id },
          data: { lastVisit: appointment.date },
        });
      } else {
        // New patient — auto-register from appointment data
        // If no email provided, use a phone-based placeholder to satisfy the @unique constraint
        const patientEmail = normalizedEmail || `noemail_${normalizedPhone}@noemail.local`;
        linkedPatient = await prisma.patient.create({
          data: {
            firstName: appointment.firstName,
            lastName: appointment.lastName,
            email: patientEmail,
            phone: normalizedPhone,
            lastVisit: appointment.date,
          },
        });
        if (appointment.nic !== null || appointment.age !== null || appointment.gender !== null) {
          await prisma.$executeRawUnsafe(
            `UPDATE "Patient" SET "nic" = ?, "age" = ?, "gender" = ? WHERE "id" = ?`,
            appointment.nic ?? null, appointment.age ?? null, appointment.gender ?? null, linkedPatient.id
          );
        }
        await logHistoryEvent({
          eventType: "patient_registered",
          actorRole,
          source,
          patientId: linkedPatient.id,
          email: linkedPatient.email,
          phone: linkedPatient.phone,
          payload: { firstName: linkedPatient.firstName, lastName: linkedPatient.lastName, autoCreated: true },
        });
      }

      const { nic, age, gender, ...aptData } = appointment;
      const created = await prisma.appointment.create({
        data: {
          ...aptData,
          email: normalizedEmail,
          phone: normalizedPhone,
          patientId: linkedPatient.id,
        },
      });
      if (nic !== undefined || age !== undefined || gender !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Appointment" SET "nic" = ?, "age" = ?, "gender" = ? WHERE "id" = ?`,
          nic ?? null, age ?? null, gender ?? null, created.id
        );
      }

      await logHistoryEvent({
        eventType: "appointment_created",
        actorRole,
        source,
        patientId: created.patientId,
        email: created.email,
        phone: created.phone,
        appointmentId: created.id,
        payload: {
          date: created.date,
          time: created.time,
          durationMins: created.durationMins,
          status: created.status,
          treatmentType: created.treatmentType,
        },
      });

      try {
        const notificationSettings = await getNotificationSettings();
        if (notificationSettings.sendToPatientOnBooking) {
          await sendAppointmentEmail({
            eventName: "booking",
            to: created.email,
            firstName: created.firstName,
            lastName: created.lastName,
            date: created.date,
            time: created.time,
            treatmentType: created.treatmentType,
            durationMins: created.durationMins || 60,
            phone: created.phone,
            notes: created.notes || "",
          });
        }
        if (notificationSettings.sendToTeamOnBooking) {
          await sendTeamNotificationEmail({
            recipients: notificationSettings.recipients,
            eventName: "booking",
            patientName: `${created.firstName} ${created.lastName}`,
            treatmentType: created.treatmentType,
            date: created.date,
            time: created.time,
            phone: created.phone,
          });
        }
      } catch (emailError) {
        console.error("Failed to send booking email notifications:", emailError);
      }

      return res.status(201).json({ success: true, data: created });
    } catch (_error) {
      return res.status(500).json({ success: false, message: "Failed to create appointment." });
    }
  });

  app.patch("/api/appointments/:id", requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const body = req.body as Partial<AppointmentPayload>;
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();
    const status = String(body.status || "pending") as AppointmentStatus;
    const durationMins = Number(body.durationMins ?? 60);
    if (!id) return res.status(400).json({ success: false, message: "Appointment id is required." });

    if (!isValidDate(date) || !isValidTime(time) || !isFifteenMinuteSlot(time)) {
      return res.status(400).json({ success: false, message: "Valid date and time are required." });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }
    if (!isValidDurationMins(durationMins)) {
      return res.status(400).json({ success: false, message: "Duration must be between 15 and 240 minutes in 15-minute steps." });
    }

    try {
      const settings = await getHospitalHours();
      if (!isTimeWithinRanges(time, settings.ranges) || !isRangeAvailable(time, durationMins, settings.ranges)) {
        return res.status(400).json({
          success: false,
          message: `Appointments must fit fully inside configured hospital opening periods.`,
        });
      }
      const conflict = await hasConflict(date, time, durationMins, id);
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "This time slot is already assigned. Please choose another one.",
        });
      }

      await prisma.appointment.update({
        where: { id },
        data: {
          date,
          time,
          status,
          durationMins,
        },
      });

      const updated = await prisma.appointment.findUnique({ where: { id } });
      if (updated) {
        await logHistoryEvent({
          eventType: "appointment_rescheduled",
          actorRole: getAuthUser(req)?.role || "admin",
          source: "dashboard",
          patientId: updated.patientId,
          email: updated.email,
          phone: updated.phone,
          appointmentId: updated.id,
          payload: { date: updated.date, time: updated.time, durationMins: updated.durationMins, status: updated.status },
        });
        // Send immediate reschedule emails only for already-confirmed appointments.
        // If status is still pending, patient receives updated slot when admin confirms.
        if (updated.status === "confirmed") {
          try {
            const notificationSettings = await getNotificationSettings();
            if (notificationSettings.sendToPatientOnReschedule) {
              await sendAppointmentEmail({
                eventName: "rescheduled",
                to: updated.email,
                firstName: updated.firstName,
                lastName: updated.lastName,
                date: updated.date,
                time: updated.time,
                treatmentType: updated.treatmentType,
                durationMins: updated.durationMins || 60,
                phone: updated.phone,
                notes: updated.notes || "",
              });
            }
            if (notificationSettings.sendToTeamOnReschedule) {
              await sendTeamNotificationEmail({
                recipients: notificationSettings.recipients,
                eventName: "rescheduled",
                patientName: `${updated.firstName} ${updated.lastName}`,
                treatmentType: updated.treatmentType,
                date: updated.date,
                time: updated.time,
                phone: updated.phone,
              });
            }
          } catch (emailError) {
            console.error("Failed to send reschedule email notifications:", emailError);
          }
        }
      }

      return res.json({ success: true, message: "Appointment updated." });
    } catch (_error) {
      return res.status(500).json({ success: false, message: "Failed to update appointment." });
    }
  });

  app.patch("/api/appointments/:id/status", requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const status = String(req.body.status || "") as AppointmentStatus;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    try {
      await prisma.appointment.update({
        where: { id },
        data: { status },
      });
      const updated = await prisma.appointment.findUnique({ where: { id } });
      if (updated) {
        await logHistoryEvent({
          eventType: "appointment_status_changed",
          actorRole: getAuthUser(req)?.role || "admin",
          source: "dashboard",
          patientId: updated.patientId,
          email: updated.email,
          phone: updated.phone,
          appointmentId: updated.id,
          payload: { status: updated.status },
        });
        if (status === "confirmed") {
          try {
            const notificationSettings = await getNotificationSettings();
            // Business-critical: always notify patient immediately when admin confirms.
            await sendAppointmentEmail({
              eventName: "confirmed",
              to: updated.email,
              firstName: updated.firstName,
              lastName: updated.lastName,
              date: updated.date,
              time: updated.time,
              treatmentType: updated.treatmentType,
              durationMins: updated.durationMins || 60,
              phone: updated.phone,
              notes: updated.notes || "",
            });
            if (notificationSettings.sendToTeamOnConfirmed) {
              await sendTeamNotificationEmail({
                recipients: notificationSettings.recipients,
                eventName: "confirmed",
                patientName: `${updated.firstName} ${updated.lastName}`,
                treatmentType: updated.treatmentType,
                date: updated.date,
                time: updated.time,
                phone: updated.phone,
              });
            }
          } catch (emailError) {
            console.error("Failed to send confirmation email notifications:", emailError);
          }
        }
      }
      return res.json({ success: true, message: "Status updated." });
    } catch (_error) {
      return res.status(500).json({ success: false, message: "Failed to update status." });
    }
  });

  app.delete("/api/appointments/:id", requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await prisma.appointment.findUnique({ where: { id } });
      await prisma.appointment.delete({ where: { id } });
      if (existing) {
        await logHistoryEvent({
          eventType: "appointment_deleted",
          actorRole: getAuthUser(req)?.role || "admin",
          source: "dashboard",
          patientId: existing.patientId,
          email: existing.email,
          phone: existing.phone,
          appointmentId: existing.id,
          payload: {
            date: existing.date,
            time: existing.time,
            status: existing.status,
            treatmentType: existing.treatmentType,
          },
        });
      }
      return res.json({ success: true, message: "Appointment deleted." });
    } catch (_error) {
      return res.status(500).json({ success: false, message: "Failed to delete appointment." });
    }
  });

  // ── Treatment records ────────────────────────────────────────────────────────

  app.get("/api/appointments/:id/treatment", requireAuth, async (req, res) => {
    try {
      const record = await prisma.treatmentRecord.findUnique({
        where: { appointmentId: req.params.id },
      });
      res.json({ success: true, data: record });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load treatment." });
    }
  });

  app.post("/api/appointments/:id/treatment", requireAuth, async (req, res) => {
    const { treatmentName, teethNumbers, notes, cost } = req.body as Record<string, string>;
    if (!treatmentName?.trim()) {
      return res.status(400).json({ success: false, message: "Treatment name is required." });
    }
    try {
      const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
      if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });
      const record = await prisma.treatmentRecord.upsert({
        where: { appointmentId: req.params.id },
        update: {
          treatmentName: treatmentName.trim(),
          teethNumbers: teethNumbers?.trim() || null,
          notes: notes?.trim() || null,
          cost: Math.max(0, Number(cost) || 0),
        },
        create: {
          appointmentId: req.params.id,
          patientId: appointment.patientId,
          treatmentName: treatmentName.trim(),
          teethNumbers: teethNumbers?.trim() || null,
          notes: notes?.trim() || null,
          cost: Math.max(0, Number(cost) || 0),
        },
      });
      res.json({ success: true, data: record });
    } catch {
      res.status(500).json({ success: false, message: "Failed to save treatment." });
    }
  });

  // ── Payments ─────────────────────────────────────────────────────────────────

  app.get("/api/appointments/:id/payment", requireAuth, async (req, res) => {
    try {
      const record = await prisma.payment.findUnique({
        where: { appointmentId: req.params.id },
      });
      res.json({ success: true, data: record });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load payment." });
    }
  });

  app.post("/api/appointments/:id/payment", requireAuth, async (req, res) => {
    const { amount, amountPaid, status, method, notes } = req.body as Record<string, string>;
    const validStatuses = ["pending", "partial", "paid", "waived"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid payment status." });
    }
    try {
      const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
      if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });
      const parsedAmount = Math.max(0, Number(amount) || 0);
      const parsedPaid = Math.max(0, Number(amountPaid) || 0);
      const resolvedStatus = (status as "pending" | "partial" | "paid" | "waived") || "pending";
      const record = await prisma.payment.upsert({
        where: { appointmentId: req.params.id },
        update: {
          amount: parsedAmount,
          amountPaid: parsedPaid,
          status: resolvedStatus,
          method: method?.trim() || null,
          notes: notes?.trim() || null,
          paidAt: resolvedStatus === "paid" ? new Date() : null,
        },
        create: {
          appointmentId: req.params.id,
          amount: parsedAmount,
          amountPaid: parsedPaid,
          status: resolvedStatus,
          method: method?.trim() || null,
          notes: notes?.trim() || null,
          paidAt: resolvedStatus === "paid" ? new Date() : null,
        },
      });
      res.json({ success: true, data: record });
    } catch {
      res.status(500).json({ success: false, message: "Failed to save payment." });
    }
  });

  // ── Overview stats ────────────────────────────────────────────────────────────

  app.get("/api/stats/overview", requireAdminAuth, async (_req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });
      const [todayCount, pendingCount, pendingPayments, totalPatients, weeklyRaw] = await Promise.all([
        prisma.appointment.count({ where: { date: today, status: { not: "cancelled" } } }),
        prisma.appointment.count({ where: { status: "pending" } }),
        prisma.payment.count({ where: { status: { in: ["pending", "partial"] } } }),
        prisma.patient.count(),
        prisma.appointment.groupBy({
          by: ["date"],
          where: { date: { in: last7Days }, status: { not: "cancelled" } },
          _count: { id: true },
        }),
      ]);
      const weeklyChart = last7Days.map((date) => {
        const found = weeklyRaw.find((w) => w.date === date);
        const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
        return { name: dayName, count: found?._count.id || 0 };
      });
      res.json({ success: true, data: { todayCount, pendingCount, pendingPayments, totalPatients, weeklyChart } });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load stats." });
    }
  });

  app.get("/api/staff", requireAdminAuth, async (_req, res) => {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; email: string; displayName: string; role: string; createdAt: Date; username: string | null }>>(
        `SELECT "id", "email", "displayName", "role", "createdAt", "username" FROM "User" WHERE "role" IN ('admin', 'staff') ORDER BY "createdAt" ASC`
      );
      const data = rows.map((r) => ({
        id: r.id,
        email: r.email,
        displayName: r.displayName,
        role: r.role,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        username: r.username ?? null,
        canLogin: !!r.username,
      }));
      res.json({ success: true, data });
    } catch (_error) {
      res.status(500).json({ success: false, message: "Failed to load staff." });
    }
  });

  app.post("/api/staff", requireAdminAuth, async (req, res) => {
    const { displayName, email, username, password, role } = req.body as Record<string, string>;
    if (!displayName || !email || !username || !password) {
      return res.status(400).json({ success: false, message: "Display name, email, username and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    try {
      const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "User" WHERE "username" = ? OR "email" = ? LIMIT 1`,
        username.trim(),
        email.trim().toLowerCase()
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: "Username or email already exists." });
      }
      const hash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          role: (role === "admin" ? "admin" : "staff") as UserRole,
        },
      });
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "username" = ?, "passwordHash" = ? WHERE "id" = ?`,
        username.trim(),
        hash,
        user.id
      );
      return res.status(201).json({
        success: true,
        data: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, username: username.trim() },
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to create staff member." });
    }
  });

  app.delete("/api/staff/:id", requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.user.delete({ where: { id } });
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to delete staff member." });
    }
  });

  app.patch("/api/staff/:id", requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const { displayName, email, username, password, role } = req.body as Record<string, string>;
    if (!id) return res.status(400).json({ success: false, message: "Staff id is required." });
    try {
      const updateData: Record<string, unknown> = {};
      if (displayName?.trim()) updateData.displayName = displayName.trim();
      if (email?.trim()) updateData.email = email.trim().toLowerCase();
      if (role && ["admin", "staff"].includes(role)) updateData.role = role as UserRole;
      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({ where: { id }, data: updateData as Parameters<typeof prisma.user.update>[0]["data"] });
      }
      if (username?.trim()) {
        await prisma.$executeRawUnsafe(`UPDATE "User" SET "username" = ? WHERE "id" = ?`, username.trim(), id);
      }
      if (password && password.length >= 6) {
        const hash = await hashPassword(password);
        await prisma.$executeRawUnsafe(`UPDATE "User" SET "passwordHash" = ? WHERE "id" = ?`, hash, id);
      }
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; email: string; displayName: string; role: string; createdAt: string; username: string | null; passwordHash: string | null }>>(
        `SELECT "id","email","displayName","role","createdAt","username","passwordHash" FROM "User" WHERE "id" = ? LIMIT 1`, id
      );
      if (!rows[0]) return res.status(404).json({ success: false, message: "Staff not found." });
      const u = rows[0];
      return res.json({ success: true, data: { id: u.id, email: u.email, displayName: u.displayName, role: u.role, createdAt: u.createdAt, username: u.username ?? null, canLogin: Boolean(u.username && u.passwordHash) } });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to update staff member." });
    }
  });

  app.get("/api/patients", requireAdminAuth, async (_req, res) => {
    try {
      const data = await prisma.patient.findMany({
        orderBy: { lastName: "asc" },
      });
      res.json({ success: true, data });
    } catch (_error) {
      res.status(500).json({ success: false, message: "Failed to load patients." });
    }
  });

  app.get("/api/history/patients", requireAdminAuth, async (_req, res) => {
    try {
      const [patients, appointments, events] = await Promise.all([
        prisma.patient.findMany({
          orderBy: { createdAt: "desc" },
        }),
        prisma.appointment.findMany({
          orderBy: [{ date: "desc" }, { time: "desc" }],
        }),
        prisma.$queryRawUnsafe<Array<{
          id: number;
          eventType: string;
          actorRole: string | null;
          source: string | null;
          patientId: string | null;
          email: string | null;
          phone: string | null;
          appointmentId: string | null;
          payloadJson: string | null;
          createdAt: string;
        }>>(`SELECT * FROM "ClinicHistoryEvent" ORDER BY "createdAt" DESC`),
      ]);

      const patientById = new Map(patients.map((patient) => [patient.id, patient]));
      // email alias → name key (secondary lookup only)
      const aliasToKey = new Map<string, string>();
      const bucketByKey = new Map<string, {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string;
        dateOfBirth?: string | null;
        medicalHistory?: string | null;
        createdAt: string;
        lastVisit?: string | null;
        appointmentCount: number;
        lastAppointmentAt: string | null;
        appointments: typeof appointments;
        events: typeof events;
        isRegisteredPatient: boolean;
        emailSet: Set<string>;
      }>();

      const nameKey = (first: string, last: string) =>
        `n:${first.trim().toLowerCase()}_${last.trim().toLowerCase()}`;

      const ensureBucket = (key: string, seed: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string;
        dateOfBirth?: string | null;
        medicalHistory?: string | null;
        createdAt: string;
        lastVisit?: string | null;
        isRegisteredPatient: boolean;
      }) => {
        const existing = bucketByKey.get(key);
        if (existing) return existing;
        const created = {
          ...seed,
          appointmentCount: 0,
          lastAppointmentAt: null,
          appointments: [] as typeof appointments,
          events: [] as typeof events,
          emailSet: new Set<string>(),
        };
        bucketByKey.set(key, created);
        if (seed.email) {
          const normalized = seed.email.trim().toLowerCase();
          aliasToKey.set(`e:${normalized}`, key);
          created.emailSet.add(normalized);
        }
        return created;
      };

      // Bucket registered patients by name (primary key)
      patients.forEach((patient) => {
        const key = nameKey(patient.firstName, patient.lastName);
        ensureBucket(key, { ...patient, createdAt: patient.createdAt.toISOString(), isRegisteredPatient: true });
      });

      // Bucket appointments: resolve by patientId name → email alias → name fallback
      appointments.forEach((appointment) => {
        const linkedPatient = appointment.patientId ? patientById.get(appointment.patientId) : null;
        const apptNameKey = nameKey(appointment.firstName, appointment.lastName);

        let resolvedKey: string;
        if (linkedPatient) {
          // Prefer the registered patient's canonical name key
          const pidNameKey = nameKey(linkedPatient.firstName, linkedPatient.lastName);
          resolvedKey = bucketByKey.has(pidNameKey) ? pidNameKey : apptNameKey;
        } else if (appointment.email) {
          // Fall back to email alias if one exists from a registered patient
          resolvedKey = aliasToKey.get(`e:${appointment.email.trim().toLowerCase()}`) ?? apptNameKey;
        } else {
          resolvedKey = apptNameKey;
        }

        const bucket = ensureBucket(resolvedKey, {
          id: linkedPatient?.id || `lead-${appointment.id}`,
          firstName: linkedPatient?.firstName || appointment.firstName,
          lastName: linkedPatient?.lastName || appointment.lastName,
          email: linkedPatient?.email || appointment.email || null,
          phone: linkedPatient?.phone || appointment.phone,
          dateOfBirth: linkedPatient?.dateOfBirth || null,
          medicalHistory: linkedPatient?.medicalHistory || null,
          createdAt: linkedPatient?.createdAt?.toISOString?.() || appointment.createdAt.toISOString(),
          lastVisit: linkedPatient?.lastVisit || null,
          isRegisteredPatient: Boolean(linkedPatient),
        });
        if (appointment.email) {
          const emailNorm = appointment.email.trim().toLowerCase();
          bucket.emailSet.add(emailNorm);
          aliasToKey.set(`e:${emailNorm}`, resolvedKey);
        }
        bucket.appointments.push(appointment);
      });

      // Attach events: resolve by patientId name key, then email alias
      events.forEach((event) => {
        let resolvedKey: string | undefined;
        if (event.patientId) {
          const linkedPatient = patientById.get(event.patientId);
          if (linkedPatient) {
            const pidNameKey = nameKey(linkedPatient.firstName, linkedPatient.lastName);
            resolvedKey = bucketByKey.has(pidNameKey) ? pidNameKey : undefined;
          }
        }
        if (!resolvedKey && event.email) {
          resolvedKey = aliasToKey.get(`e:${String(event.email).trim().toLowerCase()}`);
        }
        if (!resolvedKey) return;
        const bucket = bucketByKey.get(resolvedKey);
        if (!bucket) return;
        if (event.email) bucket.emailSet.add(String(event.email).trim().toLowerCase());
        bucket.events.push(event);
      });

      const data = Array.from(bucketByKey.values())
        .map((bucket) => {
          const history = [...bucket.appointments].sort((a, b) => {
            const aKey = `${a.date}T${a.time}`;
            const bKey = `${b.date}T${b.time}`;
            return bKey.localeCompare(aKey);
          });
          const latest = history[0];
          return {
            ...bucket,
            appointmentCount: history.length,
            lastAppointmentAt: latest ? `${latest.date} ${latest.time}` : null,
            appointments: history,
            events: [...bucket.events].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
            alternateEmails: Array.from(bucket.emailSet).filter((item) => !bucket.email || item !== bucket.email.trim().toLowerCase()),
            emailChangedLikely: Array.from(bucket.emailSet).length > 1,
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      res.json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load patient history." });
    }
  });

  app.get("/api/settings/hours", requireAdminAuth, async (_req, res) => {
    try {
      const settings = await getHospitalHours();
      res.json({ success: true, data: settings });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load settings." });
    }
  });

  app.get("/api/settings/notifications", requireAdminAuth, async (_req, res) => {
    try {
      const settings = await getNotificationSettings();
      res.json({ success: true, data: settings });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load notification settings." });
    }
  });

  app.patch("/api/settings/notifications", requireAdminAuth, async (req, res) => {
    try {
      const body = req.body as Partial<NotificationSettings>;
      const current = await getNotificationSettings();
      const recipients = Array.isArray(body.recipients)
        ? normalizeRecipients(body.recipients)
        : current.recipients;
      const rules: NotificationSettings = {
        recipients,
        sendToPatientOnBooking: body.sendToPatientOnBooking ?? current.sendToPatientOnBooking,
        sendToPatientOnConfirmed: body.sendToPatientOnConfirmed ?? current.sendToPatientOnConfirmed,
        sendToPatientOnReschedule: body.sendToPatientOnReschedule ?? current.sendToPatientOnReschedule,
        sendToTeamOnBooking: body.sendToTeamOnBooking ?? current.sendToTeamOnBooking,
        sendToTeamOnConfirmed: body.sendToTeamOnConfirmed ?? current.sendToTeamOnConfirmed,
        sendToTeamOnReschedule: body.sendToTeamOnReschedule ?? current.sendToTeamOnReschedule,
      };
      await prisma.$executeRawUnsafe(
        `UPDATE "ClinicSettings"
         SET "notificationRecipientsJson" = ?, "notificationRulesJson" = ?
         WHERE "id" = 1`,
        JSON.stringify(rules.recipients),
        JSON.stringify({
          sendToPatientOnBooking: rules.sendToPatientOnBooking,
          sendToPatientOnConfirmed: rules.sendToPatientOnConfirmed,
          sendToPatientOnReschedule: rules.sendToPatientOnReschedule,
          sendToTeamOnBooking: rules.sendToTeamOnBooking,
          sendToTeamOnConfirmed: rules.sendToTeamOnConfirmed,
          sendToTeamOnReschedule: rules.sendToTeamOnReschedule,
        })
      );
      res.json({ success: true, data: rules });
    } catch {
      res.status(500).json({ success: false, message: "Failed to update notification settings." });
    }
  });

  app.get("/api/settings/treatment-types", requireAuth, async (_req, res) => {
    try {
      const types = await getTreatmentTypes();
      res.json({ success: true, data: types });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load treatment types." });
    }
  });

  app.put("/api/settings/treatment-types", requireAuth, async (req, res) => {
    const types = req.body.types;
    if (!Array.isArray(types) || types.some((t: unknown) => typeof t !== "string")) {
      return res.status(400).json({ success: false, message: "types must be an array of strings." });
    }
    const cleaned = (types as string[]).map((t) => t.trim()).filter(Boolean);
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "ClinicSettings" SET "treatmentTypesJson" = ? WHERE "id" = 1`,
        JSON.stringify(cleaned)
      );
      res.json({ success: true, data: cleaned });
    } catch {
      res.status(500).json({ success: false, message: "Failed to save treatment types." });
    }
  });

  app.patch("/api/settings/hours", requireAdminAuth, async (req, res) => {
    const ranges = (req.body.ranges || []) as HourRange[];

    if (!isValidRanges(ranges)) {
      return res.status(400).json({ success: false, message: "Opening periods must be valid, non-overlapping 15-minute ranges." });
    }
    const envelope = getEnvelope(ranges);

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "ClinicSettings" SET "openTime" = ?, "closeTime" = ?, "rangesJson" = ? WHERE "id" = 1`,
        envelope.openTime,
        envelope.closeTime,
        JSON.stringify(ranges)
      );
      res.json({ success: true, data: { ...envelope, ranges } });
    } catch {
      res.status(500).json({ success: false, message: "Failed to update settings." });
    }
  });

  app.post("/api/patients", requireAdminAuth, async (req, res) => {
    const { firstName, lastName, email, phone, nic, age, gender, dateOfBirth, medicalHistory } = req.body as Record<string, string>;
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ success: false, message: "First name, last name, email and phone are required." });
    }
    const ageNum = age ? Number(age) : null;
    try {
      const patient = await prisma.patient.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          dateOfBirth: dateOfBirth?.trim() || null,
          medicalHistory: medicalHistory?.trim() || null,
        },
      });
      // nic/age/gender stored via raw SQL (columns added via migration helper)
      await prisma.$executeRawUnsafe(
        `UPDATE "Patient" SET "nic" = ?, "age" = ?, "gender" = ? WHERE "id" = ?`,
        nic?.trim() || null, ageNum, gender?.trim() || null, patient.id
      );
      await logHistoryEvent({
        eventType: "patient_registered",
        actorRole: getAuthUser(req)?.role || "admin",
        source: "dashboard",
        patientId: patient.id,
        email: patient.email,
        phone: patient.phone,
        payload: { firstName: patient.firstName, lastName: patient.lastName },
      });
      return res.status(201).json({ success: true, data: { ...patient, nic: nic?.trim() || null, age: ageNum, gender: gender?.trim() || null } });
    } catch (_error) {
      return res.status(500).json({ success: false, message: "Failed to create patient." });
    }
  });

  // ── Backup / Export ────────────────────────────────────────────────────────
  app.get("/api/backup/appointments.csv", requireAdminAuth, async (_req, res) => {
    try {
      const apts = await prisma.appointment.findMany({
        orderBy: [{ date: "asc" }, { time: "asc" }],
        include: { treatment: true, payment: true },
      });
      const extras = await prisma.$queryRawUnsafe<Array<{ id: string; nic: string | null; age: number | null; gender: string | null }>>(
        `SELECT "id", "nic", "age", "gender" FROM "Appointment"`
      );
      const extrasMap = new Map(extras.map((e) => [e.id, e]));
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const header = ["ID","Date","Time","First Name","Last Name","NIC","Age","Gender","Phone","Email","Treatment Type","Status","Duration (min)","Notes","Treatment Name","Treatment Cost (LKR)","Payment Status","Amount (LKR)","Amount Paid (LKR)","Balance (LKR)","Created At"];
      const rows = apts.map((a) => {
        const ex = extrasMap.get(a.id);
        const balance = (a.payment?.amount ?? 0) - (a.payment?.amountPaid ?? 0);
        return [a.id,a.date,a.time,a.firstName,a.lastName,ex?.nic??'',ex?.age??'',ex?.gender??'',a.phone,a.email,a.treatmentType,a.status,a.durationMins,a.notes??'',a.treatment?.treatmentName??'',a.treatment?.cost??'',a.payment?.status??'',a.payment?.amount??'',a.payment?.amountPaid??'',Math.max(0,balance),a.createdAt.toISOString()].map(esc).join(",");
      });
      const csv = [header.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="appointments-${new Date().toISOString().slice(0,10)}.csv"`);
      // Record last backup timestamp
      await prisma.$executeRawUnsafe(`UPDATE "ClinicSettings" SET "lastBackupAt" = ? WHERE "id" = 1`, new Date().toISOString());
      res.send(csv);
    } catch {
      res.status(500).json({ success: false, message: "Failed to generate backup." });
    }
  });

  app.get("/api/backup/patients.csv", requireAdminAuth, async (_req, res) => {
    try {
      const patients = await prisma.patient.findMany({ orderBy: [{ createdAt: "desc" }] });
      const extras = await prisma.$queryRawUnsafe<Array<{ id: string; nic: string | null; age: number | null; gender: string | null }>>(
        `SELECT "id", "nic", "age", "gender" FROM "Patient"`
      );
      const extrasMap = new Map(extras.map((e) => [e.id, e]));
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const header = ["ID","First Name","Last Name","NIC","Age","Gender","Phone","Email","Date of Birth","Medical History","Registered At"];
      const rows = patients.map((p) => {
        const ex = extrasMap.get(p.id);
        return [p.id,p.firstName,p.lastName,ex?.nic??'',ex?.age??'',ex?.gender??'',p.phone,p.email,p.dateOfBirth??'',p.medicalHistory??'',p.createdAt.toISOString()].map(esc).join(",");
      });
      const csv = [header.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="patients-${new Date().toISOString().slice(0,10)}.csv"`);
      await prisma.$executeRawUnsafe(`UPDATE "ClinicSettings" SET "lastBackupAt" = ? WHERE "id" = 1`, new Date().toISOString());
      res.send(csv);
    } catch {
      res.status(500).json({ success: false, message: "Failed to generate backup." });
    }
  });

  app.get("/api/backup/settings", requireAdminAuth, async (_req, res) => {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ backupSchedule: string | null; lastBackupAt: string | null }>>(
        `SELECT "backupSchedule", "lastBackupAt" FROM "ClinicSettings" WHERE "id" = 1 LIMIT 1`
      );
      res.json({ success: true, data: { schedule: rows[0]?.backupSchedule ?? "weekly", lastBackupAt: rows[0]?.lastBackupAt ?? null } });
    } catch {
      res.status(500).json({ success: false, message: "Failed to load backup settings." });
    }
  });

  app.patch("/api/backup/settings", requireAdminAuth, async (req, res) => {
    const { schedule } = req.body as { schedule: string };
    if (!["weekly", "monthly"].includes(schedule)) return res.status(400).json({ success: false, message: "schedule must be weekly or monthly." });
    try {
      await prisma.$executeRawUnsafe(`UPDATE "ClinicSettings" SET "backupSchedule" = ? WHERE "id" = 1`, schedule);
      res.json({ success: true, data: { schedule } });
    } catch {
      res.status(500).json({ success: false, message: "Failed to update backup settings." });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  async function ensureUserColumns() {
    const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("User")`);
    const names = columns.map((c) => c.name);
    if (!names.includes("username")) await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "username" TEXT`);
    if (!names.includes("passwordHash")) await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT`);
  }

  async function ensurePatientAppointmentColumns() {
    const patCols = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Patient")`);
    const pn = patCols.map((c) => c.name);
    if (!pn.includes("nic"))    await prisma.$executeRawUnsafe(`ALTER TABLE "Patient" ADD COLUMN "nic" TEXT`);
    if (!pn.includes("age"))    await prisma.$executeRawUnsafe(`ALTER TABLE "Patient" ADD COLUMN "age" INTEGER`);
    if (!pn.includes("gender")) await prisma.$executeRawUnsafe(`ALTER TABLE "Patient" ADD COLUMN "gender" TEXT`);

    const aptCols = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Appointment")`);
    const an = aptCols.map((c) => c.name);
    if (!an.includes("nic"))    await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN "nic" TEXT`);
    if (!an.includes("age"))    await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN "age" INTEGER`);
    if (!an.includes("gender")) await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN "gender" TEXT`);

    // Backup settings columns in ClinicSettings
    const settingsCols = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("ClinicSettings")`);
    const sn = settingsCols.map((c) => c.name);
    if (!sn.includes("backupSchedule")) await prisma.$executeRawUnsafe(`ALTER TABLE "ClinicSettings" ADD COLUMN "backupSchedule" TEXT DEFAULT 'weekly'`);
    if (!sn.includes("lastBackupAt"))   await prisma.$executeRawUnsafe(`ALTER TABLE "ClinicSettings" ADD COLUMN "lastBackupAt" TEXT`);
  }

  const userCount = await prisma.user.count();
  await ensureSettingsTable();
  await ensureHistoryEventsTable();
  await ensureUserColumns();
  await ensurePatientAppointmentColumns();
  if (userCount === 0) {
    await prisma.user.createMany({
      data: [
        { email: "admin@dentacare.pro", displayName: "Clinic Admin", role: UserRole.admin },
        { email: "staff@dentacare.pro", displayName: "Front Desk Staff", role: UserRole.staff },
      ],
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
