import { DataControl } from '@remult/angular/interfaces';
import {
  BackendMethod,
  Controller,
  ControllerBase,
  Fields,
  Validators,
} from 'remult';
import {
  ATTENDANCE_BOARD_KEY,
  VOLUNTEER_ATTENDANCE_BOARD_KEY,
  getTeenagers,
} from './getTeenagers';
import { createAttendanceBoard } from './createAttendanceBoard';
import { gql } from '../home/getGraphQL';

@Controller('attendance')
export class AttendanceForm extends ControllerBase {
  @Fields.string({ caption: 'ממלא הטופס', validate: Validators.required })
  name = '';
  @Fields.string({
    caption: 'תאריך הפעילות',
    inputType: 'date',
    validate: [
      Validators.required,
      (_, y) => {
        if (
          y.value < '2023' ||
          y.value > (new Date().getFullYear() + 1).toString()
        )
          throw 'ערך לא תקין';
      },
    ],
  })
  date = new Date().toISOString().split('T')[0];
  @Fields.number({
    caption: 'שעות פעילות',
    validate: (_, r) => {
      if (Number(r.value) < 1 || Number(r.value) > 100) throw 'ערך לא תקין';
    },
  })
  hours = 0;
  @Fields.string({ caption: 'סוג פעילות', validate: Validators.required })
  @DataControl({
    valueList: [
      'חלוקה',
      'איסופים',
      'תוכן',
      'פעילות מרוכזת אזורית/ארצית',
      'אחר',
    ],
  })
  type = '';

  @Fields.string({ caption: 'הערות' })
  notes = '';

  @DataControl({ click: (item) => (item.searchName = ''), clickIcon: 'close' })
  @Fields.string({ caption: 'חיפוש' })
  searchName = '';

  @Fields.object()
  attending: number[] = [];
  @Fields.object()
  attendingVolunteers: number[] = [];

  @BackendMethod({ allowed: true })
  static async getTeenagers(board: number) {
    return await getTeenagers(board);
  }

  @BackendMethod({ allowed: true, queue: true })
  async save(boardId: number) {
    const r = await getTeenagers(boardId, true);
    if (!r.attendance) {
      r.attendance = await createAttendanceBoard(
        r,
        r.name,
        ATTENDANCE_BOARD_KEY
      );
    }
    await this.verifyAttendanceBoard(+r.attendance!, r.items, this.attending);

    if (r.volunteers?.length >= 0) {
      if (!r.volunteerAttendance) {
        r.volunteerAttendance = await createAttendanceBoard(
          r,
          r.volunteersBoardName!,
          VOLUNTEER_ATTENDANCE_BOARD_KEY
        );
      }
      await this.verifyAttendanceBoard(
        +r.volunteerAttendance!,
        r.volunteers,
        this.attendingVolunteers
      );
    }
  }
  async verifyAttendanceBoard(
    attendanceBoard: number,
    people: { id: number; name: string }[],
    attending: number[]
  ) {
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
          board: attendanceBoard,
        }
      )
    ).boards[0].columns;

    await verifyColumn('date', 'תאריך הפעילות', 'date');
    await verifyColumn('hours', 'שעות הפעילות', 'numbers');
    await verifyColumn('type', 'סוג הפעילות', 'text');
    await verifyColumn('notes', 'הערות', 'long_text');
    for (const item of people) {
      await verifyColumn('t' + item.id, item.name, 'checkbox');
    }

    const values: any = {
      date: this.date,
      type: this.type,
      hours: this.hours,
      notes: this.notes,
    };
    for (const item of attending) {
      values['t' + item] = { checked: 'true' };
    }

    await gql(
      `#graphql
  mutation z($board: ID!, $name: String!, $values: JSON) {
  create_item(board_id: $board, item_name: $name, column_values: $values) {
    id
    column_values {
      id
      value
    }
  }
}`,
      {
        board: attendanceBoard!,
        name: this.name,
        values: JSON.stringify(values),
      }
    );

    async function verifyColumn(
      id: string,
      title: string,
      column_type: 'date' | 'checkbox' | 'text' | 'numbers' | 'long_text'
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
                board: attendanceBoard,
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
}

interface Column {
  id: string;
  title: string;
  type: string;
}
Validators.required.defaultMessage = 'שדה חובה';
/*
V 1.	שדה הערות – אחרי סוג פעילות
V 2.	להוריד את המילה תלמיד מחיפוש
V 3.	לעשות את הBOARD SHARABLE
V 4.	להוסיף מתנדבים לאותו הטופס – עם לוח נוכחות נפרד
2724298143
V 5.	כותרת לווטסאפ:
V a.	בקישורים – קישורים – סחי – מרכז קליטה כנען
V b.	נוכחות – מי בא - סחי מרכז קליטה כנען

*/
