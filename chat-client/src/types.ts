export interface loginResponse {
    accessToken: string;
    responsePayload: {
        id: string;
        fullname: string;
        email: string;
    };
} 