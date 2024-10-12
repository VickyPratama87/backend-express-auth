import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { authRoutes, userRoutes } from './routes/index.js';
import { errorHandler, notFoundPath } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use(authRoutes);
app.use(userRoutes);

app.use(errorHandler);
app.use(notFoundPath);

// Connect to MongoDB
try {
	await mongoose.connect(process.env.DATABASE);
	console.log('Connected to MongoDB');
} catch (error) {
	console.log('Error connecting to MongoDB');
}

app.listen(port, () => {
	console.log(`Server up and running on ${port}`);
});
