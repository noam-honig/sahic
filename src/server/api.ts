import { remultExpress } from 'remult/remult-express';
import { createPostgresConnection } from 'remult/postgres';
import { User } from '../app/users/user';
import { SignInController } from '../app/users/SignInController';
import { UpdatePasswordController } from '../app/users/UpdatePasswordController';
import { config } from 'dotenv';
import { HomeController } from '../app/home/home.controller';
config(); //loads the configuration from the .env file

export const api = remultExpress({
    entities: [],//[User],
    controllers: [HomeController],  // [SignInController, UpdatePasswordController],
    dataProvider: async () => {
        if (process.env['NODE_ENV'] === "production"&&false)
            return createPostgresConnection({ configuration: "heroku" })
        return undefined;
    }
});