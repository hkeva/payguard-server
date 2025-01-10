import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Error configuring transporter:", error);
  } else {
    console.log("Mail transporter is ready to send emails!");
  }
});

export default transporter;
