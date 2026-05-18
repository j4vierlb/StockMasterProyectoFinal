import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.page.html',
  styleUrls: ['./notfound.page.scss'],
  standalone: false,
})
export class NotfoundPage implements OnInit {

  constructor(
    private router: Router,
    private location: Location,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    console.log('Página 404 cargada - Error handling implementado');
  }

  goHome() {
    this.navCtrl.navigateRoot('/home');
  }

  goBack() {
    this.location.back();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}