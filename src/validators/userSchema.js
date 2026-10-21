import { z } from "zod";

export const userSignupSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(3, { message: "Password must be at least 3 characters long" }),
    username: z.string().min(2, { message: "Username must be at least 2 characters long" }),
    avatar: z.string().optional(),
});

export const userSigninSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(3, { message: "Password must be at least 3 characters long" }),
});

export const userUpdateSchema = z
    .object({
        username: z
            .string()
            .min(2, { message: 'Username must be at least 2 characters long' })
            .regex(/^[a-zA-Z0-9]+$/, { message: 'Username must be alphanumeric' })
            .optional(),
        email: z.string().email({ message: 'Invalid email format' }).optional()
    })
    .refine((data) => data.username !== undefined || data.email !== undefined, {
        message: 'No update data provided'
    });





