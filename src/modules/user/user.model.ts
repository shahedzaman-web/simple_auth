import bcrypt from 'bcryptjs';
import mongoose, { Document, Model, Schema } from 'mongoose';


export interface IUser extends Document {
    name?: string;
    email: string;
    password: string;
    isEmailVerified: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
    emailVerificationOTP?: string;
    emailVerificationOTPExpiry?: Date;
}
const UserSchema: Schema<IUser> = new Schema<IUser>(
    {
        name: {
            required: true,
            type: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationOTP: {
            type: String,
        },
        emailVerificationOTPExpiry: {
            type: Date,
            select: false
        },
    },
    { timestamps: true },
);
UserSchema.pre<IUser>('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

UserSchema.methods.comparePassword = async function (
    candidatePassword: string,
): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
