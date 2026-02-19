const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    // Check if Brevo API key is configured (primary email service)
    const brevoApiKey = process.env.BREVO_API_KEY;
    const emailUser = process.env.EMAIL_USER || 'justinsony2000@gmail.com';
    const emailPassword = process.env.EMAIL_PASSWORD || 'your-app-password';

    console.log('🔧 Email Configuration Check:');
    console.log('BREVO_API_KEY:', brevoApiKey ? '***configured***' : 'NOT CONFIGURED');
    console.log('EMAIL_USER:', emailUser);
    console.log('EMAIL_PASSWORD:', emailPassword ? '***configured***' : 'NOT CONFIGURED');

    // Debug file logging
    const debugInfo = {
      timestamp: new Date().toISOString(),
      brevoApiKey: brevoApiKey ? 'Starts with: ' + brevoApiKey.substring(0, 10) + '...' : 'MISSING',
      emailUser: emailUser,
      emailPasswordConfigured: !!emailPassword && emailPassword !== 'replace-with-your-gmail-app-password',
      envKeys: Object.keys(process.env).filter(key => key.includes('BREVO') || key.includes('EMAIL'))
    };

    try {
      fs.writeFileSync(path.join(__dirname, '../email-debug.log'), JSON.stringify(debugInfo, null, 2));
    } catch (e) {
      console.error('Failed to write email debug log:', e.message);
    }

    // Initialize Brevo if API key is available
    if (brevoApiKey && brevoApiKey !== 'xkeysib-your-brevo-api-key-here' && brevoApiKey !== 'your-brevo-api-key') {
      try {
        const brevo = require('@getbrevo/brevo');
        let defaultClient = brevo.ApiClient.instance;
        let apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = brevoApiKey;
        this.brevoApi = new brevo.TransactionalEmailsApi();
        console.log('✅ Brevo email service configured successfully');
      } catch (error) {
        console.error('❌ Brevo initialization failed:', error.message);
        this.brevoApi = null;
      }
    } else {
      console.log('⚠️ Brevo API key not configured. Please set BREVO_API_KEY in .env file');
      this.brevoApi = null;
    }

    // Initialize Gmail transporter as fallback
    if (emailPassword && emailPassword !== 'your-app-password' && emailPassword !== 'your-16-character-app-password' && emailPassword !== 'your-gmail-app-password' && emailPassword !== 'replace-with-your-gmail-app-password') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });
      console.log('✅ Gmail email service configured successfully as fallback');
    } else {
      console.log('⚠️ Gmail credentials not configured correctly. Set EMAIL_USER and EMAIL_PASSWORD with a valid App Password in .env');
      this.transporter = null;
    }
  }

  // Generate secure password
  static generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Send manager credentials email using Brevo (primary) or Gmail (fallback)
  async sendManagerCredentials(managerEmail, managerName, password, passwordResetLink, clubName, adminName = 'System Administrator') {
    const subject = `🎯 Welcome to NGL - Manager Account Created for ${clubName}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manager Account Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to NGL!</h1>
            <p>Your manager account has been created</p>
          </div>
          <div class="content">
            <h2>Dear ${managerName},</h2>
            <p>Welcome to the National Gaming League (NGL) management system!</p>
            <p>Your manager account has been created by <strong>${adminName}</strong> for <strong>${clubName}</strong>.</p>
            
            <div class="credentials">
              <h3>📧 Login Credentials:</h3>
              <p><strong>Email:</strong> ${managerEmail}</p>
              <p><strong>Password:</strong> <span class="highlight">${password}</span></p>
              ${passwordResetLink ? `<p><strong>Setup Link:</strong> <a href="${passwordResetLink}">Click here to set your own password</a></p>` : ''}
              <p><strong>Club:</strong> ${clubName}</p>
            </div>
            
            <p><strong>🔐 Security Note:</strong> Please change your password after your first login.</p>
            
            <h3>⚽ Manager Capabilities:</h3>
            <ul>
              <li>Add and manage coaches for your club</li>
              <li>Review and approve player registrations</li>
              <li>Manage your club's player roster</li>
              <li>Access club statistics and reports</li>
              <li>View match schedules and results</li>
            </ul>
            
            <p><strong>🌐 Login URL:</strong> <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
            
            <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Dashboard</a>
            
            <p>If you have any questions, please contact the system administrator.</p>
            
            <div class="footer">
              <p>Best regards,<br>NGL Administration Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Dear ${managerName},

🎉 Welcome to the National Gaming League (NGL) management system!

Your manager account has been created by ${adminName} for ${clubName}.

📧 Login Credentials:
Email: ${managerEmail}
Password: ${password}
${passwordResetLink ? `Password Setup Link: ${passwordResetLink}` : ''}
Club: ${clubName}

🔐 Security Note: Please change your password after your first login.

⚽ Manager Capabilities:
• Add and manage coaches for your club
• Review and approve player registrations
• Manage your club's player roster
• Access club statistics and reports
• View match schedules and results

🌐 Login URL: ${process.env.FRONTEND_URL}/login

If you have any questions, please contact the system administrator.

Best regards,
NGL Administration Team
    `;

    // Try Brevo first (primary email service)
    if (this.brevoApi) {
      try {
        const brevo = require('@getbrevo/brevo');

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{
          email: managerEmail,
          name: managerName
        }];
        sendSmtpEmail.sender = {
          email: process.env.BREVO_SENDER_EMAIL || 'justinsony2000@gmail.com',
          name: 'NGL Administration Team'
        };
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlBody;
        sendSmtpEmail.textContent = textBody;

        const result = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Brevo email sent successfully:', result.body?.messageId || result.messageId);
        return { success: true, messageId: result.body?.messageId || result.messageId, provider: 'brevo' };
      } catch (error) {
        console.error('❌ Brevo email sending failed:', error.message);
        this.lastError = error.response && error.response.body ? JSON.stringify(error.response.body) : error.message;
        // Fall back to Gmail if Brevo fails
      }
    }

    // Fallback to Gmail if Brevo is not configured or fails
    if (this.transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'justinsony2000@gmail.com',
          to: managerEmail,
          subject: subject,
          html: htmlBody,
          text: textBody
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Gmail email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId, provider: 'gmail' };
      } catch (error) {
        console.error('❌ Gmail email sending failed:', error.message);
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }

    // If no email service is configured, log the email details and provide instructions
    console.log('📧 EMAIL NOT SENT - No email service configured');
    console.log('To:', managerEmail);
    console.log('Subject:', subject);
    console.log('Password Reset Link:', passwordResetLink);
    console.log('---');
    console.log('To enable real email sending, configure either:');
    console.log('1. BREVO_API_KEY for Brevo email service (recommended)');
    console.log('2. EMAIL_USER and EMAIL_PASSWORD for Gmail SMTP');
    console.log('---');
    console.log('For now, here are the credentials that should have been sent:');
    console.log(`Email: ${managerEmail}`);
    console.log(`Password Reset Link: ${passwordResetLink}`);
    console.log(`Club: ${clubName}`);

    return {
      success: false,
      message: this.lastError || 'No email service configured or all services failed.',
      credentials: {
        email: managerEmail,
        passwordResetLink: passwordResetLink,
        club: clubName
      }
    };
  }

  // Send coach credentials email
  async sendCoachCredentials(coachEmail, coachName, password, clubName, managerName) {
    const subject = `⚽ Welcome to NGL - Coach Account Created for ${clubName}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Coach Account Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to NGL!</h1>
            <p>Your coach account has been created</p>
          </div>
          <div class="content">
            <h2>Dear ${coachName},</h2>
            <p>Welcome to the National Gaming League (NGL) management system!</p>
            <p>Your coach account has been created by <strong>${managerName}</strong> for <strong>${clubName}</strong>.</p>
            
            <div class="credentials">
              <h3>📧 Login Credentials:</h3>
              <p><strong>Email:</strong> ${coachEmail}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Club:</strong> ${clubName}</p>
            </div>
            
            <p><strong>🔐 Security Note:</strong> Please change your password after your first login.</p>
            
            <h3>⚽ Coach Capabilities:</h3>
            <ul>
              <li>View and manage players assigned to you</li>
              <li>Access training schedules and match information</li>
              <li>Update player statistics and performance data</li>
              <li>Communicate with club management</li>
              <li>View team analytics and reports</li>
            </ul>
            
            <p><strong>🌐 Login URL:</strong> <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
            
            <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Dashboard</a>
            
            <p>If you have any questions, please contact your club manager or the system administrator.</p>
            
            <div class="footer">
              <p>Best regards,<br>NGL Administration Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Try Brevo first (primary email service)
    if (this.brevoApi) {
      try {
        const { TransactionalEmailsApi } = require('@getbrevo/brevo');

        const sendSmtpEmail = {
          to: [{
            email: coachEmail,
            name: coachName
          }],
          sender: {
            email: process.env.BREVO_SENDER_EMAIL || 'justinsony2000@gmail.com',
            name: 'NGL Administration Team'
          },
          subject: subject,
          htmlContent: htmlBody
        };

        const result = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Brevo email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId, provider: 'brevo' };
      } catch (error) {
        console.error('❌ Brevo email sending failed:', error.message);
        // Fall back to Gmail if Brevo fails
      }
    }

    // Fallback to Gmail if Brevo is not configured or fails
    if (this.transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'justinsony2000@gmail.com',
          to: coachEmail,
          subject: subject,
          html: htmlBody
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Gmail email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId, provider: 'gmail' };
      } catch (error) {
        console.error('❌ Gmail email sending failed:', error.message);
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }

    // If no email service is configured, log the email details
    console.log('📧 EMAIL NOT SENT - No email service configured');
    console.log('To:', coachEmail);
    console.log('Subject:', subject);
    console.log('Password:', password);
    console.log('---');
    console.log('To enable real email sending, configure either:');
    console.log('1. BREVO_API_KEY for Brevo email service (recommended)');
    console.log('2. EMAIL_USER and EMAIL_PASSWORD for Gmail SMTP');
    return { success: false, message: 'No email service configured. Please set up email credentials.' };
  }

  // Send welcome email to newly created coach with login credentials
  async sendCoachWelcomeEmail(coachEmail, coachName, temporaryPassword, clubName) {
    const subject = '🎉 Welcome to NGL - Your Coach Account is Ready!';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NGL</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #578E7E, #417062); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: #fff; border: 2px solid #578E7E; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #578E7E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Welcome to NGL!</h1>
            <p>Your Coach Account Has Been Created</p>
          </div>

          <div class="content">
            <h2>Hello ${coachName}! 👋</h2>

            <p>Congratulations! Your coach account has been successfully created for <strong>${clubName}</strong> in the National Gaming League (NGL).</p>

            <div class="credentials-box">
              <h3>🔐 Your Login Credentials</h3>
              <p><strong>Email:</strong> ${coachEmail}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
            </div>

            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong><br>
              This is a temporary password. For your security, please log in and change your password immediately after your first login.
            </div>

            <h3>🎯 What You Can Do as a Coach:</h3>
            <ul>
              <li>📊 Monitor player performance and statistics</li>
              <li>📹 Upload and manage training materials</li>
              <li>🤖 Access AI-powered coaching tools</li>
              <li>📈 Compare player performance metrics</li>
              <li>🎮 Develop tactical strategies for matches</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">
                🚀 Login to Your Dashboard
              </a>
            </div>

            <h3>📞 Need Help?</h3>
            <p>If you have any questions or need assistance, please contact your club manager or reach out to our support team.</p>

            <p>Welcome to the team, and we look forward to seeing great things from you and your players!</p>

            <p>Best regards,<br>
            <strong>The NGL Team</strong></p>
          </div>

          <div class="footer">
            <p>This email was sent automatically. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} National Gaming League. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Welcome to NGL - Your Coach Account is Ready!

Hello ${coachName}!

Congratulations! Your coach account has been successfully created for ${clubName} in the National Gaming League (NGL).

Your Login Credentials:
Email: ${coachEmail}
Temporary Password: ${temporaryPassword}

IMPORTANT SECURITY NOTICE:
This is a temporary password. For your security, please log in and change your password immediately after your first login.

What You Can Do as a Coach:
- Monitor player performance and statistics
- Upload and manage training materials
- Access AI-powered coaching tools
- Compare player performance metrics
- Develop tactical strategies for matches

Login URL: ${process.env.FRONTEND_URL}/login

Need Help?
If you have any questions or need assistance, please contact your club manager or reach out to our support team.

Welcome to the team, and we look forward to seeing great things from you and your players!

Best regards,
The NGL Team

This email was sent automatically. Please do not reply to this email.
© ${new Date().getFullYear()} National Gaming League. All rights reserved.
    `;

    // Try Brevo first (primary email service)
    if (this.brevoApi) {
      try {
        const sendSmtpEmail = {
          to: [{
            email: coachEmail,
            name: coachName
          }],
          sender: {
            email: process.env.BREVO_SENDER_EMAIL || 'justinsony2000@gmail.com',
            name: 'NGL Administration Team'
          },
          subject: subject,
          htmlContent: htmlBody,
          textContent: textBody
        };

        const result = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Brevo coach welcome email sent successfully:', result.body?.messageId || result.messageId);
        return { success: true, messageId: result.body?.messageId || result.messageId, provider: 'brevo' };
      } catch (error) {
        console.error('❌ Brevo coach welcome email sending failed:', error.message);
        // Fall back to Gmail if Brevo fails
      }
    }

    // Fallback to Gmail if Brevo is not configured or fails
    if (this.transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'justinsony2000@gmail.com',
          to: coachEmail,
          subject: subject,
          html: htmlBody,
          text: textBody
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Gmail coach welcome email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId, provider: 'gmail' };
      } catch (error) {
        console.error('❌ Gmail coach welcome email sending failed:', error.message);
        throw new Error(`Failed to send coach welcome email: ${error.message}`);
      }
    }

    // If no email service is configured, log the email details
    console.log('📧 COACH WELCOME EMAIL NOT SENT - No email service configured');
    console.log('To:', coachEmail);
    console.log('Subject:', subject);
    console.log('Password:', temporaryPassword);
    console.log('---');
    console.log('To enable real email sending, configure either:');
    console.log('1. BREVO_API_KEY for Brevo email service (recommended)');
    console.log('2. EMAIL_USER and EMAIL_PASSWORD for Gmail SMTP');
    return { success: false, message: 'No email service configured. Please set up email credentials.' };
  }
}

module.exports = EmailService;