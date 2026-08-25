import { v } from "convex/values";
import { action } from "./_generated/server";

export const send = action({
  args: {
    to: v.optional(v.string()),
    subject: v.string(),
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (!apiKey || !from || !args.to) {
      console.log("Email not sent:", { configured: !!apiKey && !!from, to: args.to });
      return { ok: false, reason: "not configured" };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: args.to,
          subject: args.subject,
          text: args.text,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(body));
      return { ok: true, id: body.id };
    } catch (err: any) {
      console.error("Resend error", err);
      return { ok: false, reason: err.message };
    }
  },
});
