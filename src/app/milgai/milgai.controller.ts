import { BackendMethod, Controller, Fields } from 'remult';
import { MondayDate, gql, insertItem, update } from '../home/getGraphQL';
const VolunteerHoursBoard = 6232066474;
export class MilgaiController {
  @BackendMethod({ allowed: true })
  static async deleteHour(id: number, hourId: number): Promise<MilgaiInfo> {
    const info = await MilgaiController.getMilgaiInfo(id);
    const hour = info.hours.find((h) => h.id == hourId);
    if (!hour) throw 'שעה לא נמצאה';
    if (hour.confirmed) throw 'שעה כבר אושרה';
    const r = await gql(`mutation{
      delete_item(item_id: ${hourId}) {
        id
      }
    }`);
    return MilgaiController.getMilgaiInfo(id);
  }
  @BackendMethod({ allowed: true })
  static async confirmHours(id: number, hourId: number, confirmId: string) {
    const info = await MilgaiController.getMilgaiInfo(id);
    const hour = info.hours.find((h) => h.id == hourId);
    if (!hour) throw 'שעה לא נמצאה';
    if (hour.confirmed) throw 'שעה כבר אושרה';
    const r = await gql(`query{
      boards(ids: [${info.board}]) {
        description
      }
    }`);

    for (const line of r.boards[0].description.split('\n')) {
      let val = line.split(',');
      if (val[0].trim() == confirmId.trim()) {
        await update(
          VolunteerHoursBoard,
          hourId,
          confirmColumn,
          val[1] + ', ' + val[0].substring(val[0].length - 4)
        );
        await update(VolunteerHoursBoard, hourId, 'date_1', MondayDate.now());
        return MilgaiController.getMilgaiInfo(id);
      }
    }
    throw 'קוד אישור לא תקין';
  }
  @BackendMethod({ allowed: true })
  static async getMilgaiInfo(id: number): Promise<MilgaiInfo> {
    const r = await gql(
      `
#grqphql
query($id:ID!,$stringId:CompareValue!)
{
  items(ids: [$id]) {
    board {
      id
    }
    name
    id
    column_values {
      column {
        title
      }
      value
      text
    }
  }
  boards(ids: [${VolunteerHoursBoard}]) {
    items_page(limit: 500) {
      query_params: {rules: [{column_id: "${idColumn}", compare_value: $stringId}],
      order_by:[{column_id:"date4" ,direction:desc}]}
      
    ) {
      items {
        id
        name
        column_values{
          id
          value
          text
        }
      }
    }
  }
}
`,
      { id, stringId: id.toString() }
    );
    if (!r.items[0]) throw Error('לא נמצא');
    function get(what: string) {
      let column = r.items[0].column_values.find(
        (c: any) => c.column.title == what
      );
      if (!column) throw Error('בלוח מונדי, לא נמצאה עמודה ' + what);
      return column.text;
    }
    if (get('אופי התנדבות') != 'מלגאי/ת') {
      throw Error('אופי התנדבות אינו מלגאי');
    }

    return {
      name: r.items[0].name,
      id: +r.items[0].id,
      board: r.items[0].board.id,
      group: get('סיירת'),
      scholarshipProvider: get('מסגרת מלגה'),
      hours: r.boards[0].items_page.items.map((i: any) => {
        function get(what: string) {
          return i.column_values.find((c: any) => c.id == what).text;
        }
        return {
          id: i.id,
          date: get(dateColumn),
          fromTime: get(fromTimeColumn),
          toTime: get(toTimeColumn),
          total: +get(totalColumn),
          confirmed: get(confirmColumn) != '',
        };
      }),
    };
  }
}
const dateColumn = 'date4',
  fromTimeColumn = 'text5',
  toTimeColumn = 'text_1',
  totalColumn = 'numbers',
  idColumn = 'text6',
  confirmColumn = 'text17';

export interface MilgaiInfo {
  name: string;
  id: number;
  group: string;
  scholarshipProvider: string;
  board: number;

  hours: {
    id: number;
    date: string;
    fromTime: string;
    toTime: string;
    total: number;
    confirmed: boolean;
  }[];
}

@Controller('hours-report')
export class HourReport {
  @Fields.string<HourReport>({
    caption: 'תאריך',
    inputType: 'date',
    validate: (r) => {
      let d = new Date(r.date);
      if (d > new Date()) throw 'לא ניתן לדווח על שעות בעתיד';
      if (d.getFullYear() < 2024) throw 'לא ניתן לדווח על שעות לפני 2024';
    },
  })
  date = new Date().toISOString().substring(0, 10);
  @Fields.string({
    caption: 'שעה התחלה',
    inputType: 'time',
    validate: (_, r) => {
      const d = r.value.split(':');
      if (d.length != 2) throw 'ערך לא תקין';
    },
  })
  fromTime = '';

  @Fields.string({
    caption: 'שעה סיום',
    inputType: 'time',
    validate: (_, r) => {
      const d = r.value.split(':');
      if (d.length != 2) throw 'ערך לא תקין';
    },
  })
  toTime = '';
  @BackendMethod({ allowed: true })
  async save(id: number) {
    const info = await MilgaiController.getMilgaiInfo(id);
    // calculate total hours between this.fromTime and this.toTime
    const from = this.fromTime.split(':');
    const to = this.toTime.split(':');
    let total = (+to[0] * 60 + +to[1] - (+from[0] * 60 + +from[1])) / 60;

    if (total < 0) {
      if (total > -15) throw 'שעת התחלה גדולה משעת סיום';
      total += 24;
    }
    await insertItem(VolunteerHoursBoard, info.name, {
      ['text']: info.group,
      ['text1']: info.scholarshipProvider,
      [dateColumn]: this.date,
      [fromTimeColumn]: this.fromTime,
      [toTimeColumn]: this.toTime,
      [totalColumn]: total.toString(),
      [idColumn]: id.toString(),
    });
    return await MilgaiController.getMilgaiInfo(id);
  }
}
