import { AuthProviderConfig } from "../base/auth-provider";
import {
    DatabaseConnectionConfig,
    UserEntityProperties,
    UserEntityWithPasswordProperties,
} from "./";

export class BaseDatabaseProviderConfig extends AuthProviderConfig {
    connection: DatabaseConnectionConfig;
    properties: UserEntityProperties;
}

export class DatabaseProviderWithPasswordConfig extends AuthProviderConfig {
    connection: DatabaseConnectionConfig;
    properties: UserEntityWithPasswordProperties;
}
