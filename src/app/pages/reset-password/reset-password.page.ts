import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { EmailService } from 'src/app/services/email.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: false,
})
export class ResetPasswordPage implements OnInit {
  resetForm: FormGroup;
  showSuccessMessage = false;
  email = '';
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private emailService: EmailService
  ) {
    // Inicializar el formulario
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
  }

  mostrarMensajeExito() {
    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  async resetPassword() {
    if (!this.email || !this.isValidEmail(this.email)) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Por favor, ingresa un correo electrónico válido.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Buscar el usuario en localStorage
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = users.find((u: any) => u.email === this.email);

    if (!user) {
      const alert = await this.alertController.create({
        header: 'Usuario no encontrado',
        message: 'No existe una cuenta con este correo electrónico.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.isLoading = true;
    
    try {
      // Generar token de reset (puedes usar timestamp + email)
      const resetToken = btoa(`${this.email}_${Date.now()}`);
      
      // Enviar email real con EmailJS
      const result = await this.emailService.sendPasswordResetEmail(
        this.email,
        user.name || 'Usuario',
        resetToken
      );

      this.isLoading = false;

      if (result.success) {
        this.showSuccessMessage = true;
        console.log('✅ Email de recuperación enviado a:', this.email);
        
        // Redirigir al login después de 5 segundos
        setTimeout(() => {
          this.redirectToLogin();
        }, 5000);
      } else {
        throw new Error('Error al enviar el email');
      }
    } catch (error) {
      this.isLoading = false;
      console.error('❌ Error:', error);
      
      const alert = await this.alertController.create({
        header: 'Error al enviar',
        message: 'No se pudo enviar el correo de recuperación. Por favor, intenta nuevamente.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  // Nueva función específica para manejar la redirección
  redirectToLogin() {
    this.showSuccessMessage = false;
    this.router.navigate(['/login']).then(() => {
      console.log('Redirigido exitosamente al login');
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async onSubmit() {
    await this.resetPassword();
  }

  goToHome() {
    // Cambiado para redirigir al login en lugar de home
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}