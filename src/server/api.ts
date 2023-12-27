import { remultExpress } from 'remult/remult-express';
import { createPostgresConnection } from 'remult/postgres';
import { User } from '../app/users/user';
import { SignInController } from '../app/users/SignInController';
import { UpdatePasswordController } from '../app/users/UpdatePasswordController';
import { config } from 'dotenv';
import { HomeController } from '../app/home/home.controller';
import { gql } from '../app/home/getGraphQL';
import { test } from '../app/attendance/attendance';
import { getTeenagers } from 'src/app/attendance/getTeenagers';
import { AttendanceForm } from '../app/attendance/AttendanceForm';
config(); //loads the configuration from the .env file

export const api = remultExpress({
  entities: [], //[User],
  controllers: [HomeController, AttendanceForm], // [SignInController, UpdatePasswordController],
  dataProvider: async () => {
    if (process.env['NODE_ENV'] === 'production' && false)
      return createPostgresConnection({ configuration: 'heroku' });
    return undefined;
  },
  initApi: async () => {
    try {
      await test();
    } catch (err) {
      console.log(err);
    }
  },
});

const createBoard = `#graphql
mutation{
  create_board(workspace_id:4200186,board_name:"בדיקה שלנועם",description:"test description",board_kind:public  ){
    id
  }
}`;
const createColumn = `#graphql
mutation {
  create_column (board_id: 5745936310, title: "תאריך פעילות",description:"123", column_type: date) {
    id
  }
}`;
