function baseTemplate({
  title,
  preview,
  body,
  cta,
  ctaUrl,
}: {
  title: string;
  preview: string;
  body: string;
  cta: string;
  ctaUrl?: string;
}) {
  const ctaHtml = ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;border-radius:9999px;background:linear-gradient(135deg,#f43f5e 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;font-weight:600;mso-padding-alt:0;text-underline-color:#f43f5e">${cta}</a>`
    : "";

  return {
    text: `${title}\n\n${preview}\n\n${body}\n\n${cta}`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${title}</title>
    <style>
      .darkmode { color-scheme: light; }
      body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    </style>
  </head>
  <body class="darkmode" style="margin:0;padding:0;background-color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;border-radius:24px;overflow:hidden;background:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            <tr>
              <td align="center" style="padding:40px 32px 16px;">
                <div style="font-size:32px;">💕</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 24px;">
                <h1 style="margin:0;font-size:24px;font-weight:700;color:#111827;">${title}</h1>
                <p style="margin:8px 0 0;font-size:15px;color:#6b7280;line-height:1.5;">${preview}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">${body}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 40px;">
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;border-top:1px solid #f3f4f6;">
                <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">Sent with love from Closer — just for the two of you.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

export const emailTemplates = {
  pulse({ fromName }: { fromName: string }) {
    const { text, html } = baseTemplate({
      title: "You got a pulse 💓",
      preview: `${fromName} just sent you a pulse on Closer.`,
      body: "Open the app to feel it and send one back.",
      cta: "Open Closer",
    });
    return { subject: "You got a pulse 💓", text, html };
  },

  wordDuelStart({ toName }: { toName: string }) {
    const { text, html } = baseTemplate({
      title: "Word Duel starts now ⚔️",
      preview: "Both words are locked in. You go first.",
      body: "You have <strong>3 trials</strong> to crack the word. Take your best shot.",
      cta: "Play Word Duel",
    });
    return {
      subject: `Word Duel starts now — your first guess ⚔️`,
      text,
      html,
    };
  },

  wordDuelTurn({
    fromName,
    remaining,
  }: {
    fromName: string;
    remaining: number;
  }) {
    const { text, html } = baseTemplate({
      title: "Your turn in Word Duel ⚔️",
      preview: `${fromName} just guessed. It's your move now.`,
      body: `You have <strong>${remaining} trial${remaining === 1 ? "" : "s"}</strong> left to crack the word. Take your best shot.`,
      cta: "Play Word Duel",
    });
    return {
      subject: `Your turn in Word Duel — ${remaining} trial${remaining === 1 ? "" : "s"} left`,
      text,
      html,
    };
  },

  battleshipStart({ toName }: { toName: string }) {
    const { text, html } = baseTemplate({
      title: "Battleship begins 🚢",
      preview: "Both ships are hidden. You take the first shot.",
      body: "Aim carefully — the first to sink the other ship wins.",
      cta: "Play Battleship",
    });
    return { subject: "Battleship begins — your first shot 🚢", text, html };
  },

  battleshipTurn({ fromName }: { fromName: string }) {
    const { text, html } = baseTemplate({
      title: "Your shot in Battleship 🚢",
      preview: `${fromName} just fired. The sea is yours now.`,
      body: "Take aim and fire back before they sink your ship.",
      cta: "Play Battleship",
    });
    return { subject: "Your shot in Battleship 🚢", text, html };
  },

  photoRequest({ fromName, prompt }: { fromName: string; prompt: string }) {
    const { text, html } = baseTemplate({
      title: "A photo has been requested 📸",
      preview: `${fromName} wants to see: "${prompt}"`,
      body: "Open Closer, snap or upload a photo, and make their day.",
      cta: "Fulfill request",
    });
    return { subject: `${fromName} wants a photo 📸`, text, html };
  },

  photoFulfilled({ fromName, prompt }: { fromName: string; prompt: string }) {
    const { text, html } = baseTemplate({
      title: "Your photo request was fulfilled 💌",
      preview: `${fromName} sent you a photo for: "${prompt}"`,
      body: "Open Closer to see the moment they captured.",
      cta: "View photo",
    });
    return { subject: `${fromName} sent you a photo 📸`, text, html };
  },

  handoff({ fromName, unlockAt }: { fromName: string; unlockAt: number }) {
    const when = new Date(unlockAt).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const { text, html } = baseTemplate({
      title: "A goodnight note is waiting 🌙",
      preview: `${fromName} left you a handoff note.`,
      body: `It will unlock on <strong>${when}</strong>. Open Closer when the time comes.`,
      cta: "Open Closer",
    });
    return { subject: "A goodnight note is waiting 🌙", text, html };
  },
};
