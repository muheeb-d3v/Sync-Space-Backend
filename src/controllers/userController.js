import { StatusCodes } from "http-status-codes";
import { signUpService, signInService, updateProfileService } from "../services/userService.js";
import { customErrorResponse,  successResponse } from "../utils/common/responseObjects.js";

export const signUp = async (req, res) => {
    try {
        const user = await signUpService(req.body);
        return res.status(StatusCodes.CREATED).json(successResponse(user, "User created successfully"));
    } catch (error) {
        console.log('User Controller Error:', error);
        return res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};

export const signIn = async (req, res) => {
    try {
        const {token ,user} = await signInService(req.body);
       
        // TODO: Implement JWT token generation and send it to the client instead of the token itself
        return res.status(StatusCodes.OK).json(successResponse({ token , user  }, "User signed in successfully"));
    } catch (error) {
        console.log('User Controller Error:', error);
        return res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await updateProfileService(req.user.id, req.body);
        return res
            .status(StatusCodes.OK)
            .json(successResponse(user, 'Profile updated successfully'));
    } catch (error) {
        console.log('Update Profile Error:', error?.message || error);
        return res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};

