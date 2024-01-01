import { gql } from '../home/getGraphQL';
import {
  TeenagersResult,
  updateAttendanceBoardIdToDescription,
} from './getTeenagers';

export async function createAttendanceBoard(
  mainBoard: TeenagersResult,
  boardName: string,
  keyInDescription: string
) {
  const board: { create_board: { id: number } } = await gql(
    `#graphql
mutation ($name:String!,$description:String!){
  create_board(workspace_id:4200186,board_name:$name, description:$description,  board_kind:share,empty:true  ){
    id
  }
}`,
    {
      name: boardName + ' נוכחות',
      description: `מבוסס על ${mainBoard.name} ${mainBoard.id}`,
    }
  );
  const result = board.create_board.id.toString();
  mainBoard.description = updateAttendanceBoardIdToDescription(
    mainBoard.description!,
    +result,
    keyInDescription
  );
  await gql(
    `#graphql
mutation ($board: ID!, $description: String!) {
  update_board(
    board_id: $board
    board_attribute: description
    new_value: $description
  ) 
}`,
    {
      board: mainBoard.id,
      description: mainBoard.description,
    }
  );
  return result;
}
