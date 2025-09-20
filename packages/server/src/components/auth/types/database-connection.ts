import { AvailableDataBaseType } from "./avaliable-data-bases";

export interface DatabaseConnectionConfig {
    type: AvailableDataBaseType;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}
