import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
const { Schema } = mongoose;
import Randomstring from 'randomstring';
import Otpcode from './Otpcode.js';

const userSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Username is required'],
		minlength: [3, 'Username must be at least 3 characters long'],
	},
	email: {
		type: String,
		required: [true, 'Email is required'],
		validate: {
			validator: validator.isEmail,
			message: 'Invalid email',
		},
		unique: true,
	},
	password: {
		type: String,
		required: [true, 'Password is required'],
		minlength: [6, 'Password must be at least 6 characters long'],
	},
	role: {
		type: String,
		enum: ['user', 'admin'],
		default: 'user',
	},
	isVerified: {
		type: Boolean,
		default: false,
	},
	refreshToken: {
		type: String,
	},
	EmailVerifiedAt: {
		type: Date,
	},
});

userSchema.pre('save', async function () {
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (reqBody) {
	return await bcrypt.compare(reqBody, this.password);
};

userSchema.methods.generateOtpCode = async function () {
	const randomstring = Randomstring.generate({
		length: 6,
		charset: 'numeric',
	});

	let now = new Date();

	const otp = await Otpcode.findOneAndUpdate(
		{
			user: this._id,
		},
		{
			otp: randomstring,
			validUntil: now.setMinutes(now.getMinutes() + 5),
		},
		{
			new: true,
			upsert: true,
		}
	);

	return otp;
};

const User = mongoose.model('User', userSchema);
export default User;
