import { Component, OnInit } from '@angular/core';
import { DataAreaSettings } from '@remult/angular/interfaces';
import { Remult } from 'remult';
import { HomeController } from '../home/home.controller';
import { AttendanceForm } from './AttendanceForm';
import { ActivatedRoute } from '@angular/router';
import { DialogService } from '../common/dialog';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent implements OnInit {
  constructor(
    private remult: Remult,
    private route: ActivatedRoute,
    private ui: DialogService
  ) {}
  result?: Awaited<ReturnType<typeof AttendanceForm.getTeenagers>>;
  form: AttendanceForm = new AttendanceForm(this.remult);
  async ngOnInit() {
    let id = +this.route.snapshot.params['id'!];
    if (id) {
      this.result = await AttendanceForm.getTeenagers(id);
      this.form = new AttendanceForm(this.remult);

      this.area = new DataAreaSettings({
        fields: () => {
          const f = this.form.$;
          return [f.name, f.date, f.hours, f.type];
        },
      });
      this.searchArea = new DataAreaSettings({
        fields: () => [this.form.$.searchName],
      });

      // Load data from local storage
      const attendanceData = localStorage.getItem('attendance');
      if (attendanceData) {
        const parsedData = JSON.parse(attendanceData);
        parsedData.forEach((item: { key: string; value: any }) => {
          const field = this.form.$.find(item.key);
          if (field) {
            field.value = field.metadata.valueConverter.fromJson!(item.value);
          }
        });
      }
      this.form.searchName = '';

      this.ok = false;
    }
  }
  saveToLocal() {
    localStorage.setItem(
      'attendance',
      JSON.stringify(
        [...this.form.$].map((x) => ({
          key: x.metadata.key,
          value: x.metadata.valueConverter.toJson!(x.value),
        }))
      )
    );
  }

  area!: DataAreaSettings;
  searchArea!: DataAreaSettings;
  matchSearch(item: { name: string }) {
    return !this.form.searchName || item.name.includes(this.form.searchName);
  }
  toggle(id: number) {
    if (this.form.attending.includes(id))
      this.form.attending.splice(this.form.attending.indexOf(id), 1);
    else this.form.attending.push(id);
    this.saveToLocal();
  }
  toggleVolunteer(id: number) {
    if (this.form.attendingVolunteers.includes(id))
      this.form.attendingVolunteers.splice(
        this.form.attendingVolunteers.indexOf(id),
        1
      );
    else this.form.attendingVolunteers.push(id);
    this.saveToLocal();
  }

  trackBy(i: number, item: { name: string; id: number }) {
    return item.id;
  }
  ok = false;
  async save() {
    this.saveToLocal();
    await this.form.save(this.result!.id);
    let f = this.form;
    this.form = new AttendanceForm(this.remult);

    this.form.name = f.name;
    this.saveToLocal();
    this.ok = true;
  }
  async clear() {
    if (await this.ui.yesNoQuestion('למחוק את כל מה שכתוב?')) {
      localStorage.removeItem('attendance');
      this.ngOnInit();
    }
  }
}
