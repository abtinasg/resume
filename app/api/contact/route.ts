import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid form data',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, message } = validationResult.data;

    // Check if email credentials are configured
    const contactEmail = process.env.CONTACT_EMAIL;
    const contactPassword = process.env.CONTACT_EMAIL_PASSWORD;

    if (!contactEmail || !contactPassword) {
      console.warn('Contact email credentials not configured');
      // In development, log the message and return success
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Contact form submission (dev mode):');
        console.log('From:', name, '<' + email + '>');
        console.log('Message:', message);
        return NextResponse.json({
          success: true,
          message: 'Message received (development mode)',
        });
      }
      return NextResponse.json(
        {
          success: false,
          message: 'Email service not configured',
        },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: contactEmail,
        pass: contactPassword,
      },
    });

    // Email content
    const mailOptions = {
      from: contactEmail,
      to: contactEmail,
      replyTo: email,
      subject: `ResumeIQ Contact Form: Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">New Contact Form Submission</h2>
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #6B7280; font-size: 12px;">This message was sent from the ResumeIQ contact form.</p>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}

---
This message was sent from the ResumeIQ contact form.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send message. Please try again.',
      },
      { status: 500 }
    );
  }
}
