import { sendCreated } from "../../utils/apiResponse";
import userService from "./user.service";
import { Request, Response } from 'express';
import { generateTokenPair } from "../../utils/jwt";
import { Types } from "mongoose";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const userController = {
    register: async (req: Request, res: Response) => {
        const result = await userService.register(req.body);

        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
        return sendCreated(res, 'Registration successful. Please verify your email.', {
            user: result.user,
            accessToken: result.accessToken,
        });
    },
    login: async (req: Request, res: Response) => {
        const user = await userService.login(req.body);
        const { accessToken, refreshToken } = generateTokenPair(user._id as Types.ObjectId, user.email);
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        return sendCreated(res, 'Login successful.', { user, accessToken });
    },
    verifyEmail: async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        const result = await userService.verifyEmail(email, otp);
        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
        return sendCreated(res, 'Email verified successfully.', {
            user: result.user,
            accessToken: result.accessToken,
        });
    }
};

export default userController;
