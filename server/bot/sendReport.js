'use strict';

const nodemailer = require('nodemailer');
var emailCredentials = {
  host: 'smtp.gmail.com',
  senderAddress: 'convocationofempyreans@gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: "convocationofempyreans@gmail.com",
    password: "Atron11235"
  },
  recievers: [ "Ashterothi@gmail.com", "convocationofempyreans@gmail.com" ]
}




function sendReport(text) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: emailCredentials.host,
      port: emailCredentials.port,
      secure: emailCredentials.secure, // true for 465, false for other ports
      auth: emailCredentials.auth
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: emailCredentials.senderAddress, // sender address
      to: emailCredentials.recievers, // list of receivers
      subject: 'FEDUP scheduled validation report for ' + new Date().toDateString(), // Subject line
      text: text // plain text body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
}


module.exports = sendReport;
