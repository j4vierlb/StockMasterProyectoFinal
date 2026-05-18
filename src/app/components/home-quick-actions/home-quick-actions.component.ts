import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-home-quick-actions',
  templateUrl: './home-quick-actions.component.html',
  styleUrls: ['./home-quick-actions.component.scss'],
  standalone: false,
})
export class HomeQuickActionsComponent  implements OnInit {

  constructor(
    private router: Router,
    private actionSheetController: ActionSheetController
  ) { }

  ngOnInit() {}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  async showQuickActions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Acciones Rápidas',
      cssClass: 'glass-action-sheet',
      buttons: [
        {
          text: 'Nuevo Producto',
          icon: 'add-outline',
          handler: () => {
            this.router.navigate(['/products']);
          }
        },
        {
          text: 'Entrada de Stock',
          icon: 'arrow-down-outline',
          handler: () => {
            this.router.navigate(['/movements']);
          }
        },
        {
          text: 'Salida de Stock',
          icon: 'arrow-up-outline',
          handler: () => {
            this.router.navigate(['/movements']);
          }
        },
        {
          text: 'Ver Reportes',
          icon: 'document-text-outline',
          handler: () => {
            // Aquí puedes agregar lógica para reportes
            console.log('Función de reportes - por implementar');
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }
}
