const nodemailer = require("nodemailer");
const path = require("path");
const sendEmail = async (options) => {
  const { default: hbs } = await import("nodemailer-express-handlebars");
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  transporter.use(
    "compile",
    hbs({
      viewEngine: {
        extname: ".hbs",
        partialsDir: path.resolve("./views"),
        defaultLayout: false,
      },
      viewPath: path.resolve("./views"),
      extName: ".hbs",
    })
  );

  // 2) Define the email options
  const mailOptions = {
    from: "LMS Teams <hello@lms.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    template: options.template,
    context: options.context,
  };

  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
