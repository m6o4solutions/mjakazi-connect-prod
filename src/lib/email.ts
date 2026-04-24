import { Resend } from "resend";

// single resend instance shared across all saas transactional emails
const resend = new Resend(process.env.RESEND_API_KEY);

// emails are sent from the verified m6o4 domain but replies route to
// the mjakazi connect support address for a clean user experience
const FROM_ADDRESS = "M6O4 Mailer <noreply@updates.m6o4solutions.com>";
const REPLY_TO = "hello@mjakaziconnect.co.ke";

// base html wrapper — inline styles used for maximum email client compatibility
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mjakazi Connect</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- header -->
          <tr>
            <td style="background-color:#18181b;border-radius:12px 12px 0 0;padding:24px 32px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Mjakazi Connect
              </p>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              ${content}
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="background-color:#f4f4f5;border-radius:0 0 12px 12px;padding:20px 32px;border:1px solid #e4e4e7;border-top:none;">
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
                This is an automated message from Mjakazi Connect. To get in touch,
                reply to this email or contact us at
                <a href="mailto:hello@mjakaziconnect.co.ke" style="color:#18181b;">hello@mjakaziconnect.co.ke</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// reusable block helpers — keeps template strings readable
const h1 = (text: string) =>
	`<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">${text}</h1>`;

const p = (text: string) =>
	`<p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">${text}</p>`;

const muted = (text: string) =>
	`<p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.5;">${text}</p>`;

const divider = () =>
	`<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />`;

const infoBox = (content: string) =>
	`<div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:16px;">${content}</div>`;

// --- email send functions ---

interface SendPaymentConfirmedParams {
	to: string;
	firstName: string;
	mpesaReceiptNumber: string;
	amount: number;
}

// sent to a mjakazi when their registration payment is confirmed and their
// profile enters the admin review queue
const sendPaymentConfirmedEmail = async ({
	to,
	firstName,
	mpesaReceiptNumber,
	amount,
}: SendPaymentConfirmedParams): Promise<void> => {
	const content = `
    ${h1("Payment Received")}
    ${p(`Hi ${firstName}, your registration payment has been received and your profile is now in the review queue.`)}
    ${divider()}
    ${infoBox(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Payment Details</p>
      <p style="margin:0 0 4px;font-size:14px;color:#18181b;"><strong>Amount:</strong> KSh ${amount.toLocaleString()}</p>
      <p style="margin:0;font-size:14px;color:#18181b;"><strong>M-Pesa Receipt:</strong> ${mpesaReceiptNumber}</p>
    `)}
    ${p("Our team will review your documents and verify your profile. You will receive another email once the review is complete.")}
    ${muted("This usually takes 1–2 business days.")}
  `;

	await resend.emails.send({
		from: FROM_ADDRESS,
		replyTo: REPLY_TO,
		to,
		subject: "Payment received — your profile is under review",
		html: baseTemplate(content),
	});
};

interface SendVerificationRejectedParams {
	to: string;
	firstName: string;
	rejectionReason: string;
	attemptsRemaining: number;
}

// sent to a mjakazi when an admin rejects their verification submission —
// includes the rejection reason so they know exactly what to correct
const sendVerificationRejectedEmail = async ({
	to,
	firstName,
	rejectionReason,
	attemptsRemaining,
}: SendVerificationRejectedParams): Promise<void> => {
	const content = `
    ${h1("Verification Unsuccessful")}
    ${p(`Hi ${firstName}, your verification submission has been reviewed and unfortunately could not be approved at this time.`)}
    ${divider()}
    ${infoBox(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Reason for Rejection</p>
      <p style="margin:0;font-size:14px;color:#18181b;line-height:1.6;">${rejectionReason}</p>
    `)}
    ${
			attemptsRemaining > 0
				? p(
						`You have <strong>${attemptsRemaining} resubmission${attemptsRemaining === 1 ? "" : "s"}</strong> remaining. Please log in, address the issue above, and resubmit your documents.`,
					)
				: `<p style="margin:0 0 16px;font-size:15px;color:#dc2626;line-height:1.6;">You have no resubmission attempts remaining. Please contact support at <a href="mailto:hello@mjakaziconnect.co.ke" style="color:#18181b;">hello@mjakaziconnect.co.ke</a> for assistance.</p>`
		}
    ${muted("Log in to your dashboard to view the full details and take action.")}
  `;

	await resend.emails.send({
		from: FROM_ADDRESS,
		replyTo: REPLY_TO,
		to,
		subject: "Action required — verification submission unsuccessful",
		html: baseTemplate(content),
	});
};

interface SendSubscriptionActivatedParams {
	to: string;
	firstName: string;
	tierName: string;
	endDate: string;
	mpesaReceiptNumber: string;
	amount: number;
}

// sent to a mwajiri when their subscription payment is confirmed and their
// account is activated — confirms access and shows the expiry date
const sendSubscriptionActivatedEmail = async ({
	to,
	firstName,
	tierName,
	endDate,
	mpesaReceiptNumber,
	amount,
}: SendSubscriptionActivatedParams): Promise<void> => {
	const formattedEndDate = new Date(endDate).toLocaleDateString("en-KE", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

	const content = `
    ${h1("Subscription Activated")}
    ${p(`Hi ${firstName}, your ${tierName} subscription is now active. You can browse and connect with verified Wajakazi on Mjakazi Connect.`)}
    ${divider()}
    ${infoBox(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Subscription Details</p>
      <p style="margin:0 0 4px;font-size:14px;color:#18181b;"><strong>Plan:</strong> ${tierName}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#18181b;"><strong>Amount Paid:</strong> KSh ${amount.toLocaleString()}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#18181b;"><strong>M-Pesa Receipt:</strong> ${mpesaReceiptNumber}</p>
      <p style="margin:0;font-size:14px;color:#18181b;"><strong>Access Until:</strong> ${formattedEndDate}</p>
    `)}
    ${p("Log in to your dashboard to start browsing verified domestic workers.")}
    ${muted("You will need to renew your subscription before it expires to maintain uninterrupted access.")}
  `;

	await resend.emails.send({
		from: FROM_ADDRESS,
		replyTo: REPLY_TO,
		to,
		subject: `Your ${tierName} subscription is active`,
		html: baseTemplate(content),
	});
};

export {
	sendPaymentConfirmedEmail,
	sendSubscriptionActivatedEmail,
	sendVerificationRejectedEmail,
};
