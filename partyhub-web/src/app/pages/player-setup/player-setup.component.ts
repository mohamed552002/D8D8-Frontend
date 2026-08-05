import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-player-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shell">
      <main class="panel" style="max-width: 500px;">
        <div style="display: flex; flex-direction: column; gap: 1.8rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div>
              <p class="subtitle" style="margin: 0; font-size: 0.95rem;">الخطوة الثانية: إعداد اللاعب</p>
              <h2 class="brand-title" style="font-size: 2rem; margin: 0;">الانضمام إلى غرفة</h2>
            </div>
            <button class="btn-secondary" type="button" (click)="goBack()">← تغيير الدور</button>
          </div>

          <form (ngSubmit)="onSubmit()" class="question-card" style="display: flex; flex-direction: column; gap: 1.2rem; background: rgba(11, 15, 25, 0.6); padding: 2rem; border-radius: 20px;">
            <h3 style="font-size: 1.4rem; color: #FFFFFF; font-weight: 700;">📱 بيانات الانضمام</h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; text-align: right;">
              <label for="roomCode" style="font-weight: 700; color: var(--sky-blue);">رمز الغرفة:</label>
              <input
                id="roomCode"
                class="input-field"
                name="roomCode"
                [(ngModel)]="roomCode"
                placeholder="مثال: ABCDE"
                maxlength="5"
                style="text-transform: uppercase; letter-spacing: 4px; font-weight: 900; text-align: center; font-size: 1.4rem;"
                required
              />
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem; text-align: right;">
              <label for="nickname" style="font-weight: 700; color: var(--sky-blue);">اسم اللاعب:</label>
              <input
                id="nickname"
                class="input-field"
                name="nickname"
                [(ngModel)]="nickname"
                placeholder="أدخل اسمك المستعار..."
                required
              />
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading" style="margin-top: 0.5rem; padding: 1rem; font-size: 1.15rem;">
              {{ loading ? 'جاري الانضمام...' : 'الانضمام للغرفة 🚀' }}
            </button>
          </form>

          <div *ngIf="(status$ | async)?.text" class="status" [ngClass]="{ 'error': (status$ | async)?.isError }">
            {{ (status$ | async)?.text }}
          </div>
        </div>
      </main>
    </div>
  `
})
export class PlayerSetupComponent implements OnInit {
  private signalRService = inject(SignalRService);
  private router = inject(Router);

  roomCode = '';
  nickname = '';
  loading = false;
  status$ = this.signalRService.statusMessage$;

  ngOnInit(): void {
    this.signalRService.clearStatus();
  }

  goBack(): void {
    this.signalRService.clearStatus();
    this.router.navigate(['/role-selection']);
  }

  async onSubmit(): Promise<void> {
    if (!this.roomCode.trim() || !this.nickname.trim()) return;
    this.loading = true;
    try {
      await this.signalRService.joinRoom(this.roomCode.trim().toUpperCase(), this.nickname.trim());
      this.router.navigate(['/lobby']);
    } catch (error) {
      // Error handled cleanly inside SignalRService
    } finally {
      this.loading = false;
    }
  }
}
