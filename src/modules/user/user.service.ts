import { emailTemplates, sendEmail } from "../../utils/email";
import { generateOTP } from "../../utils/helper";
import { generateTokenPair } from "../../utils/jwt";
import { logger } from "../../utils/logger";
import { Types } from "mongoose";
import { User } from "./user.model";

interface IUser {
    name: string;
    email: string;
    password: string;
    emailVerificationOTP?: string;
    emailVerificationOTPExpiry?: Date;
}


const userService = {
    // User registration
    register: async (input: IUser) => {
        const existingUser = await User.findOne({ email: input.email.toLowerCase() });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const otp = generateOTP(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const newUser = new User({
            name: input.name,
            email: input.email.toLowerCase(),
            password: input.password,
            emailVerificationOTP: otp,
            emailVerificationOTPExpiry: otpExpiry,
        });
        await newUser.save();
        // Send verification email (non-blocking)
        const template = emailTemplates.verification(newUser.name, otp);
        sendEmail({ to: newUser.email, ...template }).catch((err) =>
            logger.error(`Verification email failed: ${err}`),
        );

        return { user: newUser };
    },

    // User login
    login: async (input: IUser) => {
        const user = await User.findOne({ email: input.email.toLowerCase() });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        if (!user.isEmailVerified) {
            throw new Error('Email not verified. Please check your inbox.');
        }
        const isPasswordValid = await user.comparePassword(input.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        return user;
    },

    // Verify otp for email verification
    verifyEmail: async (email: string, otp: string) => {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.isEmailVerified) {
            throw new Error('Email already verified');
        }
        if (user.emailVerificationOTP !== otp) {
            throw new Error('Invalid OTP');
        }

        user.emailVerificationOTP = undefined;
        user.isEmailVerified = true;
        await user.save();
        const { accessToken, refreshToken } = generateTokenPair(user._id as Types.ObjectId, user.email);

        return { user: user, accessToken, refreshToken };
    }
};

export default userService;

