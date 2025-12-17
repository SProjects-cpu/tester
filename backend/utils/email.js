import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('Email not configured. Set SMTP environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email would be sent:', { to, subject });
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@magic.com',
      to,
      subject,
      text,
      html
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to MAGIC Incubation',
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for registering with MAGIC Incubation Program.</p>
      <p>We're excited to support your startup journey.</p>
    `,
    text: `Welcome ${name}! Thank you for registering with MAGIC Incubation Program.`
  }),

  smcScheduled: (startupName, date, time) => ({
    subject: 'SMC Pitch Session Scheduled',
    html: `
      <h1>SMC Session Scheduled</h1>
      <p>Your pitch session has been scheduled:</p>
      <ul>
        <li><strong>Startup:</strong> ${startupName}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      <p>Please be prepared and arrive 10 minutes early.</p>
    `,
    text: `SMC Session Scheduled for ${startupName} on ${date} at ${time}`
  }),

  oneOnOneScheduled: (startupName, mentorName, date, time) => ({
    subject: 'One-on-One Mentorship Session Scheduled',
    html: `
      <h1>Mentorship Session Scheduled</h1>
      <p>Your one-on-one session has been scheduled:</p>
      <ul>
        <li><strong>Startup:</strong> ${startupName}</li>
        <li><strong>Mentor:</strong> ${mentorName}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
    `,
    text: `One-on-One session scheduled with ${mentorName} on ${date} at ${time}`
  }),

  statusUpdate: (startupName, newStatus) => ({
    subject: `Status Update: ${newStatus}`,
    html: `
      <h1>Status Update</h1>
      <p>Congratulations! ${startupName} has been moved to <strong>${newStatus}</strong> stage.</p>
      <p>Keep up the great work!</p>
    `,
    text: `${startupName} status updated to ${newStatus}`
  })
};
