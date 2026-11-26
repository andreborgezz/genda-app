import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.resend.apiKey);

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.resend.mailFrom,
    to,
    subject: 'Redefinição de senha — Genda',
    html: `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background-color: #F8F9FF; color: #1E3A8A;">
        <div style="background-color: #FFFFFF; border: 1px solid #DBEAFE; border-radius: 16px; padding: 28px;">
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0A1C30;">Redefinir sua senha</h2>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #5A6B82;">
            Recebemos uma solicitação para redefinir a senha da sua conta no Genda. Clique no botão abaixo para criar uma nova senha:
          </p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 24px; background-color: #1D4ED8; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 12px;"
          >
            Redefinir senha
          </a>
          <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.5; color: #5A6B82;">
            Este link expira em 1 hora. Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao enviar e-mail de redefinição de senha.');
  }
}
