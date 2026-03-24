import { EmailNotification, NotificationType } from '../types';

// Simulated email service - In production, integrate with actual email service
export class EmailService {
  private static notifications: EmailNotification[] = [];

  static generateSecurePassword(length: number = 12): string {
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

  static async sendManagerCredentials(
    email: string, 
    password: string, 
    clubName: string,
    adminName: string = 'System Administrator'
  ): Promise<boolean> {
    // For testing, always send to the specified email
    const testEmail = 'justinsony2000@gmail.com';
    const actualEmail = email;
    
    const subject = `🎯 Welcome to NGL - Manager Account Created for ${clubName}`;
    const body = `
Dear Manager,

🎉 Welcome to the National Gaming League (NGL) management system!

Your manager account has been created by ${adminName} for ${clubName}. 

📧 **Login Credentials:**
Email: ${actualEmail}
Password: ${password}
Club: ${clubName}

🔐 **Security Note:** Please change your password after your first login.

⚽ **Manager Capabilities:**
• Add and manage coaches for your club
• Review and approve player registrations  
• Manage your club's player roster
• Access club statistics and reports
• View match schedules and results

🌐 **Login URL:** ${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/login

If you have any questions, please contact the system administrator.

Best regards,
NGL Administration Team
    `.trim();

    return this.sendEmail(testEmail, subject, body, 'account_created');
  }

  static async sendCoachCredentials(
    email: string, 
    password: string, 
    clubName: string,
    managerName: string
  ): Promise<boolean> {
    // For testing, always send to the specified email
    const testEmail = 'justinsony2000@gmail.com';
    const actualEmail = email;
    
    const subject = `⚽ Welcome to NGL - Coach Account Created for ${clubName}`;
    const body = `
Dear Coach,

🎉 Welcome to the National Gaming League (NGL) management system!

Your coach account has been created by ${managerName} for ${clubName}.

📧 **Login Credentials:**
Email: ${actualEmail}
Password: ${password}
Club: ${clubName}

🔐 **Security Note:** Please change your password after your first login.

⚽ **Coach Capabilities:**
• View and manage players assigned to you
• Access training schedules and match information
• Update player statistics and performance data
• Communicate with club management
• View team analytics and reports

🌐 **Login URL:** ${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/login

If you have any questions, please contact your club manager or the system administrator.

Best regards,
NGL Administration Team
    `.trim();

    return this.sendEmail(testEmail, subject, body, 'account_created');
  }

  static async sendPlayerApprovalNotification(
    email: string, 
    playerName: string, 
    clubName: string,
    loginCredentials?: { email: string; password: string }
  ): Promise<boolean> {
    // For testing, always send to the specified email
    const testEmail = 'justinsony2000@gmail.com';
    const actualEmail = email;
    
    const subject = `✅ Registration Approved - Welcome to ${clubName}!`;
    
    let body = `
Dear ${playerName},

🎉 Congratulations! Your registration with ${clubName} has been approved.

You are now officially part of the National Gaming League (NGL) and ${clubName}.
    `.trim();

    if (loginCredentials) {
      body += `

📧 **Player Account Created:**
Email: ${actualEmail}
Password: ${loginCredentials.password}

🔐 **Security Note:** Please change your password after your first login.

⚽ **Player Dashboard Features:**
• View your profile and statistics
• Access club information and schedules
• Update your personal information
• View match results and league standings

🌐 **Login URL:** ${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/login
      `.trim();
    }

    body += `

Welcome to the team! 🏆

Best regards,
${clubName} Management
NGL Administration Team
    `.trim();

    return this.sendEmail(testEmail, subject, body, 'registration_approved');
  }

  static async sendPlayerRejectionNotification(
    email: string, 
    playerName: string, 
    clubName: string,
    reason: string
  ): Promise<boolean> {
    // For testing, always send to the specified email
    const testEmail = 'justinsony2000@gmail.com';
    const actualEmail = email;
    
    const subject = `❌ Registration Update - ${clubName}`;
    const body = `
Dear ${playerName},

Thank you for your interest in joining ${clubName} and the National Gaming League (NGL).

After careful review, we regret to inform you that your registration has not been approved at this time.

📋 **Reason:** ${reason}

We encourage you to address any concerns and consider reapplying in the future. If you have any questions about this decision, please contact the club management.

Thank you for your understanding.

Best regards,
${clubName} Management
NGL Administration Team
    `.trim();

    return this.sendEmail(testEmail, subject, body, 'registration_rejected');
  }

  static async sendScoutInvitation(
    email: string,
    playerName: string,
    clubName: string,
    customMessage?: string,
    trainingDate?: string,
    trainingLocation?: string
  ): Promise<boolean> {
    // For testing, always send to the specified email
    const testEmail = 'justinsony2000@gmail.com';
    const actualEmail = email;

    const subject = `🏃 Training Invitation - ${clubName} is interested in you!`;
    const body = `
Dear ${playerName},

We have been following your progress through our AI Scouting Network, and we are impressed with your performance and potential.

${clubName} would like to formally invite you to a trial training session to see your skills in action and discuss a potential future with our squad.

${trainingDate || trainingLocation ? `
📍 **Training Logistics:**
${trainingDate ? `• Date: ${trainingDate}` : ''}
${trainingLocation ? `• Location: ${trainingLocation}` : ''}
` : ''}

${customMessage ? `\n📝 **Message from the Manager:**\n${customMessage}\n` : ''}

📅 **Next Steps:**
Please reply to this email or contact our club office to confirm your attendance.

We look forward to meeting you on the pitch!

Best regards,
${clubName} Management
NGL Scouting Advisor
    `.trim();

    return this.sendEmail(testEmail, subject, body, 'registration_approved');
  }

  private static async sendEmail(
    to: string, 
    subject: string, 
    body: string, 
    type: NotificationType,
    userId?: number
  ): Promise<boolean> {
    try {
      // In a real application, this would integrate with an email service like SendGrid, AWS SES, etc.
      console.log('📧 Email sent:', { to, subject, type });
      console.log('📧 Email body:', body);
      
      // Store notification for tracking
      const notification: EmailNotification = {
        id: Date.now() + Math.random(),
        to,
        subject,
        body,
        type,
        sentAt: new Date().toISOString(),
        userId
      };
      
      this.notifications.push(notification);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  static getNotifications(): EmailNotification[] {
    return [...this.notifications];
  }

  static getNotificationsByUser(userId: number): EmailNotification[] {
    return this.notifications.filter(n => n.userId === userId);
  }
}
