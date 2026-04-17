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

const sendClaimConfirmation = async (toEmail, { claimantName, claimRef, itemName, submittedAt }) => {
  const transport = await getTransporter();

  const formattedDate = new Date(submittedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1d4ed8, #4338ca); padding: 28px 32px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
          Lost &amp; Found — Claim Received
        </h1>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px;">SLIIT Student Services</p>
      </div>

      <!-- Body -->
      <div style="background: white; padding: 32px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">

        <p style="color: #374151; font-size: 15px; margin: 0 0 20px 0;">
          Hi <strong>${claimantName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
          We have successfully received your ownership claim for the item listed below.
          Our team will review your submission and get back to you within <strong>1–2 business days</strong>.
        </p>

        <!-- Reference box -->
        <div style="background: linear-gradient(135deg, #1e40af, #3730a3); border-radius: 10px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #bfdbfe; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; margin: 0 0 6px 0;">
            Claim Reference Number
          </p>
          <p style="color: white; font-size: 22px; font-family: 'Courier New', monospace; font-weight: 800; letter-spacing: 0.15em; margin: 0;">
            ${claimRef}
          </p>
          <p style="color: #93c5fd; font-size: 11px; margin: 6px 0 0 0;">Keep this number — you will need it to collect your item</p>
        </div>

        <!-- Claim details -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 14px; background: #f1f5f9; border-radius: 6px 6px 0 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;" colspan="2">
              Claim Summary
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; width: 40%;">Item</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600;">${itemName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Submitted</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #111827;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Status</td>
            <td style="padding: 10px 14px;">
              <span style="background: #fef9c3; color: #92400e; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em;">
                Under Review
              </span>
            </td>
          </tr>
        </table>

        <!-- What happens next -->
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #0369a1; font-size: 13px; font-weight: 700; margin: 0 0 14px 0;">What Happens Next</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top; padding-bottom: 12px; width: 32px;">
                <div style="width: 22px; height: 22px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 11px; font-weight: 700;">1</div>
              </td>
              <td style="vertical-align: top; padding-bottom: 12px; padding-left: 10px; font-size: 13px; color: #0c4a6e; line-height: 1.5;">
                Our team reviews your claim details within <strong>1–2 business days</strong>.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding-bottom: 12px; width: 32px;">
                <div style="width: 22px; height: 22px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 11px; font-weight: 700;">2</div>
              </td>
              <td style="vertical-align: top; padding-bottom: 12px; padding-left: 10px; font-size: 13px; color: #0c4a6e; line-height: 1.5;">
                You will receive a follow-up email with the approval decision.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; width: 32px;">
                <div style="width: 22px; height: 22px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 11px; font-weight: 700;">3</div>
              </td>
              <td style="vertical-align: top; padding-left: 10px; font-size: 13px; color: #0c4a6e; line-height: 1.5;">
                Once approved, visit the <strong>Student Services Office</strong> with your Student ID and reference number to collect your item.
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
          If you did not submit this claim or believe this is a mistake, please contact Student Services immediately.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center; line-height: 1.6;">
          This is an automated message from the SLIIT Lost &amp; Found System.<br />
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const info = await transport.sendMail({
    from: `"SLIIT Lost & Found" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lostfound.lk'}>`,
    to: toEmail,
    subject: `Claim Received — ${claimRef} | SLIIT Lost & Found`,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Claim confirmation preview for ${toEmail}: ${previewUrl}`);
  }
};

// Sent when a claim is approved — includes the 6-digit collection PIN
const sendApprovalWithPin = async (toEmail, { claimantName, claimRef, itemName, collectionPin, expiryDate }) => {
  const transport = await getTransporter();

  const formattedExpiry = new Date(expiryDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 28px 32px; border-radius: 10px 10px 0 0; text-align: center;">
        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <span style="font-size: 24px;">✓</span>
        </div>
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Claim Approved!</h1>
        <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 13px;">SLIIT Lost &amp; Found — Student Services</p>
      </div>

      <!-- Body -->
      <div style="background: white; padding: 32px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">

        <p style="color: #374151; font-size: 15px; margin: 0 0 12px 0;">
          Hi <strong>${claimantName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
          Great news! Your ownership claim for <strong>${itemName}</strong> has been <strong style="color: #059669;">approved</strong>.
          Please visit the <strong>Student Services Office</strong> to collect your item.
        </p>

        <!-- Collection PIN box -->
        <div style="background: linear-gradient(135deg, #065f46, #047857); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #a7f3d0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; margin: 0 0 8px 0;">
            Your Collection PIN
          </p>
          <p style="color: white; font-size: 40px; font-family: 'Courier New', monospace; font-weight: 900; letter-spacing: 0.3em; margin: 0 0 8px 0;">
            ${collectionPin}
          </p>
          <p style="color: #6ee7b7; font-size: 12px; margin: 0;">
            Show this PIN to the office staff when collecting your item
          </p>
          <div style="margin-top: 12px; padding: 8px 16px; background: rgba(0,0,0,0.2); border-radius: 8px; display: inline-block;">
            <p style="color: #fbbf24; font-size: 11px; margin: 0;">
              ⏰ Expires on: <strong>${formattedExpiry}</strong>
            </p>
          </div>
        </div>

        <!-- Claim summary -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 14px; background: #f1f5f9; border-radius: 6px 6px 0 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;" colspan="2">
              Claim Details
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; width: 40%;">Claim Reference</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; font-family: monospace;">${claimRef}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Item</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600;">${itemName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Status</td>
            <td style="padding: 10px 14px;">
              <span style="background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase;">
                Approved — Ready to Collect
              </span>
            </td>
          </tr>
        </table>

        <!-- Instructions -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #166534; font-size: 13px; font-weight: 700; margin: 0 0 12px 0;">How to Collect Your Item</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top; padding-bottom: 10px; width: 32px;">
                <div style="width: 22px; height: 22px; background: #16a34a; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 11px; font-weight: 700;">1</div>
              </td>
              <td style="vertical-align: top; padding-bottom: 10px; padding-left: 10px; font-size: 13px; color: #14532d; line-height: 1.5;">
                Visit the <strong>Student Services Office</strong> during office hours.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding-bottom: 10px; width: 32px;">
                <div style="width: 22px; height: 22px; background: #16a34a; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 11px; font-weight: 700;">2</div>
              </td>
              <td style="vertical-align: top; padding-bottom: 10px; padding-left: 10px; font-size: 13px; color: #14532d; line-height: 1.5;">
                Bring your <strong>Student ID</strong> and this <strong>6-digit PIN</strong>.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; width: 32px;">
                <div style="width: 22px; height: 22px; background: #16a34a; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 11px; font-weight: 700;">3</div>
              </td>
              <td style="vertical-align: top; padding-left: 10px; font-size: 13px; color: #14532d; line-height: 1.5;">
                Show the PIN to the staff to confirm handover of your item.
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
          Keep this PIN private — it is your proof of collection. If you did not submit this claim, please contact Student Services immediately.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center; line-height: 1.6;">
          This is an automated message from the SLIIT Lost &amp; Found System.<br />
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const info = await transport.sendMail({
    from: `"SLIIT Lost & Found" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lostfound.lk'}>`,
    to: toEmail,
    subject: `Claim Approved — Collect Your Item | ${claimRef}`,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Approval+PIN preview for ${toEmail}: ${previewUrl}`);
  }
};

// Sent to student after admin confirms they collected the item
const sendCollectionReceipt = async (toEmail, { claimantName, claimRef, itemName, collectedAt }) => {
  const transport = await getTransporter();

  const formattedDate = new Date(collectedAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0369a1, #0284c7); padding: 28px 32px; border-radius: 10px 10px 0 0; text-align: center;">
        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <span style="font-size: 24px;">📦</span>
        </div>
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Item Successfully Collected</h1>
        <p style="color: #bae6fd; margin: 6px 0 0 0; font-size: 13px;">SLIIT Lost &amp; Found — Collection Receipt</p>
      </div>

      <!-- Body -->
      <div style="background: white; padding: 32px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">

        <p style="color: #374151; font-size: 15px; margin: 0 0 12px 0;">
          Hi <strong>${claimantName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
          This email confirms that your item has been <strong style="color: #0369a1;">successfully collected</strong> from the Student Services Office.
          This serves as your official collection receipt.
        </p>

        <!-- Receipt box -->
        <div style="background: linear-gradient(135deg, #0c4a6e, #0369a1); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #bae6fd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; margin: 0 0 8px 0;">
            Collection Confirmed
          </p>
          <p style="color: white; font-size: 20px; font-weight: 800; margin: 0 0 6px 0;">${itemName}</p>
          <p style="color: #7dd3fc; font-size: 12px; margin: 0;">Collected on: <strong style="color: white;">${formattedDate}</strong></p>
        </div>

        <!-- Receipt details -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 14px; background: #f1f5f9; border-radius: 6px 6px 0 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;" colspan="2">
              Receipt Summary
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; width: 40%;">Claim Reference</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; font-family: monospace;">${claimRef}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Item Collected</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600;">${itemName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Collection Date</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #111827;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Case Status</td>
            <td style="padding: 10px 14px;">
              <span style="background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase;">
                Closed — Returned to Owner
              </span>
            </td>
          </tr>
        </table>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
          Thank you for using the SLIIT Lost &amp; Found service. We hope you have a great day!
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center; line-height: 1.6;">
          This is an automated collection receipt from the SLIIT Lost &amp; Found System.<br />
          Please keep this email for your records. Do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const info = await transport.sendMail({
    from: `"SLIIT Lost & Found" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lostfound.lk'}>`,
    to: toEmail,
    subject: `Collection Receipt — ${claimRef} | SLIIT Lost & Found`,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Collection receipt preview for ${toEmail}: ${previewUrl}`);
  }
};

const sendForwardAlertEmail = async (friendEmail, notice) => {
  const transport = await getTransporter();

  const redirectUrl = `http://localhost:5173/notice?alertItem=${notice._id}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
      
      <!-- Main Email Card Container -->
      <div style="border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); background: white; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5, #8b5cf6); padding: 28px 32px; text-align: center; border-bottom: 2px solid rgba(255,255,255,0.1);">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            SLIIT Lost &amp; Found Alert
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 12px 0;">
          Hello,
        </p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
          A fellow student thinks an item recently posted to the <strong>Found Board</strong> might belong to you.
        </p>

        <!-- Alert Box -->
        <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="color: #0369a1; font-weight: bold; margin: 0 0 8px 0;">Item Category: ${notice.itemType || 'Found Item'}</p>
          <p style="color: #4b5563; font-size: 13px; margin: 0;">We cannot share specific item details here for security reasons. Please click the link below to view the item and securely claim it if it is yours.</p>
        </div>

        <div style="text-align: center; margin: 36px 0;">
          <a href="${redirectUrl}" style="background: linear-gradient(135deg, #4f46e5, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); letter-spacing: 0.5px;">
            View Found Item
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center; line-height: 1.6;">
          This is an automated notification from the SLIIT Lost &amp; Found System.<br />
          If this was sent by mistake, please ignore.
        </p>
      </div> <!-- End Main Email Card Container -->
    </div>
  `;

  const info = await transport.sendMail({
    from: `"SLIIT Lost & Found" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lostfound.lk'}>`,
    to: friendEmail,
    subject: `Hey! Someone thinks they found your item | SLIIT`,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Forward Alert preview for ${friendEmail}: ${previewUrl}`);
  }
};

module.exports = { sendNoticeNotification, sendArchiveNotification, sendClaimConfirmation, sendApprovalWithPin, sendCollectionReceipt, sendForwardAlertEmail };
