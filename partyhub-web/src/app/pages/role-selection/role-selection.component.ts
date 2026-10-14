import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col bg-background text-on-background relative overflow-x-hidden">
      <!-- Top Header -->
      <header class="fixed top-0 w-full z-50 backdrop-blur-md bg-surface/70 border-b border-outline-variant/30 shadow-sm flex justify-between items-center px-6 py-4">
        <h1 class="font-headline-md text-2xl font-bold text-primary tracking-tight">PartyHub • دغ دغ</h1>
        <span class="bg-primary-container/20 text-on-primary-container px-3 py-1 rounded-full font-label-sm text-xs font-semibold flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">auto_awesome</span>
          الإصدار التفاعلي 2.0
        </span>
      </header>

      <main class="pt-24 pb-28 px-4 max-w-2xl mx-auto min-h-screen flex flex-col justify-center items-center gap-8 w-full">
        <!-- Hero Section -->
        <div class="text-center space-y-3">
          <span class="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary-container/20 text-on-primary-container font-label-sm text-sm font-bold shadow-sm">
            <span class="material-symbols-outlined text-sm">sports_esports</span>
            تحدي الأسئلة والسرعة الأسرع بالوطن العربي
          </span>
          <h1 class="font-display-lg-mobile text-4xl md:text-5xl font-extrabold text-primary tracking-tight">دغ دغ</h1>
          <p class="font-body-lg text-on-surface-variant max-w-md mx-auto">
            المنصة التفاعلية الممتعة للمسابقات والتحديات المباشرة — اختر دورك للبدء!
          </p>
        </div>

        <!-- Role Selection Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
          <!-- Host Card -->
          <button type="button" class="glass-card p-6 rounded-2xl border-2 border-primary-container/40 hover:border-primary hover:bg-primary-container/10 transition-all text-center flex flex-col items-center gap-4 cursor-pointer group shadow-sm hover:shadow-active hover:-translate-y-1" (click)="selectRole('host')">
            <div class="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl">mic</span>
            </div>
            <div>
              <h3 class="font-headline-md text-xl font-bold text-on-surface mb-1">مضيف (Host)</h3>
              <p class="font-body-md text-sm text-on-surface-variant">أنشئ غرفة جديدة، تطلع على الأسئلة، وأدر الجولات والنتائج</p>
            </div>
          </button>

          <!-- Player Card -->
          <button type="button" class="glass-card p-6 rounded-2xl border-2 border-tertiary-container/40 hover:border-tertiary hover:bg-tertiary-container/10 transition-all text-center flex flex-col items-center gap-4 cursor-pointer group shadow-sm hover:shadow-active hover:-translate-y-1" (click)="selectRole('player')">
            <div class="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl">smartphone</span>
            </div>
            <div>
              <h3 class="font-headline-md text-xl font-bold text-on-surface mb-1">لاعب (Player)</h3>
              <p class="font-body-md text-sm text-on-surface-variant">ادخل رمز الغرفة واضغط على زر الـ Buzz بأسرع سرعة</p>
            </div>
          </button>
        </div>
      </main>

      <!-- Bottom Mobile Navigation Bar -->
      <nav class="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl backdrop-blur-xl bg-surface/90 shadow-[0_-4px_12px_rgba(56,189,248,0.15)] flex flex-row-reverse justify-around items-center px-2 py-3 border-t border-outline-variant/20">
        <a class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1.5 shadow-sm cursor-pointer">
          <span class="material-symbols-outlined mb-1">home</span>
          <span class="font-label-sm text-xs">الرئيسية</span>
        </a>
        <a class="flex flex-col items-center justify-center text-on-surface-variant p-2 rounded-lg cursor-pointer">
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
export class RoleSelectionComponent {
  constructor(private router: Router) { }

  selectRole(role: 'host' | 'player'): void {
    if (role === 'host') {
      this.router.navigate(['/host-setup']);
    } else {
      this.router.navigate(['/player-setup']);
    }
  }
}
