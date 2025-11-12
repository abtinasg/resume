interface SendEmailOptions {
  to: string;
  name?: string;
  subject: string;
  html: string;
}

type EmailProvider = 'resend' | 'sendgrid' | 'mock';

function formatFromAddress(email: string, name?: string) {
  if (name && name.trim().length > 0) {
    return `${name} <${email}>`;
  }
  return email;
}

export class EmailService {
  private provider: EmailProvider;

  constructor() {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
    if (provider === 'resend' || provider === 'sendgrid') {
      this.provider = provider;
    } else {
      this.provider = 'mock';
    }
  }

  private async sendViaResend(options: SendEmailOptions) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      console.warn('[EmailService] Resend configuration missing. Email not sent.');
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: formatFromAddress(fromEmail, process.env.EMAIL_FROM_NAME),
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Resend email failed: ${errorMessage}`);
    }
  }

  private async sendViaSendGrid(options: SendEmailOptions) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      console.warn('[EmailService] SendGrid configuration missing. Email not sent.');
      return;
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [
              {
                email: options.to,
                name: options.name,
              },
            ],
            subject: options.subject,
          },
        ],
        from: {
          email: fromEmail,
          name: process.env.EMAIL_FROM_NAME,
        },
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`SendGrid email failed: ${errorMessage}`);
    }
  }

  private async dispatch(options: SendEmailOptions) {
    if (this.provider === 'resend') {
      await this.sendViaResend(options);
      return;
    }

    if (this.provider === 'sendgrid') {
      await this.sendViaSendGrid(options);
      return;
    }

    console.info('[EmailService] Email provider not configured. Logging email instead.', options);
  }

  private buildWelcomeTemplate(name?: string) {
    return `
      <h1>Welcome to ResumeIQ${name ? `, ${name}` : ''}!</h1>
      <p>We're excited to help you build a standout resume.</p>
      <p>Here are a few ways to get started today:</p>
      <ul>
        <li>Upload your resume for instant scoring</li>
        <li>Review AI-powered recommendations</li>
        <li>Track improvements over time with progress analytics</li>
      </ul>
      <p>You've got this! 🚀</p>
    `;
  }

  private buildReengagementTemplate(name?: string, inactiveDays?: number) {
    return `
      <h1>We've missed you${name ? `, ${name}` : ''}!</h1>
      <p>${inactiveDays ? `It's been ${inactiveDays} days` : 'It has been a little while'} since your last visit.</p>
      <p>Jump back in to:</p>
      <ul>
        <li>See how your resume scores stack up</li>
        <li>Unlock new achievement badges</li>
        <li>Get fresh tips tailored to your career goals</li>
      </ul>
      <p>Log in today and keep your momentum going!</p>
    `;
  }

  private buildWeeklyTipsTemplate(name?: string, tips?: string[]) {
    const items = (tips && tips.length > 0
      ? tips
      : [
          'Focus each bullet on measurable impact (e.g., “Reduced processing time by 30%”)',
          'Tailor your summary section to the exact job title you are targeting',
          'Balance keywords with storytelling to keep recruiters engaged',
        ]
    )
      .map((tip) => `<li>${tip}</li>`)
      .join('');

    return `
      <h1>Your weekly ResumeIQ tips${name ? `, ${name}` : ''}</h1>
      <p>Here are this week’s top suggestions to keep your resume sharp:</p>
      <ul>${items}</ul>
      <p>Need personalized insights? Upload a new version and get instant feedback.</p>
    `;
  }

  async sendWelcomeEmail(to: string, name?: string) {
    await this.dispatch({
      to,
      name,
      subject: 'Welcome to ResumeIQ!',
      html: this.buildWelcomeTemplate(name),
    });
  }

  async sendReengagementEmail(to: string, name?: string, inactiveDays?: number) {
    await this.dispatch({
      to,
      name,
      subject: "We've missed you at ResumeIQ",
      html: this.buildReengagementTemplate(name, inactiveDays),
    });
  }

  async sendWeeklyTipsEmail(to: string, name?: string, tips?: string[]) {
    await this.dispatch({
      to,
      name,
      subject: 'Your weekly resume improvement tips',
      html: this.buildWeeklyTipsTemplate(name, tips),
    });
  }
}

const emailService = new EmailService();

export default emailService;
