import { VerifyManager } from "@root/components/secure/VerifyManager";
import { SecureHelper } from "@root/utils";
import { Service } from "typedi";

@Service()
export class TokenManager {
    constructor(private verifyManager: VerifyManager) {}
    private token = SecureHelper.generateRandomToken(32);
    private encryptedToken: string;

    public getToken() {
        return this.token;
    }
    public getEncryptedToken() {
        this.encryptedToken ??= this.verifyManager.encryptToken(this.token);
        return this.encryptedToken;
    }
}
