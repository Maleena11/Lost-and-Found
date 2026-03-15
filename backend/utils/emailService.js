const nodemailer = require('nodemailer');

let transporter = null;

// Build transporter — uses real SMTP if configured, otherwise Ethereal test account
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
    // Real SMTP (Gmail or any provider)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('[Email] Using real SMTP:', process.env.EMAIL_USER);
  } else {
    // Auto-create Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[Email] Using Ethereal test account:', testAccount.user);
    console.log('[Email] View sent emails at: https://ethereal.email');
  }

  return transporter;
};

const categoryLabels = {
  'lost-item': 'Lost Item',
  'found-item': 'Found Item',
  'announcement': 'Announcement',
  'advisory': 'Campus Advisory'
};

const priorityColors = {
  urgent: '#dc2626',
  medium: '#d97706',
  low: '#16a34a'
};

const sendNoticeNotification = async (toEmail, notice) => {
  const transport = await getTransporter();

  const categoryLabel = categoryLabels[notice.category] || notice.category;
  const priorityColor = priorityColors[notice.priority] || '#6b7280';
  const contentExcerpt = notice.content.length > 150
    ? notice.content.substring(0, 150) + '...'
    : notice.content;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 8px;">
      <div style="background: #1e40af; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 18px;">Lost & Found — New Notice</h2>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 16px;">
          <span style="background: ${priorityColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            ${notice.priority}
          </span>
          <span style="background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin-left: 8px;">
            ${categoryLabel}
          </span>
        </div>
        <h3 style="color: #111827; font-size: 20px; margin: 0 0 12px 0;">${notice.title}</h3>
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">${contentExcerpt}</p>
        ${notice.contactPhone || notice.contactEmail ? `
        <div style="background: #f3f4f6; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px;">
          <p style="font-weight: bold; color: #374151; margin: 0 0 6px 0;">Contact Information</p>
          ${notice.contactPhone ? `<p style="color: #4b5563; margin: 0;">Phone: ${notice.contactPhone}</p>` : ''}
          ${notice.contactEmail ? `<p style="color: #4b5563; margin: 0;">Email: ${notice.contactEmail}</p>` : ''}
        </div>` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          You received this because you subscribed to notices.
          To unsubscribe, visit your
          <a href="http://localhost:5173/notification-settings" style="color: #3b82f6;">Notification Settings</a>.
        </p>
      </div>
    </div>
  `;

  const info = await transport.sendMail({
    from: `"Lost & Found System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lostfound.lk'}>`,
    to: toEmail,
    subject: `[Lost & Found] New Notice: ${notice.title}`,
    html
  });

  // Log preview URL when using Ethereal test account
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Preview for ${toEmail}: ${previewUrl}`);
  }
};

const sendArchiveNotification = async (notice) => {
  const officeEmail = process.env.SECURITY_OFFICE_EMAIL || process.env.STUDENT_AFFAIRS_EMAIL;
  if (!officeEmail) {
    console.log('[Archive Email] No office email configured (SECURITY_OFFICE_EMAIL). Skipping.');
    return;
  }

  const transport = await getTransporter();
  const archivedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 8px;">
      <div style="background: #7c3aed; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 18px;">Lost & Found — Urgent Notice Archived</h2>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; margin: 0 0 16px 0;">
          The following <strong>urgent</strong> notice has reached its deadline and has been automatically archived.
          Please review and take any necessary follow-up action.
        </p>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">${notice.title}</h3>
          <p style="color: #78350f; margin: 0 0 8px 0; font-size: 13px;">${notice.content.substring(0, 200)}${notice.content.length > 200 ? '...' : ''}</p>
          <p style="color: #92400e; margin: 0; font-size: 12px;"><strong>Category:</strong> ${notice.category} &nbsp;|&nbsp; <strong>Archived on:</strong> ${archivedOn}</p>
          ${notice.contactPhone || notice.contactEmail ? `
          <p style="color: #92400e; margin: 4px 0 0 0; font-size: 12px;">
            <strong>Contact:</strong>
            ${notice.contactPhone ? `Phone: ${notice.contactPhone}` : ''}
            ${notice.contactPhone && notice.contactEmail ? ' | ' : ''}
            ${notice.contactEmail ? `Email: ${notice.contactEmail}` : ''}
          </p>` : ''}
        </div>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This is an automated message from the Lost & Found system. The notice is now in the archive and visible to administrators.
        </p>
      </div>
    </div>
  `;

  const info = await transport.sendMail({
    from: `"Lost & Found System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lostfound.lk'}>`,
    to: officeEmail,
    subject: `[Action Required] Urgent Notice Archived: ${notice.title}`,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Archive Email] Preview: ${previewUrl}`);
  }
  console.log(`[Archive Email] Sent archive notification to ${officeEmail} for notice: "${notice.title}"`);
};

module.exports = { sendNoticeNotification, sendArchiveNotification };
