import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password-form',
  templateUrl: './reset-password-form.component.html',
  styleUrls: ['./reset-password-form.component.scss'],
  standalone: false,
})
export class ResetPasswordFormComponent {
  resetForm: FormGroup;

  @Output() success = new EventEmitter<void>();

  constructor(private formBuilder: FormBuilder, private router: Router) {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.resetForm.valid) {
      // Aquí puedes simular el envío y mostrar el mensaje de éxito
      this.success.emit();
    }
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}