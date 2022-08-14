import { Component, OnInit } from '@angular/core';
import { HomeController, LinksResult } from './home.controller';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }
  result?: LinksResult;
  async ngOnInit() {
    let id =+new URLSearchParams(window.location.search).get('id')!;
    this.result = await HomeController.getLinks(id);
  }
}

