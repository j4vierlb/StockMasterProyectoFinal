import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  // 🔑 Claves configuradas desde EmailJS
  // Dashboard: https://dashboard.emailjs.com/
  private readonly SERVICE_ID = 'service_6xhypiv';
  private readonly PRODUCT_TEMPLATE_ID = 'template_n0iorou'; // Plantilla para productos/QR
  private readonly PASSWORD_RESET_TEMPLATE_ID = 'template_tmo6qm5'; // Plantilla para reset password
  private readonly PUBLIC_KEY = 'juOG6z2AoC1Tvc3WD';

  constructor() {
    // Inicializar EmailJS con la clave pública
    emailjs.init(this.PUBLIC_KEY);
  }

  /**
   * Envía un email usando EmailJS
   * @param templateId ID de la plantilla a usar
   * @param templateParams Parámetros que se usarán en la plantilla del email
   * @returns Promise con el resultado del envío
   */
  async sendEmail(templateId: string, templateParams: any): Promise<any> {
    try {
      const response = await emailjs.send(
        this.SERVICE_ID,
        templateId,
        templateParams
      );
      console.log('✅ Email enviado exitosamente:', response);
      return { success: true, response };
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      return { success: false, error };
    }
  }

  /**
   * Envía información de asistencia escaneada desde código QR
   * @param qrData Datos del código QR escaneado
   * @param userName Nombre del usuario que escanea
   * @param userEmail Email del usuario (obligatorio - se envía a este email)
   */
  async sendAttendanceEmail(qrData: string, userName: string, userEmail: string): Promise<any> {
    const templateParams = {
      to_email: userEmail, // Email del usuario logueado
      from_name: userName,
      from_email: userEmail,
      qr_data: qrData,
      timestamp: new Date().toLocaleString('es-CL'),
      subject: `Notificación StockMaster - ${userName}`
    };

    return await this.sendEmail(this.PRODUCT_TEMPLATE_ID, templateParams);
  }

  /**
   * Envía email de recuperación de contraseña con link para resetear
   * @param userEmail Email del usuario
   * @param userName Nombre del usuario
   * @param resetToken Token único para el reset (opcional)
   */
  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken?: string): Promise<any> {
    // Generar link de reset (puedes personalizarlo)
    const resetLink = resetToken 
      ? `https://stockmaster.app/reset-password?token=${resetToken}`
      : `https://stockmaster.app/reset-password`;

    const templateParams = {
      email: userEmail,
      user_name: userName,
      reset_link: resetLink,
      timestamp: new Date().toLocaleString('es-CL')
    };

    return await this.sendEmail(this.PASSWORD_RESET_TEMPLATE_ID, templateParams);
  }
}
