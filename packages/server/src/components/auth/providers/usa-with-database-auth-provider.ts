import { randomUUID } from "crypto";

import { AuthResponseData } from "@aurora-launcher-arsland-team/core";
import { LauncherServerConfig } from "@root/components/config/utils/LauncherServerConfig";
import { LogHelper } from "@root/utils";
import { DataSource, EntitySchema, In } from "typeorm";
import { v5 } from "uuid";

import { SkinManager } from "../../skin/SkinManager";
import {
    AuthProvider,
    HasJoinedResponseData,
    ProfileResponseData,
    ProfilesResponseData,
} from "../base";
import { BaseDatabaseProviderConfig, BaseUserEntity, UserEntityProperties } from "../types";

interface USAWithDatabaseAuthResponse {
    login: string;
}

export class USAWithDatabaseAuthProvider implements AuthProvider {
    private userRepository;
    private skinManager: SkinManager;
    private authServerUrl: string;
    private projectID: string;

    constructor({ auth, projectID }: LauncherServerConfig, skinManager: SkinManager) {
        const authConfig = <USAWithDatabaseAuthProviderConfig>auth;
        this.skinManager = skinManager;
        this.authServerUrl = authConfig.authServerUrl;
        this.projectID = projectID;

        if (!this.authServerUrl) {
            LogHelper.fatal("authServerUrl not defined in USAWithDatabaseAuthProvider config");
        }

        if (!authConfig.properties) {
            LogHelper.fatal("properties not defined in USAWithDatabaseAuthProvider config");
        }

        if (!authConfig.properties.tableName) {
            LogHelper.fatal("tableName not defined in USAWithDatabaseAuthProvider config");
        }

        if (!authConfig.connection) {
            LogHelper.fatal("connection not defined in USAWithDatabaseAuthProvider config");
        }

        try {
            const UserEntity = getUserEntity(authConfig.properties);

            const connection = new DataSource({
                ...authConfig.connection,
                entities: [UserEntity],
            });

            connection
                .initialize()
                .then(() => {
                    LogHelper.info("Database connection initialized successfully");
                })
                .catch((error) => {
                    LogHelper.error("Failed to initialize database connection:", error);
                    LogHelper.error(
                        "Please check your database configuration and ensure the database server is running",
                    );
                    LogHelper.fatal("Database connection failed");
                });

            this.userRepository = connection.getRepository(UserEntity);
        } catch (error) {
            LogHelper.error("Failed to create USAWithDatabaseAuthProvider:", error);
            LogHelper.fatal("USAWithDatabaseAuthProvider initialization failed");
        }
    }

    async auth(username: string, password: string): Promise<AuthResponseData> {
        try {
            // В USA будет реализован после рефакторинга -Ka (Спроси Strelk'а)
            const response = await fetch(`${this.authServerUrl}/api/auth/isMe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    login: username,
                    password: password,
                }),
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }

            const authData: USAWithDatabaseAuthResponse = await response.json();

            if (!authData.login) {
                throw new Error("Invalid response from auth server");
            }

            let user = await this.userRepository.findOneBy({ username: authData.login });

            // Создать пользователя если он не существует в БД для майнкрафта
            if (!user) {
                const userUUID = v5(authData.login, this.projectID);
                user = {
                    username: authData.login,
                    userUUID: userUUID,
                    accessToken: randomUUID(),
                    serverID: null,
                };
                await this.userRepository.save(user);
            } else {
                user.accessToken = randomUUID();
                await this.userRepository.save(user);
            }

            const userData = {
                username: user.username,
                userUUID: user.userUUID,
                skinUrl: this.skinManager.getSkin(user.userUUID, user.username),
                capeUrl: this.skinManager.getCape(user.userUUID, user.username),
                accessToken: user.accessToken,
                token: user.accessToken,
            };

            return userData;
        } catch (error) {
            LogHelper.error(`USAWithDatabase authentication failed for user ${username}:`, error);
            throw new Error("Authentication failed");
        }
    }

    async join(accessToken: string, userUUID: string, serverID: string): Promise<boolean> {
        const user = await this.userRepository.findOneBy({
            accessToken,
            userUUID,
        });
        if (!user) return false;

        user.serverID = serverID;
        await this.userRepository.save(user);

        return true;
    }

    async hasJoined(username: string, serverID: string): Promise<HasJoinedResponseData> {
        const user = await this.userRepository.findOneBy({ username });
        if (!user) throw new Error("User not found");
        if (user.serverID !== serverID) {
            throw new Error("Invalid serverId");
        }

        return {
            userUUID: user.userUUID,
            skinUrl: this.skinManager.getSkin(user.userUUID, username),
            capeUrl: this.skinManager.getCape(user.userUUID, username),
        };
    }

    async profile(userUUID: string): Promise<ProfileResponseData> {
        const user = await this.userRepository.findOneBy({ userUUID });
        if (!user) throw new Error("User not found");

        return {
            username: user.username,
            skinUrl: this.skinManager.getSkin(userUUID, user.username),
            capeUrl: this.skinManager.getCape(userUUID, user.username),
        };
    }

    async profiles(usernames: string[]): Promise<ProfilesResponseData[]> {
        return [...(await this.userRepository.findBy({ username: In(usernames) }))].map((user) => ({
            id: user.userUUID,
            name: user.username,
        }));
    }
}

const getUserEntity = (properties: UserEntityProperties) => {
    return new EntitySchema<BaseUserEntity>({
        name: "user",
        tableName: properties.tableName,
        columns: {
            username: {
                type: String,
                unique: true,
                name: properties.usernameColumn,
            },
            userUUID: {
                type: String,
                unique: true,
                primary: true,
                generated: "uuid",
                name: properties.uuidColumn,
            },
            accessToken: {
                type: String,
                name: properties.accessTokenColumn,
            },
            serverID: {
                type: String,
                name: properties.serverIdColumn,
            },
        },
    });
};

export class USAWithDatabaseAuthProviderConfig extends BaseDatabaseProviderConfig {
    authServerUrl: string;
}
