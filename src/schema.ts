import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable('users', {
    email: text('email').unique(),
    // yes, the password is stored in plain text because it's not much of a deal to hash and salt it
    password: text('password'),
    username: text('username').unique(),
    uuid: text('uuid')
})

export const tokens = sqliteTable('tokens', {
    accessToken: text('accessToken'),
    clientToken: text('clientToken'),
    accountId: text('accountID'),
    // date will get converted to unix timestamp
    expiryDate: text('expiryDate')
})