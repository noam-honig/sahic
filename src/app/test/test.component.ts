import { Component, OnInit } from '@angular/core';
import { DataAreaSettings } from '@remult/angular/interfaces';
import { HourReport } from '../milgai/milgai.controller';
import { getFields } from 'remult';
import { CustomTimeDataControlComponent } from '../custom-time-input/custom-time-input.component';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
})
export class TestComponent implements OnInit {
  constructor() {}
  time = '13:00';
  u = new HourReport();
  area = new DataAreaSettings({
    fields: () => {
      const f = getFields(this.u);

      return [
        {
          field: f.fromTime,
          customComponent: {
            component: CustomTimeDataControlComponent,
          },
        },
      ];
    },
  });
  ngOnInit(): void {}
}
