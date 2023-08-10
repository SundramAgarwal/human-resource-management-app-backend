const asyncHandler = require("express-async-handler");
const Admin = require("../models/adminModel");
const sendEmail = require("../utils/sendEmail");
const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API)


const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    res.status(404);
    throw new Error("admin not found please signUp!");
  }

  //validation
  if (!subject || !message) {
    res.status(404);
    throw new Error("please add subject or message!");
  }

  const send_to = process.env.EMAIL_ADMIN;
  const sent_from = process.env.EMAIL_ADMIN;
  const reply_to = admin.email;
  try {
    await sendEmail(subject, message, send_to, sent_from, reply_to);
    res.status(200).json({
      success: true,
      message: "Email Sent",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent,please try again");
  }

  // const mess = {
  //   to: process.env.EMAIL_ADMIN2,
  //   from: process.env.EMAIL_ADMIN2,
  //   subject: `${subject}`,
  //   reply: admin.email,
  //   html: `${message}`,
  // }
  // sgMail.send(mess)
  // .then(res.status(200).json({
  //   success :true,
  //   message: "Message Sent"
  // }))
  // .catch((error) => console.log(error.message))
});

module.exports = {
  contactUs,
};
