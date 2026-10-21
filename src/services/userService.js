import bcrypt from "bcryptjs";
import {
    createUser,
    getUserByEmail,
    getUserById,
    getUserByName,
    updateUser
} from "../repositories/userRepository.js";
import validationError from "../utils/errors/validationError.js";
import { createJWT } from "../utils/common/authUtils.js";


export const signUpService = async (data) => {
    try {
        const existingUser = await getUserByEmail(data.email);
        if (existingUser) {
            throw new validationError(
                { error: { email: "A user with this email already exists" } },
                "A user with this email already exists"
            );
        }

        const newUser = await createUser(data);
        return newUser;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

export const signInService = async (data) => {
    try {
        const user = await getUserByEmail(data.email);
        if (!user) {
            throw new validationError(
                { error: { email: "User not found" } },
                "User not found"
            );
        }

        const isPasswordValid = bcrypt.compareSync(data.password, user.password);
        if (!isPasswordValid) {
            throw new validationError(
                { error: { password: "Incorrect password" } },
                "Incorrect password"
            );
        }

        const token = createJWT({ id: user._id, email: user.email })

        // Never send the password hash back to the client.
        const safeUser = user.toObject();
        delete safeUser.password;

        return {token, user: safeUser};
    } catch (error) {
        console.error("Sign-in Error:", error);
        throw error;
    }
};

export const updateProfileService = async (userId, data = {}) => {
    try {
        const user = await getUserById(userId);
        if (!user) {
            throw new validationError(
                { error: { user: 'User not found' } },
                'User not found'
            );
        }

        const updates = {};

        if (data.username && data.username !== user.username) {
            const existing = await getUserByName(data.username);
            if (existing && String(existing._id) !== String(userId)) {
                throw new validationError(
                    { error: { username: 'Username is already taken' } },
                    'Username is already taken'
                );
            }
            updates.username = data.username;
            // Keep the generated avatar in sync with the new username.
            updates.avatar = `https://robohash.org/${data.username}`;
        }

        if (data.email && data.email !== user.email) {
            const existing = await getUserByEmail(data.email);
            if (existing && String(existing._id) !== String(userId)) {
                throw new validationError(
                    { error: { email: 'Email is already registered' } },
                    'Email is already registered'
                );
            }
            updates.email = data.email;
        }

        if (Object.keys(updates).length === 0) {
            const unchanged = user.toObject();
            delete unchanged.password;
            return unchanged;
        }

        // findByIdAndUpdate avoids the user schema's pre-save password hashing,
        // which would otherwise re-hash the already-hashed password.
        const updated = await updateUser(userId, updates);
        const safeUser = updated.toObject();
        delete safeUser.password;

        return safeUser;
    } catch (error) {
        console.error('Update profile error:', error?.message || error);
        throw error;
    }
};
