const nodemailer = require('nodemailer');

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
    if (emailPassword && emailPassword !== 'your-app-password' && emailPassword !== 'your-16-character-app-password' && emailPassword !== 'your-gmail-app-password') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });
      console.log('✅ Gmail email service configured successfully as fallback');
    } else {
      console.log('⚠️ Gmail credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
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
  async sendManagerCredentials(managerEmail, managerName, passwordResetLink, clubName, adminName = 'System Administrator') {
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
              <p><strong>Password Reset Link:</strong> ${passwordResetLink}</p>
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
            
            <p><strong>🌐 Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
            
            <a href="http://localhost:3000/login" class="button">Login to Dashboard</a>
            
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
Club: ${clubName}

🔐 Security Note: Please change your password after your first login.

⚽ Manager Capabilities:
• Add and manage coaches for your club
• Review and approve player registrations
• Manage your club's player roster
• Access club statistics and reports
• View match schedules and results

🌐 Login URL: http://localhost:3000/login

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
    console.log('Password:', password);
    console.log('---');
    console.log('To enable real email sending, configure either:');
    console.log('1. BREVO_API_KEY for Brevo email service (recommended)');
    console.log('2. EMAIL_USER and EMAIL_PASSWORD for Gmail SMTP');
    console.log('---');
    console.log('For now, here are the credentials that should have been sent:');
    console.log(`Email: ${managerEmail}`);
    console.log(`Password: ${password}`);
    console.log(`Club: ${clubName}`);
    
    return { 
      success: false, 
      message: 'No email service configured. Please set up email credentials. Credentials have been logged to console.',
      credentials: {
        email: managerEmail,
        password: password,
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
            
            <p><strong>🌐 Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
            
            <a href="http://localhost:3000/login" class="button">Login to Dashboard</a>
            
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
}

module.exports = EmailService; 