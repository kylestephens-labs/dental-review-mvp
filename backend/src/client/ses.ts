import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
}

class SESClientWrapper {
  private client: SESClient;
  private fromEmail: string;

  constructor() {
    // For testing, allow fallback values
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'test-key';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'test-secret';
    const fromEmail = process.env.SES_FROM_EMAIL || 'test@example.com';

    this.client = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.fromEmail = fromEmail;
  }

  async sendMagicLinkEmail(
    to: string,
    practiceName: string,
    magicLink: string
  ): Promise<EmailSendResult> {
    if (!to || !to.includes('@')) {
      return {
        success: false,
        error: 'Invalid email address',
        retryable: false
      };
    }

    const subject = `Your 2-minute onboarding link for ${practiceName}`;
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Complete Your Onboarding</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">Welcome to Dental Review Engine!</h2>
          <p>Hello ${practiceName} Owner,</p>
          <p>Thank you for choosing Dental Review Engine! To complete your 2-minute onboarding, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Onboarding</a>
          </div>
          <p><strong>Important:</strong> This link is valid for 7 days and can only be used once.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Best regards,<br>
            The Dental Review Engine Team
          </p>
        </div>
      </body>
      </html>
    `;

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
        },
      },
      Source: this.fromEmail,
    });

    try {
      const response = await this.client.send(command);
      console.log(`Magic link email sent successfully. MessageId: ${response.MessageId}`);
      return {
        success: true,
        messageId: response.MessageId,
        retryable: false
      };
    } catch (error: any) {
      console.error('Error sending magic link email:', error);
      
      // Classify AWS errors for retry logic
      let retryable = false;
      let errorMessage = error.message || 'Unknown error';
      
      if (error.name === 'ThrottlingException') {
        retryable = true;
        errorMessage = 'Rate limit exceeded, please retry later';
      } else if (error.name === 'ServiceUnavailableException') {
        retryable = true;
        errorMessage = 'Service temporarily unavailable';
      } else if (error.name === 'SendingQuotaExceededException') {
        retryable = true;
        errorMessage = 'Sending quota exceeded';
      } else if (error.name === 'MailFromDomainNotVerifiedException') {
        retryable = false;
        errorMessage = 'Sender email domain not verified';
      } else if (error.name === 'MessageRejected') {
        retryable = false;
        errorMessage = 'Email rejected by recipient server';
      }
      
      return {
        success: false,
        error: errorMessage,
        retryable: retryable
      };
    }
  }
}

export const sesClient = new SESClientWrapper();