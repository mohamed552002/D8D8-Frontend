import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SignalRService } from '../../services/signalr.service';
import { AudioService } from '../../services/audio.service';
import { GameSession, PlayerScoreDto, QuestionDto, GameSummaryDto } from '../../models/game.models';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],

  template: `
    <div class="min-h-screen flex flex-col bg-background text-on-background relative overflow-x-hidden">

      <!-- Top App Bar (Sticky Header) -->
      <header class="bg-surface/90 backdrop-blur-md sticky top-0 z-50 px-md py-sm flex justify-between items-center border-b border-outline-variant/30 shadow-sm">
        <div class="flex items-center gap-md">
          <h1 class="font-display-lg-mobile text-2xl font-bold text-primary tracking-tight">دغ دغ • PartyHub</h1>
          <span *ngIf="(room$ | async)?.code as code" class="bg-primary-container/20 text-on-primary-container px-sm py-xs rounded-full font-label-sm text-sm font-semibold flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">meeting_room</span>
            <span>رمز الغرفة: </span>
            <span class="font-mono text-primary font-bold tracking-wider">{{ code }}</span>
          </span>
        </div>
        <div class="flex items-center gap-sm">
          <button (click)="onLeaveGame()" type="button" class="flex items-center gap-xs text-on-surface-variant hover:text-error transition-colors px-sm py-xs rounded-full hover:bg-error-container/20">
            <span class="material-symbols-outlined text-sm">logout</span>
            <span class="font-label-sm text-label-sm hidden sm:inline">مغادرة</span>
          </button>
        </div>
      </header>

      <!-- End Game Confirmation Modal Popup -->
      <div *ngIf="showEndGameModal" class="modal-overlay">
        <div class="modal-card">
          <span class="material-symbols-outlined text-error" style="font-size: 48px; margin-bottom: 0.5rem;">flag</span>
          <h3 style="font-size: 1.6rem; color: var(--on-surface); font-weight: 800; margin-bottom: 0.6rem;">
            تأكيد إنهاء اللعبة
          </h3>
          <p style="font-size: 1.05rem; color: var(--on-surface-variant); margin-bottom: 1.8rem;">
            هل أنت متأكد من إنهاء اللعبة الآن والتكريم على منصة التتويج؟
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button
              type="button"
              class="btn-wrong"
              style="font-size: 1.05rem; padding: 0.8rem 1.6rem;"
              (click)="confirmEndGame()"
            >
              <span class="material-symbols-outlined">check</span>
              <span>نعم، إنهاء اللعبة</span>
            </button>
            <button
              type="button"
              class="btn-secondary"
              style="font-size: 1.05rem; padding: 0.8rem 1.6rem;"
              (click)="cancelEndGame()"
            >
              <span class="material-symbols-outlined">close</span>
              <span>إلغاء</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Canvas Container -->
      <main class="flex-1 max-w-6xl w-full mx-auto p-md md:p-lg flex flex-col gap-lg pb-24 md:pb-lg">

        <!-- Standalone Game Over Victory Screen with 3-Place Podium -->
        <div *ngIf="isGameEnded()" class="victory-screen w-full">
          <div class="glass-card text-center p-8 md:p-12 rounded-3xl shadow-sm">
            <span class="material-symbols-outlined text-primary text-6xl mb-2">emoji_events</span>
            <h1 class="font-display-lg text-4xl font-bold text-on-surface mb-2">انتهت المباراة!</h1>
            <p class="font-headline-md text-2xl font-bold text-primary mb-8">
              🎉 الفائز المستحق بالتحدي: {{ getWinnerName() }}
            </p>

            <!-- 1st, 2nd, 3rd Podium Callouts -->
            <div *ngIf="getTopPodium().length > 0" class="podium-container">

              <!-- 2nd Place (Silver) -->
              <div *ngIf="getTopPodium()[1] as p2" class="podium-card rank-2">
                <span class="material-symbols-outlined text-4xl text-sky-600">workspace_premium</span>
                <div class="player-tag bg-sky-100 text-sky-800 mt-2">المركز الثاني</div>
                <h3 class="text-xl font-bold text-on-surface mt-2 mb-1">{{ p2.nickname }}</h3>
                <p class="text-lg font-bold text-primary">{{ p2.score }} نقطة</p>
              </div>

              <!-- 1st Place (Gold) -->
              <div *ngIf="getTopPodium()[0] as p1" class="podium-card rank-1">
                <span class="material-symbols-outlined text-5xl text-amber-500">military_tech</span>
                <div class="player-tag bg-amber-100 text-amber-800 font-extrabold mt-2">البطل الأول 👑</div>
                <h2 class="text-2xl font-extrabold text-on-surface mt-2 mb-1">{{ p1.nickname }}</h2>
                <p class="text-xl font-extrabold text-amber-600">{{ p1.score }} نقطة</p>
              </div>

              <!-- 3rd Place (Bronze) -->
              <div *ngIf="getTopPodium()[2] as p3" class="podium-card rank-3">
                <span class="material-symbols-outlined text-4xl text-orange-600">emoji_events</span>
                <div class="player-tag bg-orange-100 text-orange-800 mt-2">المركز الثالث</div>
                <h3 class="text-xl font-bold text-on-surface mt-2 mb-1">{{ p3.nickname }}</h3>
                <p class="text-lg font-bold text-orange-700">{{ p3.score }} نقطة</p>
              </div>

            </div>

            <!-- Detailed Final Summary Table -->
            <div class="mini-leaderboard mb-8 text-right p-6 rounded-2xl bg-surface-container-lowest">
              <h4 class="leaderboard-title text-xl font-bold mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined">analytics</span>
                <span>ملخص إحصائيات المباراة</span>
              </h4>
              <ul class="leaderboard-list">
                <li *ngFor="let s of (scoreboard$ | async)" class="leaderboard-item p-3">
                  <span class="flex items-center gap-3">
                    <span class="player-tag">#{{ s.rank }}</span>
                    <span class="font-bold text-lg">{{ s.nickname }}</span>
                  </span>
                  <div class="flex items-center gap-4">
                    <span class="text-sm text-secondary font-bold">صح: {{ getCorrectCount(s.nickname) }}</span>
                    <span class="text-sm text-error font-bold">خطأ: {{ getWrongCount(s.nickname) }}</span>
                    <span class="player-score text-lg font-extrabold">{{ s.score }} نقطة</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Victory Action Controls -->
            <div class="flex justify-center gap-4 flex-wrap">
              <button
                *ngIf="(role$ | async) === 'host'"
                type="button"
                class="btn-primary py-3 px-8 text-lg"
                (click)="onRestartGame()"
              >
                <span class="material-symbols-outlined">replay</span>
                <span>العب مرة ثانية</span>
              </button>

              <button
                type="button"
                class="btn-secondary py-3 px-8 text-lg"
                (click)="onLeaveGame()"
              >
                <span class="material-symbols-outlined">home</span>
                <span>العودة للشاشة الرئيسية</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Active Game Play Area (Hidden when Game Ends) -->
        <div *ngIf="!isGameEnded()" class="w-full">

          <!-- Screen B: Host Controller Interface (Design 10 & 15) -->
          <div *ngIf="(role$ | async) === 'host'" class="host-controller flex flex-col gap-lg">
            
            <!-- Question Card Section (Full width 12-col main focus) -->
            <section class="bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl p-lg md:p-xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <!-- Decorative subtle background blob -->
              <div class="absolute top-0 right-0 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
              
              <!-- Header Bar with Category Tag & Target Points -->
              <div class="w-full flex justify-between items-center flex-wrap gap-sm mb-md">
                <div class="flex items-center gap-xs">
                  <span class="text-sm font-bold text-primary">تصنيف الأسئلة:</span>
                  <select
                    class="bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-1 font-body-md text-sm text-primary font-bold outline-none cursor-pointer"
                    [ngModel]="currentSession?.selectedCategory || 'جميع التصنيفات'"
                    (ngModelChange)="onChangeCategory($event)"
                  >
                    <option value="جميع التصنيفات">جميع التصنيفات (كل المجالات)</option>
                    <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                  </select>
                </div>
                <div class="bg-tertiary-fixed text-on-tertiary-fixed-variant px-md py-xs rounded-full font-label-sm text-label-sm inline-flex items-center gap-xs">
                  <span class="material-symbols-outlined text-sm">flag</span>
                  <span>هدف الفوز: {{ currentSession?.targetPoints || 10 }} نقطة</span>
                </div>
              </div>

              <!-- Question Text -->
              <h2 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mt-sm max-w-3xl leading-tight">
                {{ (currentQuestionDto$ | async)?.question || currentSession?.currentQuestion || 'استمع إلى السؤال من المضيف' }}
              </h2>

              <!-- Answer Box -->
              <div class="w-full max-w-2xl bg-primary-container/10 border border-primary-container/40 rounded-xl p-md mt-md text-center">
                <p class="font-body-md text-on-surface-variant text-sm">الإجابة الصحيحة:</p>
                <p class="font-headline-md text-primary mt-1 font-bold">{{ (currentQuestionDto$ | async)?.answer || currentSession?.currentAnswer || 'غير متاح' }}</p>
              </div>

              <!-- Host Interactive Control Toggles -->
              <div class="flex flex-wrap justify-center gap-sm mt-md">
                <button
                  *ngIf="(currentQuestionDto$ | async)?.hint"
                  type="button"
                  class="btn-secondary py-2 px-4 text-sm"
                  [style.background]="(isHintRevealed$ | async) ? 'rgba(56, 189, 248, 0.15)' : '#ffffff'"
                  (click)="onToggleHint()"
                >
                  <span class="material-symbols-outlined text-sm">lightbulb</span>
                  <span>{{ (isHintRevealed$ | async) ? 'إخفاء التلميح من اللاعبين' : 'إظهار التلميح للاعبين' }}</span>
                </button>

                <button
                  type="button"
                  class="btn-secondary py-2 px-4 text-sm"
                  [style.background]="(isQuestionRevealed$ | async) ? 'rgba(56, 189, 248, 0.15)' : '#ffffff'"
                  (click)="onToggleQuestionVisibility()"
                >
                  <span class="material-symbols-outlined text-sm">visibility</span>
                  <span>{{ (isQuestionRevealed$ | async) ? 'إخفاء السؤال من اللاعبين' : 'إظهار السؤال على شاشة اللاعبين' }}</span>
                </button>
              </div>

              <!-- Hint Box -->
              <div *ngIf="(currentQuestionDto$ | async)?.hint" class="hint-box w-full max-w-2xl">
                🔍 تلميح: {{ (currentQuestionDto$ | async)?.hint }}
                <span *ngIf="isHintRevealed$ | async" class="text-secondary font-bold mr-2">(ظاهر الآن للاعبين ✅)</span>
              </div>

              <!-- Timer Bar Countdown -->
              <div *ngIf="(timerSeconds$ | async) !== null" class="timer-countdown w-full max-w-xl mt-lg">
                <div class="timer-bar-container">
                  <div
                    class="timer-bar-fill"
                    [style.width.%]="getTimerPercentage(timerSeconds$ | async)"
                    [ngClass]="getTimerBarClass(timerSeconds$ | async)"
                  ></div>
                </div>
                <span class="font-headline-md text-primary text-xl mt-1">⏱️ {{ (timerSeconds$ | async) }} ثوانٍ</span>
              </div>

              <!-- Status Banner -->
              <p *ngIf="getHostStatusText()" class="status w-full max-w-2xl mt-md">
                {{ getHostStatusText() }}
              </p>

              <!-- Host Judgment & Action Controls -->
              <div class="flex flex-wrap justify-center gap-md mt-lg w-full">
                <!-- Active Buzz Winner Judgment -->
                <div *ngIf="currentSession?.buzzWinnerId" class="w-full flex flex-wrap justify-center gap-md bg-primary-container/10 p-md rounded-xl border border-primary-container/30">
                  <button type="button" class="flex items-center gap-sm bg-secondary-container text-on-secondary-container px-xl py-md rounded-lg font-headline-md text-headline-md hover:scale-105 transition-transform duration-200 shadow-active" (click)="onJudge(true)">
                    <span class="material-symbols-outlined icon-fill">check_circle</span>
                    <span>صح +1</span>
                  </button>
                  <button type="button" class="flex items-center gap-sm bg-error-container text-on-error-container px-xl py-md rounded-lg font-headline-md text-headline-md hover:scale-105 transition-transform duration-200" (click)="onJudge(false)">
                    <span class="material-symbols-outlined icon-fill">cancel</span>
                    <span>خطأ -1</span>
                  </button>
                  <button type="button" class="flex items-center gap-sm bg-surface-variant text-on-surface-variant px-xl py-md rounded-lg font-headline-md text-headline-md hover:scale-105 transition-transform duration-200" (click)="onReOpenBuzz()">
                    <span class="material-symbols-outlined">restart_alt</span>
                    <span>إعادة Buzzer</span>
                  </button>
                </div>

                <!-- General Controls -->
                <div class="w-full flex flex-wrap justify-center gap-sm mt-sm">
                  <button type="button" class="btn-secondary" (click)="onReOpenBuzz()">
                    <span class="material-symbols-outlined">lock_open</span>
                    <span>فتح الـ Buzz</span>
                  </button>
                  <button type="button" class="btn-secondary" (click)="onSkipQuestion()">
                    <span class="material-symbols-outlined">skip_next</span>
                    <span>تخطي السؤال</span>
                  </button>
                  <button *ngIf="currentSession?.isAnswered" type="button" class="btn-correct" (click)="onNextRound()">
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span>السؤال التالي</span>
                  </button>
                  <button type="button" class="btn-wrong" (click)="onEndGameClick()">
                    <span class="material-symbols-outlined">flag</span>
                    <span>إنهاء اللعبة</span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Players Grid Section (Design 10 3D Cards Grid) -->
            <section class="w-full">
              <h3 class="font-headline-md text-headline-md text-on-surface mb-md">حالة اللاعبين</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
                <div *ngFor="let s of (scoreboard$ | async)" class="bg-surface-container-lowest rounded-lg p-md border border-outline-variant/30 flex flex-col items-center text-center gap-sm relative overflow-hidden transition-all hover:-translate-y-1 shadow-sm">
                  <div class="absolute top-0 right-0 bg-primary-container text-on-primary-container text-xs px-2 py-1 rounded-bl-lg font-bold">
                    المركز #{{ s.rank }}
                  </div>
                  <div class="w-16 h-16 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center text-primary font-bold text-2xl mt-2">
                    {{ s.nickname.charAt(0) }}
                  </div>
                  <div class="w-full">
                    <p class="font-body-lg text-body-lg font-bold text-on-surface truncate">{{ s.nickname }}</p>
                    <p class="font-label-sm text-label-sm text-primary font-bold mt-1">{{ s.score }} نقطة</p>
                  </div>
                  <div class="flex gap-1 mt-1">
                    <button type="button" class="btn-correct py-1 px-3 text-xs" (click)="onAdjustScore(s.playerId, 1)">+1</button>
                    <button type="button" class="btn-wrong py-1 px-3 text-xs" (click)="onAdjustScore(s.playerId, -1)">-1</button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- Screen A: Player Buzzer Interface (Design 11 Mobile/Desktop Grid) -->
          <div *ngIf="(role$ | async) === 'player'" class="player-view grid grid-cols-1 md:grid-cols-12 gap-lg w-full">
            
            <!-- Buzzer Focus Area (md:col-span-8) -->
            <section class="md:col-span-8 flex flex-col items-center justify-center min-h-[500px] bg-surface-container-lowest rounded-xl border border-outline-variant/30 relative p-lg md:p-xl shadow-sm">
              
              <!-- Timer Bar -->
              <div *ngIf="(timerSeconds$ | async) !== null" class="w-full max-w-md mb-lg">
                <div class="flex justify-between items-end mb-xs">
                  <span class="font-label-sm text-label-sm text-on-surface-variant">الوقت المتبقي</span>
                  <span class="font-headline-md text-headline-md text-primary">{{ (timerSeconds$ | async) }}ث</span>
                </div>
                <div class="h-3 bg-surface-container rounded-full overflow-hidden w-full relative">
                  <div
                    class="absolute right-0 top-0 h-full bg-secondary-container transition-all duration-200"
                    [style.width.%]="getTimerPercentage(timerSeconds$ | async)"
                  ></div>
                </div>
              </div>

              <!-- Celebration Badge -->
              <div *ngIf="isMeAnswering() || isCracked" class="celebration-badge mb-md">
                🎉 دورك للإجابة!
              </div>

              <!-- Player Instruction Text -->
              <p class="font-headline-md text-on-surface text-center mb-md">
                {{ getPlayerInstruction() }}
              </p>

              <!-- Question Reveal Box (When Toggled by Host) -->
              <div *ngIf="isQuestionRevealed$ | async" class="glass-card p-4 rounded-xl text-center mb-md w-full max-w-md">
                <span class="category-badge mb-1">🏷️ {{ (currentQuestionDto$ | async)?.category || 'معلومات عامة' }}</span>
                <h3 class="font-headline-md text-on-surface mt-1">❓ {{ (revealedQuestionText$ | async) || (currentQuestionDto$ | async)?.question || currentSession?.currentQuestion }}</h3>
              </div>

              <!-- Broadcasted Hint Box -->
              <div *ngIf="isHintRevealed$ | async" class="hint-box w-full max-w-md mb-md text-center">
                🔍 تلميح: {{ (revealedHintText$ | async) || (currentQuestionDto$ | async)?.hint }}
              </div>

              <!-- Giant Circular Buzzer Button (Design 11 Style) -->
              <button
                type="button"
                class="w-64 h-64 rounded-full bg-primary-container text-on-primary-container flex flex-col items-center justify-center buzzer-btn transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-primary-fixed-dim"
                [disabled]="isBuzzerDisabled() && !isMeAnswering() && !isCracked"
                [ngClass]="{
                  'disabled opacity-50 grayscale': isBuzzerDisabled() && !isMeAnswering() && !isCracked,
                  'is-cracked': isMeAnswering() || isCracked
                }"
                (click)="onBuzz()"
              >
                <!-- Glass Crack Overlay -->
                <svg *ngIf="isMeAnswering() || isCracked" class="crack-overlay" viewBox="0 0 200 200">
                  <g stroke="#ffffff" stroke-width="0.5" stroke-linecap="round" fill="none">
                    <path d="M100 100 L20 15 M100 100 L180 25 M100 100 L190 130 M100 100 L130 190 M100 100 L25 170 M100 100 L10 85"/>
                    <path d="M20 15 L60 45 M180 25 L140 65 M180 120 L140 125 M130 190 L95 145 M25 170 L65 120 M10 85 L55 75"/>
                    <path d="M60 45 L90 20 M140 65 L170 95 M140 125 L165 160 M95 145 L60 180 M65 120 L30 135 M55 75 L20 50" stroke-width="2.5"/>
                  </g>
                </svg>

                <div class="buzzer-content">
                  <span class="text-5xl group-hover:scale-110 transition-transform mb-1">👊</span>
                  <span class="font-display-lg text-3xl font-extrabold">دغ دغ</span>
                </div>
              </button>

              <!-- Floating Chips -->
              <div class="absolute top-md left-md bg-tertiary-container/30 text-on-tertiary-container px-sm py-xs rounded-full font-label-sm text-label-sm flex items-center gap-xs">
                <span class="material-symbols-outlined text-sm">flag</span>
                <span>هدف الفوز: {{ currentSession?.targetPoints || 10 }}</span>
              </div>
              <div class="absolute bottom-md right-md bg-secondary-container/30 text-on-secondary-container px-sm py-xs rounded-full font-label-sm text-label-sm flex items-center gap-xs">
                <span class="material-symbols-outlined text-sm">category</span>
                <span>{{ (currentQuestionDto$ | async)?.category || 'عامة' }}</span>
              </div>
            </section>

            <!-- Leaderboard Sidebar (md:col-span-4) -->
            <aside class="md:col-span-4 flex flex-col gap-md">
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md flex flex-col gap-sm h-full shadow-sm">
                <h2 class="font-headline-md text-headline-md text-primary mb-sm border-b border-outline-variant/30 pb-sm flex items-center gap-2">
                  <span class="material-symbols-outlined">leaderboard</span>
                  <span>أعلى اللاعبين</span>
                </h2>
                <div *ngFor="let s of (scoreboard$ | async)" class="flex items-center gap-sm p-sm rounded-lg hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                  <div class="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center flex-shrink-0">
                    {{ s.nickname.charAt(0) }}
                  </div>
                  <div class="flex-1 flex flex-col">
                    <span class="font-label-sm text-label-sm text-on-surface font-bold">{{ s.nickname }}</span>
                    <span class="font-label-sm text-label-sm text-on-surface-variant text-xs">المركز #{{ s.rank }}</span>
                  </div>
                  <div class="font-headline-md text-headline-md text-primary font-bold">{{ s.score }}</div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div *ngIf="(status$ | async)?.text as statusText" class="status mt-md" [ngClass]="{ 'error': (status$ | async)?.isError }">
          {{ statusText }}
        </div>
      </main>

      <!-- Bottom Mobile Navigation Bar -->
      <nav class="md:hidden fixed bottom-0 w-full z-50 rounded-t-xl backdrop-blur-xl bg-surface/90 shadow-[0_-4px_12px_rgba(56,189,248,0.15)] flex flex-row-reverse justify-around items-center px-2 py-3 border-t border-outline-variant/20">
        <a (click)="onLeaveGame()" class="flex flex-col items-center justify-center text-on-surface-variant p-2 rounded-lg cursor-pointer">
          <span class="material-symbols-outlined mb-1">home</span>
          <span class="font-label-sm text-xs">الرئيسية</span>
        </a>
        <a class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1.5 shadow-sm cursor-pointer">
          <span class="material-symbols-outlined mb-1">sports_esports</span>
          <span class="font-label-sm text-xs">المباراة</span>
        </a>
        <a class="flex flex-col items-center justify-center text-on-surface-variant p-2 rounded-lg cursor-pointer">
          <span class="material-symbols-outlined mb-1">emoji_events</span>
          <span class="font-label-sm text-xs">النتائج</span>
        </a>
      </nav>
    </div>
  `
})
export class GameComponent implements OnInit, OnDestroy {
  private signalRService = inject(SignalRService);
  private audioService = inject(AudioService);
  private router = inject(Router);

