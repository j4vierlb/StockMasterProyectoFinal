import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { LoginFooterComponent } from './login-footer/login-footer.component';
import { HomeMetricsComponent } from './home-metrics/home-metrics.component';
import { HomeQuickActionsComponent } from './home-quick-actions/home-quick-actions.component';
import { HomeRecentActivitiesComponent } from './home-recent-activities/home-recent-activities.component';
import { ResetPasswordFormComponent } from './reset-password-form/reset-password-form.component';
import { ResetPasswordSuccessComponent } from './reset-password-success/reset-password-success.component';

@NgModule({
  declarations: [
    HeaderComponent,
    LoginFormComponent,
    LoginFooterComponent,
    HomeMetricsComponent,
    HomeQuickActionsComponent,
  HomeRecentActivitiesComponent,
  ResetPasswordFormComponent,
  ResetPasswordSuccessComponent
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, RouterModule],
  exports: [
    HeaderComponent,
    LoginFormComponent,
    LoginFooterComponent,
    HomeMetricsComponent,
    HomeQuickActionsComponent,
  HomeRecentActivitiesComponent,
  ResetPasswordFormComponent,
  ResetPasswordSuccessComponent
  ]
})
export class ComponentsModule {}
