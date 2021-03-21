const {
  SENDGRID_API_KEY,
  MAIL_SENDER,
  TWILIO_AUTH_TOKEN,
  TWILIO_SENDER_NUMBER,
  TWILIO_ACCOUNT_SID,
} = process.env;

const sgMail = require('@sendgrid/mail');
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

sgMail.setApiKey(SENDGRID_API_KEY);

// Send email
module.exports = {
  async sendMail(subject, to, body, link, linkText) {
    const mailOptions = {
      to,
      from: `Black Gold <${MAIL_SENDER}>`,
      subject,
      html: `${body} ${link ? `<a href="${link}">${linkText}</a>` : ''}`,
      // TODO: Create email template
    };
    try {
      const m = await sgMail.send(mailOptions);
      return m;
    } catch (err) {
      throw new Error(err);
    }
  },
  async sendSMS(to, message) {
    try {
      const sms = await client.messages.create({
        body: message,
        from: TWILIO_SENDER_NUMBER,
        to,
      });
      console.log({ sms });
      if (sms) {
        return { success: true, error: null };
      }
      return { success: false, error: 'an error occured, sms not sent' };
    } catch (error) {
      console.log({ error });
      return { success: false, error };
    }
  },
};
