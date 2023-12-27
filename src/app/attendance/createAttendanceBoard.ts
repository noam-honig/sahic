import { gql } from '../home/getGraphQL';
import {
  TeenagersResult,
  updateAttendanceBoardIdToDescription,
} from './getTeenagers';

export async function getAttendanceBoard(r: TeenagersResult) {
  if (!r.attendance) {
    r.attendance = await createAttendanceBoard(r);
  }
  const columns: Column[] = (
    await gql(
      `#graphql
query($board:ID!){
  boards(ids:[$board]){
    columns{
      id
      title
      type
    }
  }
}

  `,
      {
        board: +r.attendance,
      }
    )
  ).boards[0].columns;

  await verifyColumn('date', 'תאריך הפעילות', 'date');
  await verifyColumn('hours', 'שעות הפעילות', 'numbers');
  await verifyColumn('type', 'סוג הפעילות', 'text');
  for (const item of r.items) {
    await verifyColumn('t' + item.id, item.name, 'checkbox');
  }

  return columns;

  async function verifyColumn(
    id: string,
    title: string,
    column_type: 'date' | 'checkbox' | 'text' | 'numbers'
  ) {
    if (!columns.find((x) => x.id == id)) {
      columns.push(
        (
          await gql(
            `#graphql
  mutation ($board: ID!,$id:String!,$title:String!,$column_type:ColumnType!) {
    create_column(
      board_id: $board
      id: $id
      title: $title
      column_type: $column_type
    ) {
      id
      title
      type
    }
  }
  `,
            {
              board: +r.attendance!,
              id,
              title,
              column_type,
            }
          )
        ).create_column
      );
    }
  }
}

export async function createAttendanceBoard(r: TeenagersResult) {
  const board: { create_board: { id: number } } = await gql(
    `#graphql
mutation ($name:String!){
  create_board(workspace_id:4200186,board_name:$name,  board_kind:public,empty:true  ){
    id
  }
}`,
    {
      name: r.name + ' נוכחות',
    }
  );
  r.attendance = board.create_board.id.toString();
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
      board: r.id,
      description: updateAttendanceBoardIdToDescription(
        r.description!,
        board.create_board.id
      ),
    }
  );
  return r.attendance;
}
interface Column {
  id: string;
  title: string;
  type: string;
}
