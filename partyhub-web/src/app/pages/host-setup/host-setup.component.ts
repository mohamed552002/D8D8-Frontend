import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-host-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-background text-on-background relative overflow-x-hidden">
      <!-- Top Header -->
      <header class="fixed top-0 w-full z-50 backdrop-blur-md bg-surface/70 border-b border-outline-variant/30 shadow-sm flex flex-row-reverse justify-between items-center px-4 py-4 md:hidden">
        <div class="flex items-center gap-2">
          <h1 class="font-headline-md text-primary tracking-tight font-bold">PartyHub</h1>
        </div>
        <button type="button" (click)="goBack()" class="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low hover:opacity-80 transition-opacity active:scale-95 text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </header>

      <main class="pt-20 md:pt-10 pb-28 px-4 max-w-lg mx-auto min-h-screen flex flex-col gap-6 w-full">
        <!-- Title & Subtitle -->
        <div class="text-center space-y-1">
          <h2 class="font-display-lg-mobile text-3xl font-bold text-primary mb-1">إنشاء غرفة</h2>
          <p class="font-body-md text-on-surface-variant">جهز المسرح للمرح القادم!</p>
        </div>

        <!-- Form Container (Design 13) -->
        <form (ngSubmit)="onSubmit()" class="glass-card rounded-2xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
          <!-- Decorative blur blob -->
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed rounded-full mix-blend-multiply filter blur-2xl opacity-50 pointer-events-none"></div>
          
          <!-- Host Nickname -->
          <div class="flex flex-col gap-2 z-10">
            <label class="font-label-sm text-sm font-semibold text-primary" for="nickname">اسم المضيف</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">edit</span>
              <input
                id="nickname"
                name="nickname"
                [(ngModel)]="nickname"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pr-12 pl-4 font-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none shadow-sm placeholder:text-outline-variant"
                placeholder="أدخل اسمك المستعار كمضيف..."
                required
                type="text"
              />
            </div>
          </div>

          <!-- Category Picker (Design 13) -->
          <div class="flex flex-col gap-2 z-10">
            <label class="font-label-sm text-sm font-semibold text-primary">التصنيف المفضل</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="cursor-pointer">
                <input checked type="radio" name="category_preset" class="peer sr-only" value="general"/>
                <div class="p-3 border border-outline-variant rounded-xl flex items-center justify-center gap-2 bg-surface-container-lowest peer-checked:border-primary peer-checked:bg-primary-container/20 peer-checked:text-primary transition-all shadow-sm">
                  <span class="material-symbols-outlined">public</span>
                  <span class="font-body-md font-semibold text-sm">معلومات عامة</span>
                </div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="category_preset" class="peer sr-only" value="music"/>
                <div class="p-3 border border-outline-variant rounded-xl flex items-center justify-center gap-2 bg-surface-container-lowest peer-checked:border-primary peer-checked:bg-primary-container/20 peer-checked:text-primary transition-all shadow-sm">
                  <span class="material-symbols-outlined">music_note</span>
                  <span class="font-body-md font-semibold text-sm">موسيقى</span>
                </div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="category_preset" class="peer sr-only" value="movies"/>
                <div class="p-3 border border-outline-variant rounded-xl flex items-center justify-center gap-2 bg-surface-container-lowest peer-checked:border-primary peer-checked:bg-primary-container/20 peer-checked:text-primary transition-all shadow-sm">
                  <span class="material-symbols-outlined">movie</span>
                  <span class="font-body-md font-semibold text-sm">أفلام</span>
                </div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="category_preset" class="peer sr-only" value="sports"/>
                <div class="p-3 border border-outline-variant rounded-xl flex items-center justify-center gap-2 bg-surface-container-lowest peer-checked:border-primary peer-checked:bg-primary-container/20 peer-checked:text-primary transition-all shadow-sm">
                  <span class="material-symbols-outlined">sports_soccer</span>
                  <span class="font-body-md font-semibold text-sm">رياضة</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Max Players Slider (Design 13) -->
          <div class="flex flex-col gap-2 z-10">
            <div class="flex justify-between items-center">
              <label class="font-label-sm text-sm font-semibold text-primary">الحد الأقصى للاعبين</label>
              <span class="font-headline-md font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full shadow-sm">8</span>
            </div>
            <input class="w-full h-2 rounded-lg appearance-none cursor-pointer bg-surface-container-high" max="10" min="2" type="range" value="8"/>
            <div class="flex justify-between text-xs text-on-surface-variant px-1 font-semibold">
              <span>2 لاعبين</span>
              <span>10 لاعبين</span>
            </div>
          </div>

          <!-- Primary Action Button -->
          <button [disabled]="loading" class="mt-2 w-full bg-primary-container text-on-primary-container font-headline-md font-bold text-lg py-4 rounded-xl shadow-[0_10px_15px_-3px_rgba(56,189,248,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 z-10" type="submit">
            <span class="material-symbols-outlined">add_circle</span>
            <span>{{ loading ? 'جاري إنشاء الغرفة...' : 'إنشاء الغرفة وبدء اللعب' }}</span>
          </button>
        </form>

        <div *ngIf="(status$ | async)?.text" class="status" [ngClass]="{ 'error': (status$ | async)?.isError }">
          {{ (status$ | async)?.text }}
        </div>
      </main>

      <!-- Bottom Mobile Navigation Bar -->
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
export class HostSetupComponent implements OnInit {
  private signalRService = inject(SignalRService);
  private router = inject(Router);

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
    if (!this.nickname.trim()) return;
    this.loading = true;
    try {
      await this.signalRService.createRoom(this.nickname.trim());
      this.router.navigate(['/lobby']);
    } catch (error) {
      // Error handled cleanly inside SignalRService
    } finally {
      this.loading = false;
    }
  }
}
