import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST     || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE   === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

const FROM = process.env.SMTP_FROM || 'MoonDust ERP <no-reply@moondust.cloud>'
const APP_URL = process.env.NEXTAUTH_URL || 'https://portal.moondust.cloud'

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: 'Réinitialisation de votre mot de passe MoonDust ERP',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
      <div style="background:#1e293b;border-bottom:1px solid rgba(255,255,255,0.06);padding:24px 32px;display:flex;align-items:center;gap:12px;">
        <div style="width:32px;height:32px;background:#eab308;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#0f172a;font-weight:900;font-size:16px;">M</span>
        </div>
        <span style="color:white;font-weight:600;font-size:16px;">MoonDust ERP</span>
      </div>
      <div style="padding:32px;">
        <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 12px;">Réinitialisation du mot de passe</h1>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable <strong style="color:#e2e8f0;">15 minutes</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#eab308;color:#0f172a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 8px;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre mot de passe restera inchangé.
        </p>
        <p style="color:#475569;font-size:11px;margin:0;">
          Ou copiez ce lien dans votre navigateur :<br>
          <span style="color:#94a3b8;word-break:break-all;">${resetUrl}</span>
        </p>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding:16px 32px;">
        <p style="color:#475569;font-size:11px;margin:0;text-align:center;">
          © ${new Date().getFullYear()} Haloweenlife co. — MoonDust ERP · Tous droits réservés
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
    text: `Réinitialisation de votre mot de passe MoonDust ERP\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valable 15 min) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  const loginUrl = `${APP_URL}/login`
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: 'Bienvenue sur MoonDust ERP — Votre accès est prêt',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
      <div style="background:#1e293b;border-bottom:1px solid rgba(255,255,255,0.06);padding:24px 32px;">
        <div style="display:inline-flex;align-items:center;gap:12px;">
          <div style="width:32px;height:32px;background:#eab308;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:#0f172a;font-weight:900;font-size:16px;">M</span>
          </div>
          <span style="color:white;font-weight:600;font-size:16px;">MoonDust ERP</span>
        </div>
      </div>
      <div style="padding:32px;">
        <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 12px;">Bienvenue, ${name} ! 🎉</h1>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Votre accès à MoonDust ERP est prêt. Vous faites partie des premiers utilisateurs à découvrir notre plateforme ERP/CRM en phase alpha.
        </p>
        <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
          <p style="color:#fbbf24;font-size:13px;font-weight:600;margin:0 0 6px;">🚀 Phase Alpha · Accès gratuit</p>
          <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.5;">
            Votre plan BASIC est actif. Toutes les fonctionnalités actuelles sont disponibles gratuitement jusqu'au lancement officiel en septembre 2026.
          </p>
        </div>
        <a href="${loginUrl}" style="display:inline-block;background:#eab308;color:#0f172a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
          Accéder à mon espace
        </a>
        <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;">
          Des questions ? Répondez à cet e-mail, nous sommes là pour vous aider.
        </p>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding:16px 32px;">
        <p style="color:#475569;font-size:11px;margin:0;text-align:center;">
          © ${new Date().getFullYear()} Haloweenlife co. — MoonDust ERP · Tous droits réservés
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
    text: `Bienvenue sur MoonDust ERP, ${name} !\n\nVotre accès est prêt. Connectez-vous ici :\n${loginUrl}\n\nVotre plan BASIC est actif gratuitement jusqu'au lancement officiel en septembre 2026.`,
  })
}
