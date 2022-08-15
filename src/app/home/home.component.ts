import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HomeController, LinksResult } from './home.controller';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }
  result?: LinksResult;
  async ngOnInit() {
    let id = +this.route.snapshot.params['id'!];
    if (id)
      this.result = await HomeController.getLinks(id);
  }
}

