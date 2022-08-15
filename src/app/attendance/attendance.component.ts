import { Component, OnInit } from '@angular/core';
import { DataAreaSettings, DataControl } from '@remult/angular/interfaces';
import { ControllerBase, Fields, Remult } from 'remult';
import { HomeController } from '../home/home.controller';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {

  constructor(private remult: Remult) { }
  result?: Awaited<ReturnType<typeof HomeController.getTeenagers>>;
  form: TheForm = new TheForm(this.remult);
  async ngOnInit() {
    this.result = await HomeController.getTeenagers();
  }
  area = new DataAreaSettings({
    fields: () => this.form.$.toArray()
  })
  matchSearch(item: { name: string }) {
    return !this.form.searchName || item.name.includes(this.form.searchName);
  }
  trackBy(i: number, item: { name: string, id: number }) {
    return item.id;
  }


}

class TheForm extends ControllerBase {
  @Fields.dateOnly({ caption: 'תאריך הפעילות' })
  date = new Date();
  @Fields.number({ caption: 'שעות פעילות' })
  hours = 0;
  @Fields.string({ caption: 'סוג פעילות' })
  @DataControl({ valueList: ['חלוקה', 'איסופים', 'תוכן', 'אחר'] })
  type = '';

  @Fields.string({ caption: 'חיפוש תלמיד' })
  searchName = '';

}