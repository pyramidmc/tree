import express from 'express';
import * as os from 'node:os';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as fs from 'node:fs'
import {tokens, users} from "./schema";
import { randomUUID } from 'node:crypto';
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type {
    AuthenticatePayload,
    AuthenticateResponse,
    RefreshPayload,
    RefreshResponse,
    UserAccountRequest
} from "./types";
import {eq, getTableColumns, sql} from "drizzle-orm";
import * as randomstring from "randomstring";

export default class YggdrasilServer {
    constructor(port?: number) {
        const app = express();
        app.use(express.json())

        fs.mkdirSync(`${os.homedir()}/.pyramidmc/database/`, { recursive: true });
        const sqlite = new Database(`${os.homedir()}/.pyramidmc/database/tree.db`);
        const db: BetterSQLite3Database = drizzle(sqlite);
        migrate(db, { migrationsFolder: 'drizzle' });

        app.get('/', (req, res) => {
            res.send('Hello World!\nThis is the PyramidMC Yggdrasil server, codenamed "Tree".\nThe code can be hackable at https://github.com/pyramidmc/tree')
        })
        app.post('/api/createUserAndAccount', (req, res) => {
            const request = req.body as UserAccountRequest
            db
                .insert(users)
                .values({ ...request, uuid: randomUUID() })
                .execute()
                .then(() => res.send({ successful: true }))
                .catch((e) => res.send({ successful: false, message: e.toString() }))
        })
        app.post('/api/getUsers', async (req, res) => {
            const { username } = getTableColumns(users);
            const dbResponse = await db
                .select({ username })
                .from(users)
                .execute()
            
            res.send(dbResponse)
        })

        // from here begins the yggdrasil server source code!
        app.post('/auth/authenticate', async (req, res) => {
            const body = req.body as AuthenticatePayload
            if (body.agent.name !== 'Minecraft' || body.agent.version !== 1)
                return res.status(400).send({ successful: false, message: 'Game/Version not supported' })
            const query = await db
                .select()
                .from(users)
                .where(sql`${users.email} = ${body.username}`)
                .execute()
            if (query.length === 0)
                return res.status(400).send({ successful: false, message: 'User data not found!' })

            const clientToken = body.clientToken || randomstring.generate(128)
            const accessToken = randomstring.generate(128);
            const issuedDate = Math.floor(Date.now() / 1000);
            const expiryDate = issuedDate + 604800; // in 1 week
            await db
                .insert(tokens)
                .values({
                    expiryDate: expiryDate.toString(),
                    accessToken: accessToken,
                    clientToken: clientToken,
                    accountId: body.username
                })
                .execute()
            const response: AuthenticateResponse = {
                user: {
                    username: body.username,
                    properties: [
                        {
                            name: 'preferredLanguage',
                            value: 'en-us'
                        },
                        {
                            name: 'registrationCountry',
                            value: 'US'
                        }
                    ],
                    // idk man
                    id: randomstring.generate({ charset: "numeric", length: 5 })
                },
                clientToken: clientToken,
                accessToken: accessToken,
                availableProfiles: [
                    {
                        name: query[0].username!,
                        id: query[0].uuid!
                    }
                ],
                selectedProfile: {
                    name: query[0].username!,
                    id: query[0].uuid!
                }
            }

            res.send(response)
        })
        app.post('/auth/refresh', async (req, res) => {
            const body = req.body as RefreshPayload
            if (body.selectedProfile)
                return res.status(400).send({ successful: false, message: 'Selected profile passed!' })
            const query = await db
                .select()
                .from(tokens)
                .where(sql`${tokens.accessToken} = ${body.accessToken}`)
                .execute()
                .catch(e => { return void res.status(500).send({ successful: false, message: `on query: ${e}` }) })
            /*if (query[0].clientToken! === body.clientToken)
                return res.status(400).send({ successful: false, message: 'Client token is not the same as the one in the db!' })*/
            if (query!.length === 0)
                return res.status(400).send({ successful: false, message: 'Query to database lead to nothing!' })

            const clientToken = body.clientToken
            const accessToken = randomstring.generate(128);
            const issuedDate = Math.floor(Date.now() / 1000);
            const expiryDate = issuedDate + 604800;
            await db
                .insert(tokens)
                .values({
                    expiryDate: expiryDate.toString(),
                    accessToken: accessToken,
                    clientToken: clientToken,
                    accountId: query![0].accountId
                })
                .execute()
                .catch(e => { return res.status(500).send({ successful: false, message: `on creating entry: ${e}` }) })
            await db
                .delete(tokens)
                .where(eq(tokens.accessToken, body.accessToken))
                .execute()
                .catch(e => { return res.status(500).send({ successful: false, message: `on deletion: ${e}` }) })

            const userRequested = await db
                .select()
                .from(users)
                .where(sql`${users.email} = ${query![0].accountId}`)
                .execute()
                .catch(e => { return void res.status(500).send({ successful: false, message: `on user request: ${e}` }) })

            const response: RefreshResponse = {
                accessToken: accessToken,
                clientToken: body.clientToken,
                selectedProfile: {
                    id: userRequested![0].uuid!,
                    name: userRequested![0].username!
                }
            }
            res.send(response)
        })
        
        const selectedPort = port || 25500;
        app.listen(selectedPort, () => console.log(`Yggdrasil server started on port ${selectedPort}`))
    }
}
