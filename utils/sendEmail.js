import nodemailer from 'nodemailer';
import mailerConfig from './mailerConfig.js';

const sendEmail = async ({ to, subject, html }) => {
	const transporter = nodemailer.createTransport(mailerConfig);

	return transporter.sendMail({
		from: '"Vicode" <admin@gmail.com>',
		to,
		subject,
		html,
	});
};

export default sendEmail;
