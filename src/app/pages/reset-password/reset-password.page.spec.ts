import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { ResetPasswordPage } from './reset-password.page';
import { EmailService } from 'src/app/services/email.service';

describe('ResetPasswordPage', () => {
  let component: ResetPasswordPage;
  let fixture: ComponentFixture<ResetPasswordPage>;

  beforeEach(async () => {
    const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    const mockEmailService = jasmine.createSpyObj('EmailService', ['sendPasswordResetEmail']);
    const mockAlertController = jasmine.createSpyObj('AlertController', ['create']);
    const mockLoadingController = jasmine.createSpyObj('LoadingController', ['create']);
    
    mockAlertController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));
    mockLoadingController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve(), dismiss: () => Promise.resolve() } as any));

    await TestBed.configureTestingModule({
      declarations: [ ResetPasswordPage ],
      imports: [ ReactiveFormsModule, FormsModule, IonicModule.forRoot() ],
      providers: [
        FormBuilder,
        { provide: Router, useValue: mockRouter },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AlertController, useValue: mockAlertController },
        { provide: LoadingController, useValue: mockLoadingController }
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty email', () => {
    expect(component.email).toBe('');
    expect(component.showSuccessMessage).toBe(false);
    expect(component.isLoading).toBe(false);
  });

  it('should validate email format correctly', () => {
    expect(component.isValidEmail('test@test.com')).toBe(true);
    expect(component.isValidEmail('invalid-email')).toBe(false);
    expect(component.isValidEmail('')).toBe(false);
  });

  it('should show success message after reset', () => {
    component.mostrarMensajeExito();
    expect(component.showSuccessMessage).toBe(true);
  });

  it('should have goToLogin method', () => {
    expect(component.goToLogin).toBeDefined();
  });

  it('should have resetPassword method', () => {
    expect(component.resetPassword).toBeDefined();
  });
});
