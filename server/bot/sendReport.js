'use strict';

const nodemailer = require('nodemailer');


function sendReport(text) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "fedupbot@gmail.com", // generated ethereal user
        pass: "dfg49v2@qkzZs"  // generated ethereal password
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: 'fedupbot@gmail.com', // sender address
      to: 'Ashterothi@gmail.com, cvtate83@gmail.com, joel.trauger@gmail.com', // list of receivers
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