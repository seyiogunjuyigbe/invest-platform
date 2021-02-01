const sgMail = require('@sendgrid/mail');
const { SENDGRID_API_KEY, MAIL_SENDER } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

// Send email
module.exports = {
    async sendMail(subject, to, body, link, linkText) {
        const mailOptions = {
            to,
            from: `Black Gold <${MAIL_SENDER}>`,
            subject,
            html: `${body} ${link ? `<a href="${link}">${linkText}</a>` : ""}`,
            // TODO: Create email template
        };
        try {
            const m = await sgMail.send(mailOptions);
            return m;
        } catch (err) {

            throw new Error(err);
        }
    },
};

