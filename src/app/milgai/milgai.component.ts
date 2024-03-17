import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HourReport, MilgaiController, MilgaiInfo } from './milgai.controller';
import { openDialog } from '@remult/angular';
import { DialogService } from '../common/dialog';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { Fields } from 'remult';

@Component({
  selector: 'app-milgai',
  templateUrl: './milgai.component.html',
  styleUrls: ['./milgai.component.scss'],
})
export class MilgaiComponent implements OnInit {
  formatDate(date: string) {
    return new Date(date).toLocaleDateString('he-il', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });
  }
  constructor(private route: ActivatedRoute, private ui: DialogService) {}
  result?: MilgaiInfo;
  async ngOnInit() {
    let id = +this.route.snapshot.params['id'!];
    if (id) {
      this.result = await MilgaiController.getMilgaiInfo(id);
    }
  }
  totalHours() {
    return this.result?.hours.reduce((x, y) => x + y.total, 0) || 0;
  }
  totalConfirmedHours() {
    return (
      this.result?.hours.reduce((x, y) => (y.confirmed ? x + y.total : x), 0) ||
      0
    );
  }
  addReport() {
    var report = new HourReport();
    console.log(report);
    openDialog(
      InputAreaComponent,
      (x) =>
        (x.args = {
          title: 'הוספת דיווח',
          object: report,
          ok: async () => {
            this.result = await report.save(this.result!.id);
          },
        })
    );
  }
  confirm(hourId: number) {
    var s = new stam();
    openDialog(
      InputAreaComponent,
      (x) =>
        (x.args = {
          title: 'אישור שעות',
          object: s,
          ok: async () => {
            this.result = await MilgaiController.confirmHours(
              this.result!.id,
              hourId,
              s.confirmId
            );
          },
        })
    );
  }
}

class stam {
  @Fields.string({ caption: 'תז מאשר' })
  confirmId = '';
}
