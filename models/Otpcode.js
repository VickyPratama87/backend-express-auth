import mongoose from 'mongoose';
const { Schema } = mongoose;

const otpcodeSchema = new Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	otp: {
		type: String,
		required: [true, 'Please provide a valid otp code'],
	},
	validUntil: {
		type: Date,
		required: true,
		expires: 300,
	},
});

const Otpcode = mongoose.model('Otpcode', otpcodeSchema);
export default Otpcode;