  room$ = this.signalRService.currentRoom$;
  role$ = this.signalRService.currentRole$;
  status$ = this.signalRService.statusMessage$;
  timerSeconds$ = this.signalRService.timerSeconds$;
  scoreboard$ = this.signalRService.scoreboard$;
  lockedOutIds$ = this.signalRService.lockedOutPlayerIds$;
  currentQuestionDto$ = this.signalRService.currentQuestionDto$;
  gameSummary$ = this.signalRService.gameSummary$;
  isHintRevealed$ = this.signalRService.isHintRevealed$;
  revealedHintText$ = this.signalRService.revealedHintText$;
  isQuestionRevealed$ = this.signalRService.isQuestionRevealed$;
  revealedQuestionText$ = this.signalRService.revealedQuestionText$;

  currentSession: GameSession | null = null;
  gameSummary: GameSummaryDto | null = null;
  buzzOpen = false;
  lockedOutIds: string[] = [];
  isTimedOut = false;
  isCracked = false;
  showEndGameModal = false;
  categories: string[] = [];

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
        this.currentSession = session;

        if (session?.isEnded || session?.winnerNickname) {
          this.checkAndPlayEndGameSound(session.winnerNickname);
        }

        if (!session?.buzzWinnerId && !session?.buzzWinnerName) {
          this.isCracked = false;
        } else if (this.isMeAnswering()) {
          this.isCracked = true;
        } else {
          this.isCracked = false;
        }
      }),
      this.signalRService.gameSummary$.subscribe(summary => {
        this.gameSummary = summary;
        if (summary?.winnerNickname) {
          this.checkAndPlayEndGameSound(summary.winnerNickname);
        }
      }),
      this.signalRService.buzzOpen$.subscribe(open => {
        this.buzzOpen = open;
        if (open && (!this.currentSession || !this.currentSession.buzzWinnerId)) {
          this.isCracked = false;
        }
      }),
      this.signalRService.lockedOutPlayerIds$.subscribe(ids => {
        this.lockedOutIds = ids ?? [];
        if (!this.currentSession?.buzzWinnerId) {
          this.isCracked = false;
        }
      }),
      this.signalRService.timerSeconds$.subscribe(seconds => {
        if (seconds === 0) {
          this.isTimedOut = true;
          this.isCracked = false;
        }
      }),
      this.signalRService.currentRole$.subscribe(role => {
        if (!role) {
          this.router.navigate(['/role-selection']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  async onChangeCategory(newCategory: string): Promise<void> {
    if (!newCategory) return;
    try {
      await this.signalRService.changeCategory(newCategory);
      this.signalRService.statusMessage$.next({
        text: `🏷️ تم تغيير تصنيف الأسئلة إلى: [${newCategory}]`,
        isError: false
      });
    } catch (err) {
      console.error('Failed to change category mid-game:', err);
    }
  }


  private checkAndPlayEndGameSound(winnerNickname?: string | null): void {
    const winner = winnerNickname || this.getWinnerName();
    const myNickname = this.signalRService.currentNickname$.value;
    if (myNickname && winner) {
      if (myNickname.trim().toLowerCase() === winner.trim().toLowerCase()) {
        this.audioService.playWinnerSound();
      } else {
        this.audioService.playLoserSound();
      }
    }
  }

  isGameEnded(): boolean {
    const scores = this.signalRService.scoreboard$.value;
    const target = this.currentSession?.targetPoints || 10;
    const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
    return !!(this.gameSummary || this.currentSession?.isEnded || this.currentSession?.winnerNickname || (maxScore >= target && maxScore > 0));
  }

  getWinnerName(): string {
    const scores = this.signalRService.scoreboard$.value;
    const topPlayer = scores.length > 0 ? scores[0]?.nickname : null;
    return this.gameSummary?.winnerNickname || this.currentSession?.winnerNickname || topPlayer || 'البطل المتصدر!';
  }

  getTopPodium(): PlayerScoreDto[] {
    const scores = this.signalRService.scoreboard$.value;
    return scores.slice(0, 3);
  }

  getCorrectCount(nickname: string): number {
    if (this.gameSummary) {
      const p = this.gameSummary.leaderboard.find(l => l.nickname === nickname);
      if (p) return p.correctCount;
    }
    return this.currentSession?.correctCounts?.[nickname] ?? 0;
  }

  getWrongCount(nickname: string): number {
    if (this.gameSummary) {
      const p = this.gameSummary.leaderboard.find(l => l.nickname === nickname);
      if (p) return p.wrongCount;
    }
    return this.currentSession?.wrongCounts?.[nickname] ?? 0;
  }

  getTimerPercentage(seconds: number | null): number {
    if (seconds === null) return 100;
    const initial = this.signalRService.initialTimerDuration$.value || this.currentSession?.answerTimeoutSeconds || 5;
    const pct = (seconds / initial) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  getTimerBarClass(seconds: number | null): string {
    if (seconds === null) return '';
    const initial = this.signalRService.initialTimerDuration$.value || this.currentSession?.answerTimeoutSeconds || 5;
    const pct = (seconds / initial) * 100;
    if (pct <= 30) return 'timer-danger';
    if (pct <= 60) return 'timer-warning';
    return '';
  }

  isMeAnswering(): boolean {
    const myId = this.signalRService.connectionId;
    const myNickname = this.signalRService.currentNickname$.value;
    const winnerId = this.currentSession?.buzzWinnerId;
    const winnerName = this.currentSession?.buzzWinnerName;

    if (!winnerId && !winnerName) return false;

    const isMe = (
      (!!winnerId && winnerId.toLowerCase() === (myId?.toLowerCase() ?? '')) ||
      (!!winnerName && winnerName.toLowerCase() === (myNickname?.toLowerCase() ?? '')) ||
      (!!winnerId && winnerId.toLowerCase() === (myNickname?.toLowerCase() ?? ''))
    );

    return isMe;
  }

  isLockedOut(): boolean {
    const myId = this.signalRService.connectionId?.toLowerCase();
    const myNickname = this.signalRService.currentNickname$.value?.toLowerCase();
    const isMeLocked = this.lockedOutIds.some(id => {
      if (!id) return false;
      const lower = id.toLowerCase();
      return (!!myId && lower === myId) || (!!myNickname && lower === myNickname);
    });

    if (isMeLocked) return true;

    if (this.currentSession?.buzzWinnerId && !this.isMeAnswering()) {
      return true;
    }

    if (!this.buzzOpen && !this.currentSession?.buzzWinnerId) {
      return true;
    }

    return false;
  }

  getBuzzerContainerClass(): string {
    if (this.isMeAnswering() || this.isCracked) return 'state-answering';
    if (this.isLockedOut()) return 'state-locked';
    return '';
  }

  getLockedBannerText(): string {
    const myId = this.signalRService.connectionId;
    const myNickname = this.signalRService.currentNickname$.value;
    const isMeLocked = this.lockedOutIds.some(id => id === myId || id === myNickname);

    if (isMeLocked) {
      return 'ملحقتش للأسف! ⛔';
    }

    if (this.currentSession?.buzzWinnerId) {
      const winnerName = this.currentSession.buzzWinnerName ?? 'لاعب آخر';
      return `انتظر الإجابة... (${winnerName}) ⏳`;
    }

    return 'انتظر فتح الـ Buzz... ⏳';
  }

  getPlayerInstruction(): string {
    if (this.isMeAnswering() || this.isCracked) {
      return 'أنت الأسرع! تفضل بالإجابة الآن:';
    }
    if (this.isLockedOut()) {
      return 'تم استبعادك من هذا السؤال ⛔ (في انتظار المضيف أو بقية اللاعبين)';
    }
    if (this.buzzOpen) {
      return 'الـ Buzz مفتوح! اضغط الزر الآن!';
    }
    return 'استمع للسؤال من المضيف';
  }

  isBuzzerDisabled(): boolean {
    return (!this.buzzOpen || !!this.currentSession?.buzzWinnerId || this.isLockedOut()) && !this.isMeAnswering() && !this.isCracked;
  }

  getHostStatusText(): string {
    if (this.currentSession?.buzzWinnerId) {
      return `⚡ الأسرع ضغطاً: ${this.currentSession.buzzWinnerName ?? 'لاعب'}`;
    }
    if (this.buzzOpen) {
      return '🔔 الـ Buzz مفتوح الآن! في انتظار ضغط اللاعبين...';
    }
    return 'اضغط "فتح Buzz" للسماح للاعبين بالإجابة.';
  }

  async onToggleHint(): Promise<void> {
    await this.signalRService.toggleHint();
  }

  async onToggleQuestionVisibility(): Promise<void> {
    await this.signalRService.toggleQuestionVisibility();
  }

  async onOpenBuzz(): Promise<void> {
    this.isTimedOut = false;
    this.isCracked = false;
    await this.signalRService.openBuzz();
  }

  async onReOpenBuzz(): Promise<void> {
    this.isTimedOut = false;
    this.isCracked = false;
    await this.signalRService.reOpenBuzz();
  }

  async onSkipQuestion(): Promise<void> {
    this.isTimedOut = false;
    this.isCracked = false;
    await this.signalRService.skipQuestion();
  }

  async onNextRound(): Promise<void> {
    this.isTimedOut = false;
    this.isCracked = false;
    await this.signalRService.getNextQuestion();
  }

  onEndGameClick(): void {
    this.showEndGameModal = true;
  }

  async confirmEndGame(): Promise<void> {
    this.showEndGameModal = false;
    await this.signalRService.endGame();
  }

  cancelEndGame(): void {
    this.showEndGameModal = false;
  }

  async onRestartGame(): Promise<void> {
    this.isTimedOut = false;
    this.isCracked = false;
    await this.signalRService.resetGameSession();
  }

  async onBuzz(): Promise<void> {
    this.isCracked = true;
    try {
      this.audioService.playBuzzSound();
      await this.signalRService.buzz();
    } catch (err: any) {
      console.error('Buzz error:', err);
      this.isCracked = false;
      const errMsg = err?.message || 'عذراً، لم يتم قبول الضغطة. حاول مجدداً.';
      this.signalRService.statusMessage$.next({ text: `⚠️ ${errMsg}`, isError: true });
    }
  }

  async onJudge(isCorrect: boolean): Promise<void> {
    const winnerId = this.currentSession?.buzzWinnerId ?? this.currentSession?.buzzWinnerName;
    if (!winnerId) return;
    this.isCracked = false;
    await this.signalRService.submitJudgment(winnerId, isCorrect);
  }

  async onAdjustScore(playerId: string, delta: number): Promise<void> {
    await this.signalRService.adjustPlayerScore(playerId, delta);
  }

  async onLeaveGame(): Promise<void> {
    await this.signalRService.leaveRoom();
    this.router.navigate(['/role-selection']);
  }
}
