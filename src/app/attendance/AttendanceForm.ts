import { DataControl } from '@remult/angular/interfaces';
import {
  BackendMethod,
  Controller,
  ControllerBase,
  Fields,
  Validators,
} from 'remult';
import { getTeenagers } from './getTeenagers';
import { getAttendanceBoard } from './createAttendanceBoard';
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
  @DataControl({ valueList: ['חלוקה', 'איסופים', 'תוכן', 'אחר'] })
  type = '';

  @DataControl({ click: (item) => (item.searchName = ''), clickIcon: 'close' })
  @Fields.string({ caption: 'חיפוש תלמיד' })
  searchName = '';

  @Fields.object()
  attending: number[] = [];

  @BackendMethod({ allowed: true })
  static async getTeenagers(board: number) {
    return await getTeenagers(board);
  }

  @BackendMethod({ allowed: true })
  async save(boardId: number) {
    const r = await getTeenagers(boardId, true);
    const columns = await getAttendanceBoard(r);

    const values: any = {
      date: this.date,
      type: this.type,
      hours: this.hours,
    };
    for (const item of this.attending) {
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
        board: +r.attendance!,
        name: this.name,
        values: JSON.stringify(values),
      }
    );
  }
}

Validators.required.defaultMessage = 'שדה חובה';
