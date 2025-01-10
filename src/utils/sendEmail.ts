import transporter from "@/config/mailConfig";

interface EmailOptions {
  to: string;
  type: string;
  title: string;
  status: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const { to, type, title, status } = options;

  try {
    if (!to || !type || !title || !status) {
      throw new Error("Missing required fields: to, type, title, or status");
    }

    const subject = `${type} Status Update: ${title}`;

    let statusColor = "#2196F3";
    if (status === "approved") {
      statusColor = "#4CAF50";
    } else if (status === "rejected") {
      statusColor = "#F44336";
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: ${statusColor};">${type} Status Update</h2>
        <p>Hello,</p>
        <p>The status of your <strong>${type}</strong> titled <strong>"${title}"</strong> has been changed to:</p>
        <h3 style="color: ${statusColor};">${status}</h3>
        <p>If you have any questions, feel free to contact us.</p>
        <br />
        <p>Best regards,</p>
        <p>Your Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
