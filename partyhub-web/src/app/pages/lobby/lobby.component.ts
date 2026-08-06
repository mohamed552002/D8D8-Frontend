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
    <div class="shell">
      <main class="panel" style="max-width: 650px;">
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p class="subtitle" style="margin: 0; font-size: 0.95rem;">رمز الغرفة</p>
              <h2 class="brand-title" style="font-size: 2.2rem; margin: 0;">
                {{ (room$ | async)?.code ? 'غرفة ' + (room$ | async)?.code : 'غرفة --' }}
              </h2>
            </div>
            <div class="player-tag" style="font-size: 1rem; padding: 0.5rem 1rem;">
              {{ (room$ | async)?.players?.length ?? 0 }} / 8 لاعبين
            </div>
          </div>

          <!-- Host Game Settings Options -->
          <div *ngIf="(role$ | async) === 'host'" class="question-card" style="display: flex; flex-direction: column; gap: 1rem; background: rgba(11, 15, 25, 0.5); padding: 1.2rem; border-radius: 16px;">
            <h3 style="font-size: 1.1rem; color: var(--sky-blue); font-weight: 700;">⚙️ إعدادات اللعبة:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div style="display: flex; flex-direction: column; gap: 0.4rem; text-align: right;">
                <label for="targetPoints" style="font-size: 0.9rem; font-weight: 700; color: #FFFFFF;">نقاط الفوز (Target Score):</label>
                <input
                  id="targetPoints"
                  type="number"
                  class="input-field"
                  [(ngModel)]="targetPoints"
                  min="1"
                  max="100"
                  style="text-align: center; font-weight: 900; font-size: 1.1rem;"
                />
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.4rem; text-align: right;">
                <label for="answerTimeout" style="font-size: 0.9rem; font-weight: 700; color: #FFFFFF;">مدة الـ Buzz (بالثواني):</label>
                <input
                  id="answerTimeout"
                  type="number"
                  class="input-field"
                  [(ngModel)]="answerTimeoutSeconds"
                  min="3"
                  max="30"
                  style="text-align: center; font-weight: 900; font-size: 1.1rem;"
                />
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.4rem; text-align: right; grid-column: span 2;">
                <label for="categorySelect" style="font-size: 0.9rem; font-weight: 700; color: #FFFFFF;">🎯 تصنيف الأسئلة (Category):</label>
                <select
                  id="categorySelect"
                  class="input-field"
                  [(ngModel)]="selectedCategory"
                  style="font-size: 1rem; font-weight: 700; background: rgba(20, 26, 45, 0.9); color: #FFF; border-color: var(--sky-blue); cursor: pointer;"
                >
                  <option value="جميع التصنيفات">جميع التصنيفات (كل المجالات)</option>
                  <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                </select>
              </div>
            </div>
          </div>

          <div *ngIf="(role$ | async) === 'host'" style="display: flex; flex-direction: column; align-items: center; gap: 0.6rem; width: 100%; margin-top: 0.5rem;">
            <div style="display: flex; gap: 1rem; width: 100%; justify-content: center;">
              <button
                class="btn-primary"
                type="button"
                [disabled]="!canStartGame()"
                [style.opacity]="canStartGame() ? '1' : '0.45'"
                [style.cursor]="canStartGame() ? 'pointer' : 'not-allowed'"
                [style.filter]="canStartGame() ? 'none' : 'grayscale(0.5)'"
                (click)="onStartRound()"
              >
                بدء اللعبة 🚀
              </button>
              <button class="btn-secondary" type="button" (click)="onLeaveRoom()">مغادرة</button>
            </div>
            <p *ngIf="!canStartGame()" style="font-size: 0.85rem; color: #E94E77; font-weight: 700; margin: 0; text-align: center;">
              ⚠️ يلزم انضمام لاعبين اثنين على الأقل لبدء اللعبة
            </p>
          </div>

          <div *ngIf="(role$ | async) !== 'host'" style="display: flex; gap: 1rem; width: 100%; justify-content: center; margin-top: 0.5rem;">
            <button class="btn-secondary" type="button" (click)="onLeaveRoom()">مغادرة الغرفة</button>
          </div>

          <div style="width: 100%; margin-top: 0.5rem;">
            <h3 style="color: var(--sky-blue); font-size: 1.1rem; margin-bottom: 0.8rem; text-align: right;">
              اللاعبين المُنضمين:
            </h3>
            <ul class="leaderboard-list">
              <li *ngFor="let p of (room$ | async)?.players" class="leaderboard-item">
                <span style="font-weight: 700;">{{ p.nickname }}</span>
                <span class="player-tag">{{ p.isHost ? 'المضيف 🎤' : 'لاعب 📱' }}</span>
              </li>
            </ul>
          </div>

          <div *ngIf="(status$ | async)?.text as statusText" class="status" [ngClass]="{ 'error': (status$ | async)?.isError }">
            {{ statusText }}
          </div>
        </div>
      </main>
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
