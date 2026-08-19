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
    <div class="shell">
      <main class="panel" style="max-width: 850px;">

        <!-- End Game Confirmation Modal Popup -->
        <div *ngIf="showEndGameModal" class="modal-overlay">
          <div class="modal-card">
            <h3 style="font-size: 1.6rem; color: #FFFFFF; font-weight: 900; margin-bottom: 0.8rem;">
              🏁 تأكيد إنهاء اللعبة
            </h3>
            <p style="font-size: 1.1rem; color: #D3D3D3; margin-bottom: 1.8rem;">
              هل أنت متأكد من إنهاء اللعبة الآن وعرض منصة الفائزين والتتويج؟
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <button
                type="button"
                class="btn-wrong"
                style="font-size: 1.05rem; padding: 0.8rem 1.6rem; background: #E94E77;"
                (click)="confirmEndGame()"
              >
                نعم، إنهاء اللعبة 🏁
              </button>
              <button
                type="button"
                class="btn-secondary"
                style="font-size: 1.05rem; padding: 0.8rem 1.6rem;"
                (click)="cancelEndGame()"
              >
                إلغاء ❌
              </button>
            </div>
          </div>
        </div>

        <!-- Standalone Game Over Victory Screen with 3-Place Podium -->
        <div *ngIf="isGameEnded()" class="victory-screen">
          <div class="question-card" style="text-align: center; padding: 2.5rem 1.5rem; border-radius: 24px; background: linear-gradient(135deg, var(--primary-electric), #8B5CF6); border: 2px solid var(--soft-lavender); box-shadow: 0 20px 40px rgba(27, 78, 245, 0.4);">
            <h1 style="font-size: 2.8rem; color: #FFFFFF; font-weight: 900; margin-bottom: 0.3rem;">🏆 انتهت المباراة!</h1>
            <p style="font-size: 1.6rem; color: var(--soft-lavender); font-weight: 900; margin-bottom: 1.5rem;">
              🎉 الفائز المستحق بالتحدي: {{ getWinnerName() }}
            </p>

            <!-- 1st, 2nd, 3rd Podium Callouts -->
            <div *ngIf="getTopPodium().length > 0" class="podium-container">

              <!-- 2nd Place (Silver) -->
              <div *ngIf="getTopPodium()[1] as p2" class="podium-card rank-2">
                <div style="font-size: 2.2rem; margin-bottom: 0.3rem;">🥈</div>
                <div class="player-tag" style="background: #9CA3AF; color: white;">المركز الثاني</div>
                <h3 style="font-size: 1.3rem; margin: 0.6rem 0 0.2rem 0; color: white;">{{ p2.nickname }}</h3>
                <p style="font-size: 1.2rem; font-weight: 900; color: #9CA3AF; margin: 0;">{{ p2.score }} نقطة</p>
              </div>

              <!-- 1st Place (Gold) -->
              <div *ngIf="getTopPodium()[0] as p1" class="podium-card rank-1">
                <div style="font-size: 3rem; margin-bottom: 0.3rem;">👑 🥇</div>
                <div class="player-tag" style="background: #F59E0B; color: black; font-weight: 900;">البطل الأول</div>
                <h2 style="font-size: 1.6rem; margin: 0.6rem 0 0.2rem 0; color: #FFF; font-weight: 900;">{{ p1.nickname }}</h2>
                <p style="font-size: 1.4rem; font-weight: 900; color: #F59E0B; margin: 0;">{{ p1.score }} نقطة</p>
              </div>

              <!-- 3rd Place (Bronze) -->
              <div *ngIf="getTopPodium()[2] as p3" class="podium-card rank-3">
                <div style="font-size: 2.2rem; margin-bottom: 0.3rem;">🥉</div>
                <div class="player-tag" style="background: #D97706; color: white;">المركز الثالث</div>
                <h3 style="font-size: 1.3rem; margin: 0.6rem 0 0.2rem 0; color: white;">{{ p3.nickname }}</h3>
                <p style="font-size: 1.2rem; font-weight: 900; color: #D97706; margin: 0;">{{ p3.score }} نقطة</p>
              </div>

            </div>

            <!-- Detailed Final Summary Table -->
            <div class="mini-leaderboard" style="margin-bottom: 2rem; text-align: right; background: rgba(11, 15, 25, 0.7); padding: 1.5rem; border-radius: 16px;">
              <h4 class="leaderboard-title" style="font-size: 1.2rem;">📊 ملخص إحصائيات المباراة</h4>
              <ul class="leaderboard-list">
                <li *ngFor="let s of (scoreboard$ | async)" class="leaderboard-item" style="padding: 0.8rem 1rem;">
                  <span style="display: flex; align-items: center; gap: 0.8rem;">
                    <span class="player-tag">#{{ s.rank }}</span>
                    <span style="font-weight: 700; font-size: 1.1rem;">{{ s.nickname }}</span>
                  </span>
                  <div style="display: flex; align-items: center; gap: 1.2rem;">
                    <span style="font-size: 0.9rem; color: #10B981;">صح: {{ getCorrectCount(s.nickname) }}</span>
                    <span style="font-size: 0.9rem; color: #EF4444;">خطأ: {{ getWrongCount(s.nickname) }}</span>
                    <span class="player-score" style="font-size: 1.2rem; font-weight: 900;">{{ s.score }} نقطة</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Victory Action Controls -->
            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
              <button
                *ngIf="(role$ | async) === 'host'"
                type="button"
                class="btn-primary"
                style="font-size: 1.2rem; padding: 1rem 2rem; background: var(--primary-electric);"
                (click)="onRestartGame()"
              >
                العب مرة ثانية 🔄
              </button>

              <button
                type="button"
                class="btn-secondary"
                style="font-size: 1.2rem; padding: 1rem 2rem; background: rgba(255, 255, 255, 0.1); color: white; border-color: rgba(255, 255, 255, 0.3);"
                (click)="onLeaveGame()"
              >
                العودة للشاشة الرئيسية 🏠
              </button>
            </div>
          </div>
        </div>

        <!-- Active Game Play Area (Hidden when Game Ends) -->
        <div *ngIf="!isGameEnded()">
          <!-- Screen B: Host Controller Interface -->
          <div *ngIf="(role$ | async) === 'host'" class="host-controller">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 class="brand-title" style="font-size: 1.8rem; margin: 0;">لوحة المضيف</h2>
                <p class="subtitle" style="margin: 0; font-size: 0.95rem;">
                  🎯 هدف الفوز: <strong style="color: #FFD700; font-weight: 900;">{{ currentSession?.targetPoints || 10 }} نقاط</strong>
                </p>
              </div>
              <button type="button" class="btn-secondary" (click)="onLeaveGame()">مغادرة</button>
            </div>

            <div class="question-card">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 0.95rem; font-weight: 700; color: var(--sky-blue);">🏷️ تصنيف الأسئلة:</span>
                  <select
                    class="category-select-badge"
                    [ngModel]="currentSession?.selectedCategory || 'جميع التصنيفات'"
                    (ngModelChange)="onChangeCategory($event)"
                    style="background: rgba(20, 26, 45, 0.95); color: #FFD700; border: 1.5px solid var(--sky-blue); padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: 800; font-size: 0.95rem; cursor: pointer; outline: none;"
                  >
                    <option value="جميع التصنيفات">جميع التصنيفات (كل المجالات)</option>
                    <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                  </select>
                </div>
                <span class="player-tag" style="font-size: 0.85rem; background: rgba(255, 215, 0, 0.15); color: #FFD700; border-color: rgba(255, 215, 0, 0.4);">
                  سؤال الجولة: {{ (currentQuestionDto$ | async)?.category || 'عامة' }}
                </span>
              </div>


              <h3 class="question-title" style="font-size: 1.5rem; margin: 0.8rem 0 0.5rem 0;">
                {{ (currentQuestionDto$ | async)?.question || currentSession?.currentQuestion || 'استمع إلى السؤال من المضيف' }}
              </h3>

              <!-- Dynamic Answer Display -->
              <div class="answer-highlight-box">
                💡 الإجابة الصحيحة: <span style="font-weight: 900;">{{ (currentQuestionDto$ | async)?.answer || currentSession?.currentAnswer || 'غير متاح' }}</span>
              </div>

              <!-- Host Interactive Control Toggles for Hint & Question -->
              <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.8rem;">
                <button
                  *ngIf="(currentQuestionDto$ | async)?.hint"
                  type="button"
                  class="btn-secondary"
                  [style.background]="(isHintRevealed$ | async) ? 'rgba(244, 206, 255, 0.3)' : 'transparent'"
                  style="font-size: 0.9rem; padding: 0.5rem 1rem; border-color: var(--soft-lavender); color: var(--soft-lavender);"
                  (click)="onToggleHint()"
                >
                  {{ (isHintRevealed$ | async) ? 'إخفاء التلميح من شاشة اللاعبين 💡' : 'إظهار التلميح للاعبين 💡' }}
                </button>

                <button
                  type="button"
                  class="btn-secondary"
                  [style.background]="(isQuestionRevealed$ | async) ? 'rgba(56, 116, 255, 0.3)' : 'transparent'"
                  style="font-size: 0.9rem; padding: 0.5rem 1rem; border-color: var(--sky-blue); color: #FFF;"
                  (click)="onToggleQuestionVisibility()"
                >
                  {{ (isQuestionRevealed$ | async) ? 'إخفاء السؤال من شاشة اللاعبين 👁️' : 'إظهار السؤال على شاشة اللاعبين 👁️' }}
                </button>
              </div>

              <!-- Host Hint View Box: Always visible to host if hint exists -->
              <div *ngIf="(currentQuestionDto$ | async)?.hint" class="hint-box">
                🔍 تلميح: {{ (currentQuestionDto$ | async)?.hint }}
                <span *ngIf="isHintRevealed$ | async" style="color: #10B981; font-weight: 900; margin-right: 0.5rem;">(ظاهر الآن للاعبين ✅)</span>
              </div>

              <!-- Server Synced Visual Timer Animation -->
              <div *ngIf="(timerSeconds$ | async) !== null" class="timer-countdown" style="margin-top: 1rem;">
                <div class="timer-bar-container">
                  <div
                    class="timer-bar-fill"
                    [style.width.%]="getTimerPercentage(timerSeconds$ | async)"
                    [ngClass]="getTimerBarClass(timerSeconds$ | async)"
                  ></div>
                </div>
                <span style="font-size: 1.3rem;">⏱️ {{ (timerSeconds$ | async) }} ثوانٍ</span>
              </div>

              <p *ngIf="getHostStatusText()" class="status" style="margin-top: 0.5rem;">
                {{ getHostStatusText() }}
              </p>
            </div>

            <!-- Host Action Buttons -->
            <div class="host-action-bar" style="display: flex; flex-direction: column; gap: 1rem;">
              <!-- Active Buzz Judgment Group (When a player buzzed) -->
              <div *ngIf="currentSession?.buzzWinnerId" style="display: flex; flex-wrap: wrap; gap: 0.8rem; width: 100%; justify-content: center; background: rgba(56, 116, 255, 0.1); padding: 1rem; border-radius: 16px; border: 1px solid var(--mid-blue);">
                <button type="button" class="btn-correct" style="font-size: 1.1rem; padding: 0.9rem 1.6rem;" (click)="onJudge(true)">
                  صح +1 ✅ (إعادة فتح Buzz)
                </button>
                <button type="button" class="btn-wrong" style="font-size: 1.1rem; padding: 0.9rem 1.6rem;" (click)="onJudge(false)">
                  خطأ -1 ❌ (استبعاد وإعادة فتح)
                </button>
                <button type="button" class="btn-secondary" style="border-color: var(--sky-blue); color: var(--sky-blue); font-size: 1.1rem; padding: 0.9rem 1.6rem;" (click)="onReOpenBuzz()">
                  إعادة فتح Buzz 🔄 (بدون نقاط)
                </button>
              </div>

              <!-- General Control Bar -->
              <div style="display: flex; flex-wrap: wrap; gap: 0.8rem; width: 100%; justify-content: space-between; align-items: center;">

                <!-- ReOpen Buzz Button: Always available to host during active round -->
                <button
                  type="button"
                  class="btn-secondary"
                  style="border-color: var(--sky-blue); color: var(--sky-blue); font-weight: 800;"
                  (click)="onReOpenBuzz()"
                >
                  إعادة فتح الـ Buzz 🔄
                </button>

                <button
                  type="button"
                  class="btn-secondary"
                  style="background: rgba(244, 206, 255, 0.15); color: var(--soft-lavender); border-color: var(--soft-lavender);"
                  (click)="onSkipQuestion()"
                >
                  تخطي السؤال ⏭️
                </button>

                <!-- Next Question Button: Only visible after answering the question correctly -->
                <button
                  *ngIf="currentSession?.isAnswered"
                  type="button"
                  class="btn-secondary"
                  style="background: rgba(16, 185, 129, 0.2); color: #10B981; border-color: #10B981;"
                  (click)="onNextRound()"
                >
                  السؤال التالي ➡️
                </button>

                <!-- Explicit End Game Button with Confirmation Modal Trigger -->
                <button
                  type="button"
                  class="btn-secondary"
                  style="background: rgba(239, 68, 68, 0.15); color: #EF4444; border-color: #EF4444;"
                  (click)="onEndGameClick()"
                >
                  إنهاء اللعبة 🏁
                </button>
              </div>
            </div>

            <!-- Live Scoreboard with Manual +/- Controls for Host -->
            <div class="mini-leaderboard" style="margin-top: 1rem;">
              <h4 class="leaderboard-title">🏆 لائحة المتصدرين وتعديل النقاط</h4>
              <ul class="leaderboard-list">
                <li *ngFor="let s of (scoreboard$ | async)" class="leaderboard-item" style="padding: 0.7rem 1rem;">
                  <span style="display: flex; align-items: center; gap: 0.6rem;">
                    <span class="player-tag">#{{ s.rank }}</span>
                    <span style="font-weight: 700;">{{ s.nickname }}</span>
                    <span *ngIf="s.lastScoreChange > 0" style="color: #10B981; font-weight: 900;">(+1)</span>
                    <span *ngIf="s.lastScoreChange < 0" style="color: #EF4444; font-weight: 900;">(-1)</span>
                  </span>

                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="player-score" style="font-size: 1.1rem; font-weight: 900;">{{ s.score }} نقطة</span>
                    <div style="display: flex; gap: 0.3rem;">
                      <button type="button" class="btn-correct" style="padding: 0.2rem 0.6rem; font-size: 0.9rem;" (click)="onAdjustScore(s.playerId, 1)">+1</button>
                      <button type="button" class="btn-wrong" style="padding: 0.2rem 0.6rem; font-size: 0.9rem;" (click)="onAdjustScore(s.playerId, -1)">-1</button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Screen A: Player Buzzer Interface -->
          <div *ngIf="(role$ | async) === 'player'" class="player-view">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <span class="player-tag">شاشة اللاعب 📱</span>
                <span style="margin-right: 0.8rem; font-size: 0.95rem; color: #FFD700; font-weight: 700;">
                  🎯 هدف الفوز: {{ currentSession?.targetPoints || 10 }} نقاط
                </span>
              </div>
              <button type="button" class="btn-secondary" (click)="onLeaveGame()">مغادرة</button>
            </div>

            <!-- Broadcasted Question Text Box on Player View (When Host Toggles Question Reveal) -->
            <div *ngIf="isQuestionRevealed$ | async" class="question-card" style="margin-bottom: 1.2rem; background: rgba(27, 78, 245, 0.2); border: 2px solid var(--primary-electric); text-align: center; padding: 1.2rem;">
              <span class="category-badge" style="margin-bottom: 0.5rem;">
                🏷️ {{ (currentQuestionDto$ | async)?.category || 'معلومات عامة' }}
              </span>
              <h3 style="font-size: 1.4rem; color: #FFFFFF; font-weight: 900; margin: 0.4rem 0 0 0;">
                ❓ {{ (revealedQuestionText$ | async) || (currentQuestionDto$ | async)?.question || currentSession?.currentQuestion }}
              </h3>
            </div>

            <div class="player-buzzer-container" [ngClass]="getBuzzerContainerClass()">
              <!-- State 3: Locked Out Overlay -->

              <!-- State 2: Celebration Badge -->
              <div *ngIf="isMeAnswering() || isCracked" class="celebration-badge">
                🎉 دورك للإجابة!
              </div>

              <!-- State 1: Giant Circular Buzzer Button -->
              <p class="subtitle" style="text-align: center; margin-bottom: 0.8rem;">
                {{ getPlayerInstruction() }}
              </p>

              <!-- Category Badge for Player (When Question text is not toggled) -->
              <div *ngIf="!(isQuestionRevealed$ | async)" style="text-align: center; margin-bottom: 1rem;">
                <span class="category-badge">
                  🏷️ {{ (currentQuestionDto$ | async)?.category || 'معلومات عامة' }}
                </span>
              </div>

              <!-- Broadcasted Hint Box on Player View (When Host Toggles Hint) -->
              <div *ngIf="isHintRevealed$ | async" class="hint-box" style="margin-bottom: 1.2rem; text-align: center;">
                🔍 تلميح: {{ (revealedHintText$ | async) || (currentQuestionDto$ | async)?.hint }}
              </div>

              <!-- Giant Circular Buzzer Button with First Version Glass Crack Animation -->
              <button
                type="button"
                class="buzzer-btn"
                [disabled]="isBuzzerDisabled() && !isMeAnswering() && !isCracked"
                [ngClass]="{
                  'disabled': isBuzzerDisabled() && !isMeAnswering() && !isCracked,
                  'is-cracked': isMeAnswering() || isCracked
                }"
                (click)="onBuzz()"
              >
                <!-- First Version Glass Crack Lines SVG Overlay -->
                <svg *ngIf="isMeAnswering() || isCracked" class="crack-overlay" viewBox="0 0 200 200">
                  <g stroke="#FFFFFF" stroke-width="0.5" stroke-linecap="round" fill="none">
                    <path d="M100 100 L20 15 M100 100 L180 25 M100 100 L190 130 M100 100 L130 190 M100 100 L25 170 M100 100 L10 85"/>
                    <path d="M20 15 L60 45 M180 25 L140 65 M180 120 L140 125 M130 190 L95 145 M25 170 L65 120 M10 85 L55 75"/>
                    <path d="M60 45 L90 20 M140 65 L170 95 M140 125 L165 160 M95 145 L60 180 M65 120 L30 135 M55 75 L20 50" stroke-width="2.5"/>
                  </g>
                </svg>

                <div class="buzzer-content">
                  <span class="palm-icon">👊</span>
                  <span class="buzzer-text">دغ دغ</span>
                </div>
              </button>

              <!-- Visual Animated Countdown Bar -->
              <div *ngIf="(timerSeconds$ | async) !== null" class="timer-countdown">
                <div class="timer-bar-container">
                  <div
                    class="timer-bar-fill"
                    [style.width.%]="getTimerPercentage(timerSeconds$ | async)"
                    [ngClass]="getTimerBarClass(timerSeconds$ | async)"
                  ></div>
                </div>
                <span style="font-size: 1.3rem;">⏱️ {{ (timerSeconds$ | async) }} ثوانٍ</span>
              </div>
            </div>

            <!-- Live Scoreboard for Player -->
            <div class="mini-leaderboard" style="margin-top: 1.5rem;">
              <h4 class="leaderboard-title">🏆 نتائج المتصدرين والترتيب</h4>
              <ul class="leaderboard-list">
                <li *ngFor="let s of (scoreboard$ | async)" class="leaderboard-item">
                  <span style="display: flex; align-items: center; gap: 0.6rem;">
                    <span class="player-tag">#{{ s.rank }}</span>
                    <span style="font-weight: 700;">{{ s.nickname }}</span>
                    <span *ngIf="s.lastScoreChange > 0" style="color: #10B981; font-weight: 900;">(+1)</span>
                    <span *ngIf="s.lastScoreChange < 0" style="color: #EF4444; font-weight: 900;">(-1)</span>
                  </span>
                  <span class="player-score" style="font-size: 1.1rem; font-weight: 900;">{{ s.score }} نقطة</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div *ngIf="(status$ | async)?.text as statusText" class="status" [ngClass]="{ 'error': (status$ | async)?.isError }" style="margin-top: 1rem;">
          {{ statusText }}
        </div>
      </main>
    </div>
  `
})
export class GameComponent implements OnInit, OnDestroy {
  private signalRService = inject(SignalRService);
  private audioService = inject(AudioService);
  private router = inject(Router);

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
