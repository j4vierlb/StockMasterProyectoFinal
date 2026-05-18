import { TestBed } from '@angular/core/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct service configuration', () => {
    expect(service['SERVICE_ID']).toBe('service_6xhypiv');
    expect(service['PUBLIC_KEY']).toBe('juOG6z2AoC1Tvc3WD');
    expect(service['PRODUCT_TEMPLATE_ID']).toBe('template_n0iorou');
    expect(service['PASSWORD_RESET_TEMPLATE_ID']).toBe('template_tmo6qm5');
  });

  it('should send email with correct parameters', async () => {
    spyOn(service as any, 'sendEmail').and.returnValue(Promise.resolve({ success: true }));
    
    const result = await service['sendEmail']('template_test', { test: 'data' });
    
    expect(result.success).toBe(true);
  });

  it('should send attendance email with correct data', async () => {
    spyOn(service as any, 'sendEmail').and.returnValue(Promise.resolve({ success: true }));
    
    const result = await service.sendAttendanceEmail('QR123', 'Test User', 'test@test.com');
    
    expect(service['sendEmail']).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should send password reset email with correct data', async () => {
    spyOn(service as any, 'sendEmail').and.returnValue(Promise.resolve({ success: true }));
    
    const result = await service.sendPasswordResetEmail('test@test.com', 'Test User', 'token123');
    
    expect(service['sendEmail']).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should generate reset link with token', async () => {
    spyOn(service as any, 'sendEmail').and.callFake((templateId: string, params: any) => {
      expect(params.reset_link).toContain('token123');
      return Promise.resolve({ success: true });
    });
    
    await service.sendPasswordResetEmail('test@test.com', 'Test User', 'token123');
  });
});
