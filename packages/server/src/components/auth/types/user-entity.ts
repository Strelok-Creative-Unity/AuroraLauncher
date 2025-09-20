export interface UserEntityProperties {
    tableName: string;
    uuidColumn: string;
    usernameColumn: string;
    accessTokenColumn: string;
    serverIdColumn: string;
}

export interface UserEntityWithPasswordProperties extends UserEntityProperties {
    passwordColumn: string;
}

export interface BaseUserEntity {
    username: string;
    userUUID: string;
    accessToken: string;
    serverID: string;
}

export interface UserEntityWithPassword extends BaseUserEntity {
    password: string;
}
