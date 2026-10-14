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
    <div class="min-h-screen flex flex-col bg-background text-on-background relative overflow-x-hidden">
      <!-- Top Header Bar -->
      <header class="fixed top-0 w-full z-50 backdrop-blur-md bg-surface/70 border-b border-outline-variant/30 shadow-sm flex flex-row-reverse justify-between items-center px-4 py-4 md:hidden">
        <div class="flex items-center gap-2">
          <h1 class="font-headline-md text-primary tracking-tight font-bold">PartyHub</h1>
        </div>
        <button type="button" (click)="goBack()" class="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low hover:opacity-80 transition-opacity active:scale-95 text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </header>

      <!-- Main Canvas Container -->
      <main class="pt-20 md:pt-10 pb-28 px-4 max-w-lg mx-auto min-h-screen flex flex-col gap-6 w-full">
        <!-- Header Section -->
        <section class="text-center space-y-2 mt-4">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-2 shadow-[0_10px_15px_-3px_rgba(56,189,248,0.3)]">
            <span class="material-symbols-outlined text-4xl">login</span>
          </div>
          <h2 class="font-display-lg-mobile text-3xl font-bold text-primary mb-1">انضمام لغرفة</h2>
          <p class="font-body-md text-on-surface-variant">أدخل رمز الغرفة واسمك المستعار للبدء</p>
        </section>

        <!-- Code Input Section (Design 14) -->
        <form (ngSubmit)="onSubmit()" class="glass-card rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div class="flex flex-col gap-2">
            <label for="roomCode" class="font-label-sm text-sm font-semibold text-primary">رمز الغرفة</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">key</span>
              <input
                id="roomCode"
                name="roomCode"
                [(ngModel)]="roomCode"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pr-12 pl-4 font-mono text-center text-xl font-bold text-primary tracking-widest focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none shadow-sm uppercase placeholder:text-outline-variant placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
                placeholder="مثال: ABCDE"
                maxlength="5"
                required
                type="text"
              />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label for="nickname" class="font-label-sm text-sm font-semibold text-primary">اسم اللاعب</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">person</span>
              <input
                id="nickname"
                name="nickname"
                [(ngModel)]="nickname"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pr-12 pl-4 font-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none shadow-sm placeholder:text-outline-variant"
                placeholder="أدخل اسمك المستعار..."
                required
                type="text"
              />
            </div>
          </div>

          <button [disabled]="loading" class="w-full bg-primary-container text-on-primary-container font-headline-md font-bold text-lg py-4 rounded-xl shadow-[0_10px_15px_-3px_rgba(56,189,248,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2" type="submit">
            <span>{{ loading ? 'جاري الانضمام...' : 'اتصال والغرفة' }}</span>
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
        </form>

        <div *ngIf="(status$ | async)?.text" class="status" [ngClass]="{ 'error': (status$ | async)?.isError }">
          {{ (status$ | async)?.text }}
        </div>
      </main>

      <!-- Bottom Navigation Bar (Mobile) -->
      <nav class="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl backdrop-blur-xl bg-surface/90 shadow-[0_-4px_12px_rgba(56,189,248,0.15)] flex flex-row-reverse justify-around items-center px-2 py-3 border-t border-outline-variant/20">
        <a (click)="goBack()" class="flex flex-col items-center justify-center text-on-surface-variant p-2 rounded-lg cursor-pointer">
          <span class="material-symbols-outlined mb-1">home</span>
          <span class="font-label-sm text-xs">الرئيسية</span>
        </a>
        <a class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1.5 shadow-sm cursor-pointer">
          <span class="material-symbols-outlined mb-1">groups</span>
          <span class="font-label-sm text-xs">الغرف</span>
        </a>
        <a class="flex flex-col items-center justify-center text-on-surface-variant p-2 rounded-lg cursor-pointer">
          <span class="material-symbols-outlined mb-1">emoji_events</span>
          <span class="font-label-sm text-xs">الإنجازات</span>
        </a>
        <a class="flex flex-col items-center justify-center text-on-surface-variant p-2 rounded-lg cursor-pointer">
          <span class="material-symbols-outlined mb-1">settings</span>
          <span class="font-label-sm text-xs">الإعدادات</span>
        </a>
      </nav>
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
