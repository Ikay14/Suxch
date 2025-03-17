import { User } from "src/modules/user/schema/user.schema";

export function generateResponsePayload(user: User) {
    return {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        avatar: user.avatar
    };
}