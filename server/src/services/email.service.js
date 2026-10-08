const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (config.smtp && config.smtp.host && (config.smtp.user || config.smtp.pass)) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465, // true for 465, false for other ports
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
  }

  /**
   * Generic mail dispatcher
   */
  async sendMail({ to, subject, html, text }) {
    try {
      if (!to || !subject) {
        return { success: false, error: 'Recipient address and subject are required.' };
      }

      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: config.smtp.from,
          to,
          subject,
          text,
          html,
        });
        return { success: true, messageId: info.messageId };
      } else {
        // Log clear, non-sensitive warning when SMTP credentials are not configured
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`[EmailService Warning] SMTP email delivery is not configured. Email to ${to} was not dispatched.`);
        }
        return { success: false, error: 'SMTP email delivery is not configured.' };
      }
    } catch (err) {
      console.error(`[EmailService Error] Failed to deliver email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send Welcome & Verification Email for newly created Admin account
   */
  async sendAdminWelcomeEmail({ to, name, tempPassword }) {
    const loginUrl = `${config.clientUrl}/login`;
    const subject = 'Welcome to ExamForge — Administrator Account Provisioned';
    const text = `Hello ${name},\n\nWelcome to ExamForge! An Administrator account has been provisioned for you.\n\nRegistered Email: ${to}\nLogin URL: ${loginUrl}\nTemporary Password: ${tempPassword || '(Use password set by system administrator)'}\n\nPlease log in and change your temporary initial password after your first login.\n\nRegards,\nExamForge System Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to ExamForge</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Administrator Account Provisioned</p>
        </div>
        <div style="padding: 24px; color: #374151; font-size: 14px; line-height: 1.6;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>An Administrator account has been successfully created for you on the ExamForge assessment platform.</p>
          <div style="background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Registered Email:</strong> ${to}</p>
            ${tempPassword ? `<p style="margin: 8px 0 0 0;"><strong>Temporary Initial Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>` : ''}
          </div>
          <p>You may log into your administrator workspace using the button below:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Log In to ExamForge</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"/>
          <p style="font-size: 12px; color: #6b7280; margin: 0;"><strong>Security Notice:</strong> Please change your temporary initial password immediately after your first login.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to, subject, html, text });
  }

  /**
   * Send Welcome Email for newly created Student account (Direct verified access)
   */
  async sendStudentWelcomeEmail({ to, name, tempPassword }) {
    const loginUrl = `${config.clientUrl}/login`;
    const subject = 'Welcome to ExamForge — Your Student Account';
    const text = `Hello ${name},\n\nWelcome to ExamForge! Your student assessment account is ready.\n\nRegistered College Email: ${to}\nLogin URL: ${loginUrl}\nTemporary Password: ${tempPassword || 'Student@123'}\n\nPlease log in to access your enrolled courses and upcoming assessments. Please change your password after your first login.\n\nRegards,\nExamForge Academic Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0284c7; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to ExamForge</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Student Account Created</p>
        </div>
        <div style="padding: 24px; color: #374151; font-size: 14px; line-height: 1.6;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your student portal account has been provisioned by your academic institution administrator.</p>
          <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Registered College Email:</strong> ${to}</p>
            ${tempPassword ? `<p style="margin: 8px 0 0 0;"><strong>Temporary Initial Password:</strong> <code style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>` : ''}
          </div>
          <p>Click the button below to log in directly to your student portal:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Log In to Student Portal</a>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">Or open this link: <br/><a href="${loginUrl}" style="color: #0284c7;">${loginUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"/>
          <p style="font-size: 12px; color: #6b7280; margin: 0;">Instruction: Log in, check your enrolled courses for upcoming assessments, and update your initial temporary password.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to, subject, html, text });
  }

  /**
   * Send Welcome Email for newly created Instructor account (Direct verified access)
   */
  async sendInstructorWelcomeEmail({ to, name, tempPassword }) {
    const loginUrl = `${config.clientUrl}/login`;
    const subject = 'Welcome to ExamForge — Your Faculty Account';
    const text = `Hello ${name},\n\nWelcome to ExamForge! Your faculty instructor account has been created.\n\nRegistered Faculty Email: ${to}\nLogin URL: ${loginUrl}\nTemporary Password: ${tempPassword || 'Instructor@123'}\n\nPlease log in to manage your assigned courses and create assessments. Please change your password after your first login.\n\nRegards,\nExamForge Academic Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #d97706; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to ExamForge</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Faculty Instructor Account Provisioned</p>
        </div>
        <div style="padding: 24px; color: #374151; font-size: 14px; line-height: 1.6;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your faculty instructor portal account has been set up by your administrator.</p>
          <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Faculty Email:</strong> ${to}</p>
            ${tempPassword ? `<p style="margin: 8px 0 0 0;"><strong>Temporary Initial Password:</strong> <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>` : ''}
          </div>
          <p>Click below to log in directly to your faculty portal:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Log In to Faculty Portal</a>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">Or open this link: <br/><a href="${loginUrl}" style="color: #d97706;">${loginUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"/>
          <p style="font-size: 12px; color: #6b7280; margin: 0;">Security Notice: Please change your temporary initial password after your first login.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to, subject, html, text });
  }

  /**
   * Generic verification email helper
   */
  async sendVerificationEmail({ to, name, verificationToken, role }) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN') {
      return this.sendAdminWelcomeEmail({ to, name, verificationToken });
    } else if (role === 'INSTRUCTOR') {
      return this.sendInstructorWelcomeEmail({ to, name, verificationToken });
    } else {
      return this.sendStudentWelcomeEmail({ to, name, verificationToken });
    }
  }

  /**
   * Send Exam Publication Notification Email to enrolled student
   */
  async sendExamPublishedEmail({ to, studentName, examDetails }) {
    const loginUrl = `${config.clientUrl}/login`;
    const {
      title,
      courseName,
      courseCode,
      examDate,
      startTime,
      endTime,
      durationMinutes,
      totalQuestions,
      totalMarks,
      passingMarks,
    } = examDetails;

    const subject = `📢 Exam Notification: ${title} (${courseCode || courseName})`;
    const text = `Hello ${studentName},\n\nA new assessment "${title}" is now published and scheduled for your course ${courseCode} (${courseName}).\n\nExam Details:\n- Date: ${examDate}\n- Window: ${startTime} to ${endTime}\n- Duration: ${durationMinutes} Minutes\n- Questions: ${totalQuestions}\n- Total Marks: ${totalMarks}\n- Passing Marks: ${passingMarks}\n\nPlease log in to ExamForge to review instructions: ${loginUrl}\n\nGood luck!`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">Upcoming Exam Announcement</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">${courseCode ? `${courseCode} — ` : ''}${courseName}</p>
        </div>
        <div style="padding: 24px; color: #374151; font-size: 14px; line-height: 1.6;">
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>An official assessment has been published and scheduled for your enrolled course.</p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 18px; margin: 20px 0; border-radius: 10px;">
            <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px;">${title}</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #047857;"><strong>Exam Date:</strong></td><td style="padding: 4px 0;">${examDate}</td></tr>
              <tr><td style="padding: 4px 0; color: #047857;"><strong>Time Window:</strong></td><td style="padding: 4px 0;">${startTime} – ${endTime}</td></tr>
              <tr><td style="padding: 4px 0; color: #047857;"><strong>Duration:</strong></td><td style="padding: 4px 0;">${durationMinutes} Minutes</td></tr>
              <tr><td style="padding: 4px 0; color: #047857;"><strong>Questions:</strong></td><td style="padding: 4px 0;">${totalQuestions}</td></tr>
              <tr><td style="padding: 4px 0; color: #047857;"><strong>Total Marks:</strong></td><td style="padding: 4px 0;">${totalMarks}</td></tr>
              <tr><td style="padding: 4px 0; color: #047857;"><strong>Passing Marks:</strong></td><td style="padding: 4px 0;">${passingMarks}</td></tr>
            </table>
          </div>

          <p>Log into your ExamForge Student Workspace to check hardware compatibility and review exam details prior to your scheduled start time.</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="background-color: #10b981; color: white; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Exam Portal</a>
          </div>
          <p style="font-size: 11px; color: #9ca3af; text-align: center;">Login URL: <a href="${loginUrl}" style="color: #10b981;">${loginUrl}</a></p>
        </div>
      </div>
    `;

    return this.sendMail({ to, subject, html, text });
  }

  /**
   * Password reset email
   */
  async sendPasswordResetEmail({ to, resetToken }) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
    const subject = 'ExamForge Password Reset Request';
    const text = `Someone requested a password reset for your ExamForge account.\n\nPlease reset your password by opening the following link in your browser:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #6366f1; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">Password Reset Request</h1>
        </div>
        <div style="padding: 24px; color: #374151; font-size: 14px; line-height: 1.6;">
          <p>Hello,</p>
          <p>We received a request to reset the password for your ExamForge account registered to <strong>${to}</strong>.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">Or open: <br/><a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a></p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Link expires in 60 minutes. If you did not request a password reset, no action is required.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to, subject, html, text });
  }
}

module.exports = new EmailService();
