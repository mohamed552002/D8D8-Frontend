import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-background text-on-background relative overflow-x-hidden">
      <!-- Header -->
      <header class="fixed top-0 w-full z-50 backdrop-blur-md bg-surface/70 border-b border-outline-variant/30 shadow-sm flex justify-between items-center px-6 py-4">
        <h1 class="font-headline-md text-2xl font-bold text-primary tracking-tight">PartyHub • غرفة الانتظار</h1>
        <button type="button" (click)="onLeaveRoom()" class="flex items-center gap-1 text-on-surface-variant hover:text-error transition-colors px-3 py-1.5 rounded-full hover:bg-error-container/20 text-sm font-semibold">
          <span class="material-symbols-outlined text-sm">logout</span>
          <span>مغادرة</span>
        </button>
      </header>

      <main class="pt-24 pb-28 px-4 max-w-2xl mx-auto min-h-screen flex flex-col gap-6 w-full">
        <!-- Room Code Banner Header -->
        <div class="glass-card rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div>
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container font-label-sm text-xs font-bold mb-2">
              <span class="material-symbols-outlined text-sm">meeting_room</span>
              غرفة الانتظار المباشرة
            </span>
            <h2 class="font-display-lg-mobile text-3xl font-extrabold text-primary">
              {{ (room$ | async)?.code ? 'رمز الغرفة: ' + (room$ | async)?.code : 'رمز الغرفة: --' }}
            </h2>
          </div>
          <div class="bg-primary-container text-on-primary-container font-headline-md text-lg font-bold px-5 py-2.5 rounded-full shadow-sm flex items-center gap-2">
            <span class="material-symbols-outlined">group</span>
            <span>{{ (room$ | async)?.players?.length ?? 0 }} / 8 لاعبين</span>
          </div>
        </div>

        <!-- Host Game Options (Host Only) -->
        <div *ngIf="(role$ | async) === 'host'" class="glass-card rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div class="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
            <span class="material-symbols-outlined text-primary text-2xl">settings</span>
            <h3 class="font-headline-md text-xl font-bold text-primary">إعدادات المباراة والجولة</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label for="targetPoints" class="font-label-sm text-sm font-semibold text-on-surface">نقاط الفوز (Target Score):</label>
              <input
                id="targetPoints"
                type="number"
                [(ngModel)]="targetPoints"
                min="1"
                max="100"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 text-center font-bold text-lg text-primary outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="answerTimeout" class="font-label-sm text-sm font-semibold text-on-surface">مدة الـ Buzz (بالثواني):</label>
              <input
                id="answerTimeout"
                type="number"
                [(ngModel)]="answerTimeoutSeconds"
                min="3"
                max="30"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 text-center font-bold text-lg text-primary outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div class="flex flex-col gap-2 sm:col-span-2">
              <label for="categorySelect" class="font-label-sm text-sm font-semibold text-on-surface">تصنيف الأسئلة (Category):</label>
              <select
                id="categorySelect"
                [(ngModel)]="selectedCategory"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 font-bold text-primary outline-none focus:border-primary shadow-sm cursor-pointer"
              >
                <option value="جميع التصنيفات">جميع التصنيفات (كل المجالات)</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Host Action Button -->
        <div *ngIf="(role$ | async) === 'host'" class="flex flex-col items-center gap-2 w-full">
          <button
            type="button"
            [disabled]="!canStartGame()"
            class="w-full bg-primary-container text-on-primary-container font-headline-md font-bold text-xl py-4 rounded-xl shadow-[0_10px_15px_-3px_rgba(56,189,248,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="onStartRound()"
          >
            <span class="material-symbols-outlined text-2xl">play_circle</span>
            <span>بدء اللعبة وتوزيع الأسئلة</span>
          </button>
          <p *ngIf="!canStartGame()" class="text-error font-bold text-sm flex items-center gap-1 mt-1">
            <span class="material-symbols-outlined text-sm">warning</span>
            <span>يلزم انضمام لاعبين اثنين على الأقل لبدء اللعبة</span>
          </p>
        </div>

        <!-- Joined Players List (Design 10 style Avatar cards) -->
        <div class="glass-card rounded-2xl p-6 shadow-sm">
          <h3 class="font-headline-md text-xl font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-3">
            <span class="material-symbols-outlined">groups</span>
            <span>اللاعبون المنضمون للغرفة</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div *ngFor="let p of (room$ | async)?.players" class="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-lg">
                  {{ p.nickname.charAt(0) }}
                </div>
                <span class="font-body-lg font-bold text-on-surface">{{ p.nickname }}</span>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold" [ngClass]="p.isHost ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'">
                {{ p.isHost ? 'المضيف 🎤' : 'لاعب 📱' }}
              </span>
            </div>
          </div>
        </div>

        <div *ngIf="(status$ | async)?.text as statusText" class="status" [ngClass]="{ 'error': (status$ | async)?.isError }">
          {{ statusText }}
        </div>
      </main>

      <!-- Bottom Mobile Navigation Bar -->
      <nav class="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl backdrop-blur-xl bg-surface/90 shadow-[0_-4px_12px_rgba(56,189,248,0.15)] flex flex-row-reverse justify-around items-center px-2 py-3 border-t border-outline-variant/20">
        <a (click)="onLeaveRoom()" class="flex flex-col items-center justify-center text-on-surface-variant p-2 rounded-lg cursor-pointer">
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
export class LobbyComponent implements OnInit, OnDestroy {
  private signalRService = inject(SignalRService);
  private router = inject(Router);

  room$ = this.signalRService.currentRoom$;
  role$ = this.signalRService.currentRole$;
  status$ = this.signalRService.statusMessage$;

  targetPoints = 10;
  answerTimeoutSeconds = 5;
  categories: string[] = [];
  selectedCategory: string = 'جميع التصنيفات';

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.signalRService.clearStatus();
    this.categories = this.signalRService.categories$.value;

    this.subs.push(
      this.signalRService.categories$.subscribe(cats => {
        if (cats && cats.length > 0) {
          this.categories = cats;
        }
      })
    );

    this.signalRService.getCategories().catch(() => {});

    this.subs.push(
      this.signalRService.gameSession$.subscribe(session => {
        if (session) {
          this.router.navigate(['/game']);
        }
      })
    );
  }


  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  canStartGame(): boolean {
    const room = this.signalRService.currentRoom$.value;
    return !!room && (room.players?.length ?? 0) >= 2;
  }

  async onStartRound(): Promise<void> {
    if (!this.canStartGame()) return;
    try {
      await this.signalRService.startGame(this.targetPoints, this.answerTimeoutSeconds, 10, this.selectedCategory);
      this.router.navigate(['/game']);
    } catch (error) {
      this.signalRService.statusMessage$.next({
        text: error instanceof Error ? error.message : 'تعذر بدء الجولة.',
        isError: true
      });
    }
  }


  async onLeaveRoom(): Promise<void> {
    await this.signalRService.leaveRoom();
    this.router.navigate(['/role-selection']);
  }
}
