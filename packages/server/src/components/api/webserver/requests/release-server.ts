import { writeFileSync } from "fs";
import { resolve } from "path";

import multipart from "@fastify/multipart";
import { VerifyManager } from "@root/components/secure/VerifyManager";
import { StorageHelper } from "@root/utils/helpers/StorageHelper";
import { FastifyInstance } from "fastify";

import { TokenManager } from "../../utils/token";

interface Options {
    verifyManager: VerifyManager;
    tokenManager: TokenManager;
}

interface IQuerystring {
    encryptedToken: string;
}

async function relaseServerRoutes(fastify: FastifyInstance, opts: Options) {
    fastify.register(multipart);

    fastify.get("/release/get_token", async (req, reply) => {
        reply.send({ token: opts.tokenManager.getEncryptedToken() });
    });

    fastify.post<{ Querystring: IQuerystring }>("/release/upload", async (req, reply) => {
        const decryptedToken = opts.verifyManager.decryptToken(req.query.encryptedToken);
        if (decryptedToken == opts.tokenManager.getToken()) {
            const data = await req.file({ limits: { fileSize: 314572800 } }); // 300MB
            writeFileSync(resolve(StorageHelper.releaseDir, data.fieldname), await data.toBuffer());
            reply.status(200);
        } else reply.status(500).send("Invalid token");
    });
}

export default relaseServerRoutes;
