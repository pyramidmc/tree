export interface UserAccountRequest {
    email: string;
    password: string;
    username: string;
}

export interface AuthenticatePayload {
    agent: AuthenticatePayloadAgent;
    username: string;
    password: string;
    clientToken?: string;
    requestUser?: boolean;
}
type AuthenticatePayloadAgent = {
    name: 'Minecraft' | 'Scrolls';
    version: number;
}

export interface AuthenticateResponse {
    user: AuthenticateResponseUser;
    clientToken: string;
    accessToken: string;
    availableProfiles: AuthenticateResponseAvailableProfiles;
    selectedProfile: AuthenticateResponseSelectedProfile;
}
type AuthenticateResponseUser = {
    username: string;
    properties: [
        {
            name: 'preferredLanguage';
            value: string;
        },
        {
            name: 'registrationCountry';
            value: string;
        }
    ];
    id: string
}
type AuthenticateResponseAvailableProfiles = [
    {
        name: string;
        id: string;
    }
]
type AuthenticateResponseSelectedProfile = {
    name: string;
    id: string;
}

export interface RefreshPayload {
    accessToken: string;
    clientToken: string;
    // it's the same as that type, so to not reuse it:
    selectedProfile?: AuthenticateResponseSelectedProfile;
    requestUser?: boolean
}

export interface RefreshResponse {
    accessToken: string;
    clientToken: string;
    // it's the same as that type, so to not reuse it:
    selectedProfile: AuthenticateResponseSelectedProfile;
    // im lazy
    user?: {}
}