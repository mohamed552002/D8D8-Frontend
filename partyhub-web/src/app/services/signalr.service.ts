import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { Room, GameSession, Role, PlayerScoreDto, QuestionDto, GameSummaryDto } from '../models/game.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;


  public currentRoom$ = new BehaviorSubject<Room | null>(null);
  public gameSession$ = new BehaviorSubject<GameSession | null>(null);
  public currentRole$ = new BehaviorSubject<Role | null>(null);
  public currentNickname$ = new BehaviorSubject<string>('');
  public buzzOpen$ = new BehaviorSubject<boolean>(false);
  public timerSeconds$ = new BehaviorSubject<number | null>(null);
  public initialTimerDuration$ = new BehaviorSubject<number>(5);
  public lockedOutPlayerIds$ = new BehaviorSubject<string[]>([]);
  public scoreboard$ = new BehaviorSubject<PlayerScoreDto[]>([]);
  public currentQuestionDto$ = new BehaviorSubject<QuestionDto | null>(null);
  public categories$ = new BehaviorSubject<string[]>([
    'تاريخ عربي واسلامي',
    'كرة قدم',
    'علوم وتكنولوجيا واختراعات',
    'أمثال شعبية وثقافة عامة',
    'سينما ومسلسلات مصرية',
    'افيهات افلام ومسلسلات مصريه',
    'جغرافيا ودول وعواصم',
    'أعلام ودول',
    'معلومات عامة غريبة',
    'أدب وشعر عربي',
    'ألعاب الجيمينج'
  ]);
  public gameSummary$ = new BehaviorSubject<GameSummaryDto | null>(null);

  public totalRounds$ = new BehaviorSubject<number>(10);
  public currentRoundNumber$ = new BehaviorSubject<number>(1);
  public isHintRevealed$ = new BehaviorSubject<boolean>(false);
  public revealedHintText$ = new BehaviorSubject<string | null>(null);
  public isQuestionRevealed$ = new BehaviorSubject<boolean>(false);
  public revealedQuestionText$ = new BehaviorSubject<string | null>(null);
  public statusMessage$ = new BehaviorSubject<{ text: string; isError: boolean }>({ text: '', isError: false });

  public get connectionId(): string | null {
    return this.hubConnection?.connectionId ?? null;
  }

  public get currentRoomCode(): string | null {
    return this.currentRoom$.value?.code || this.gameSession$.value?.roomId || null;
  }

  public clearStatus(): void {
    this.statusMessage$.next({ text: '', isError: false });
  }

  private cleanErrorMessage(rawMessage: string): string {
    if (!rawMessage) return 'حدث خطأ غير متوقع.';
    let clean = rawMessage;
    if (clean.includes('HubException:')) {
      clean = clean.split('HubException:')[1];
    } else if (clean.includes('An unexpected error occurred invoking')) {
      const parts = clean.split(':');
      clean = parts[parts.length - 1];
    }
    return clean.trim();
  }

  public async ensureConnection(): Promise<signalR.HubConnection> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection;
    }

    const hubUrl = environment.hubUrl;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        },
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.onreconnected(async (connectionId) => {
      console.log('SignalR reconnected with connectionId:', connectionId);
      const roomCode = this.currentRoomCode;
      const nickname = this.currentNickname$.value;
      if (roomCode && nickname && this.hubConnection) {
        try {
          await this.hubConnection.invoke('RejoinRoom', roomCode, nickname);
        } catch (e) {
          console.warn('RejoinRoom failed after reconnect:', e);
        }
      }
    });


    // SignalR Event Handlers
    this.hubConnection.on('RoomUpdated', (room: Room) => {
      this.currentRoom$.next(room);
    });

    this.hubConnection.on('GameStarted', (room: Room) => {
      this.currentRoom$.next(room);
      this.gameSummary$.next(null);
    });

    this.hubConnection.on('HostLeft', (msg: string) => {
      this.statusMessage$.next({ text: `⚠️ ${this.cleanErrorMessage(msg)}`, isError: true });
      this.clearSessionState();
    });

    this.hubConnection.on('RoomClosed', (msg: string) => {
      this.statusMessage$.next({ text: `⚠️ ${this.cleanErrorMessage(msg)}`, isError: true });
      this.clearSessionState();
    });

    this.hubConnection.on('RoundStarted', (session: GameSession) => {
      this.buzzOpen$.next(true);
      this.gameSession$.next(session);
      this.timerSeconds$.next(null);
      this.lockedOutPlayerIds$.next([]);
      this.isHintRevealed$.next(false);
      this.revealedHintText$.next(null);
      this.isQuestionRevealed$.next(false);
      this.revealedQuestionText$.next(null);
      this.currentRoundNumber$.next(session.currentRound?.number ?? 1);
      this.statusMessage$.next({ text: '🚀 بدأت جولة جديدة! الـ Buzz مفتوح للجميع.', isError: false });
    });

    this.hubConnection.on('OnQuestionLoaded', (qData: QuestionDto, roundNum: number, totalRounds: number) => {
      this.currentQuestionDto$.next(qData);
      this.currentRoundNumber$.next(roundNum);
      this.totalRounds$.next(totalRounds);
      this.isHintRevealed$.next(false);
      this.revealedHintText$.next(null);
      this.isQuestionRevealed$.next(false);
      this.revealedQuestionText$.next(null);
    });

    this.hubConnection.on('OnHintRevealed', (isRevealed: boolean, hintText: string | null) => {
      this.isHintRevealed$.next(isRevealed);
      this.revealedHintText$.next(hintText);
    });

    this.hubConnection.on('OnQuestionVisibilityChanged', (isRevealed: boolean, qText: string | null) => {
      this.isQuestionRevealed$.next(isRevealed);
      this.revealedQuestionText$.next(qText);
    });

    this.hubConnection.on('OnGameEnded', (summary: GameSummaryDto) => {
      this.gameSummary$.next(summary);
      this.statusMessage$.next({ text: `🏆 انتهت اللعبة! الفائز: ${summary.winnerNickname}`, isError: false });
    });

    this.hubConnection.on('OnSessionReset', (activePlayers: any[]) => {
      this.gameSummary$.next(null);
      this.currentQuestionDto$.next(null);
      this.timerSeconds$.next(null);
      this.lockedOutPlayerIds$.next([]);
      this.isHintRevealed$.next(false);
      this.revealedHintText$.next(null);
      this.isQuestionRevealed$.next(false);
      this.revealedQuestionText$.next(null);
      this.statusMessage$.next({ text: '🔄 تم إعادة تصفير المباراة وبدء جولة جديدة!', isError: false });
    });

    this.hubConnection.on('BuzzOpened', (session: GameSession) => {
      this.buzzOpen$.next(true);
      this.gameSession$.next(session);
      this.lockedOutPlayerIds$.next(session.lockedOutPlayerIds ?? []);
      this.timerSeconds$.next(null);
    });

    this.hubConnection.on('BuzzWinner', (session: GameSession) => {
      this.buzzOpen$.next(true);
      this.gameSession$.next(session);
      if (session.buzzWinnerName) {
        this.statusMessage$.next({ text: `⚡ الأسرع ضغطاً: ${session.buzzWinnerName}`, isError: false });
      }
    });

    // Server-Synced Timer Events
    const handleTimerStart = (duration: number) => {
      this.initialTimerDuration$.next(duration);
      this.timerSeconds$.next(duration);
    };
    const handleTimerTick = (secondsRemaining: number) => {
      this.timerSeconds$.next(secondsRemaining);
    };

    this.hubConnection.on('OnTimerStarted', handleTimerStart);
    this.hubConnection.on('TimerStarted', handleTimerStart);

    this.hubConnection.on('OnTimerTick', handleTimerTick);
    this.hubConnection.on('TimerTick', handleTimerTick);

    // Judgment Events
    const handleJudgment = (playerId: string, isCorrect: boolean, newScore: number) => {
      const isMe = playerId === this.connectionId || playerId === this.currentNickname$.value;
      if (this.gameSession$.value) {
        const current = this.gameSession$.value;
        this.gameSession$.next({
          ...current,
          buzzWinnerId: null,
          buzzWinnerName: null
        });
      }
      if (isCorrect) {
        this.statusMessage$.next({
          text: isMe ? '🎉 إجابة صحيحة! (+1 نقطة)' : `✅ إجابة صحيحة من اللاعب (+1 نقطة). تم إعادة فتح الـ Buzz.`,
          isError: false
        });
      } else {
        this.statusMessage$.next({
          text: isMe ? '❌ إجابة خاطئة! (-1 نقطة)' : `❌ إجابة خاطئة (-1 نقطة). تم إعادة فتح الـ Buzz.`,
          isError: true
        });
      }
    };

    this.hubConnection.on('OnJudgmentSubmitted', handleJudgment);
    this.hubConnection.on('JudgmentSubmitted', handleJudgment);

    // Lockout Events
    const handleLockout = (playerId: string) => {
      const current = this.lockedOutPlayerIds$.value;
      if (!current.includes(playerId)) {
        this.lockedOutPlayerIds$.next([...current, playerId]);
      }
    };

    this.hubConnection.on('OnPlayerLockedOut', handleLockout);
    this.hubConnection.on('PlayerLockedOut', handleLockout);

    // Scoreboard Events
    const handleScoreboard = (scores: PlayerScoreDto[]) => {
      this.scoreboard$.next(scores);
    };

    this.hubConnection.on('OnScoreboardUpdated', handleScoreboard);
    this.hubConnection.on('ScoreboardUpdated', handleScoreboard);

    // ReBuzz Events
    const handleReBuzz = (lockedOutIds: string[]) => {
      this.lockedOutPlayerIds$.next(lockedOutIds ?? []);
      this.buzzOpen$.next(true);
      this.timerSeconds$.next(null);
      if (this.gameSession$.value) {
        const current = this.gameSession$.value;
        this.gameSession$.next({
          ...current,
          buzzWinnerId: null,
          buzzWinnerName: null,
          lockedOutPlayerIds: lockedOutIds ?? []
        });
      }
      this.statusMessage$.next({ text: '🔔 تم إعادة فتح الـ Buzz للجميع!', isError: false });
    };

    this.hubConnection.on('OnReBuzzOpened', handleReBuzz);
    this.hubConnection.on('ReBuzzOpened', handleReBuzz);

    this.hubConnection.on('Error', (message: string) => {
      this.statusMessage$.next({ text: this.cleanErrorMessage(message), isError: true });
    });

    this.hubConnection.onclose(() => {
      this.statusMessage$.next({ text: 'انقطع الاتصال بالخادم.', isError: true });
    });

    await this.hubConnection.start();
    this.statusMessage$.next({ text: 'تم الاتصال بـ PartyHub بنجاح.', isError: false });
    return this.hubConnection;
  }

  public async createRoom(nickname: string): Promise<string> {
    this.currentNickname$.next(nickname);
    this.currentRole$.next('host');
    const hub = await this.ensureConnection();
    try {
      const roomCode = await hub.invoke<string>('CreateRoom', nickname);
      if (!this.currentRoom$.value) {
        this.currentRoom$.next({
          code: roomCode,
          players: [{ connectionId: hub.connectionId!, nickname, isHost: true }],
          isFull: false,
          status: 0
        });
      }
      return roomCode;
    } catch (err: any) {
      const msg = this.cleanErrorMessage(err?.message ?? String(err));
      this.statusMessage$.next({ text: msg, isError: true });
      throw new Error(msg);
    }
  }

  public async joinRoom(roomCode: string, nickname: string): Promise<Room> {
    this.currentNickname$.next(nickname);
    this.currentRole$.next('player');
    const hub = await this.ensureConnection();
    try {
      const room = await hub.invoke<Room>('JoinRoom', roomCode, nickname);
      this.currentRoom$.next(room);
      return room;
    } catch (err: any) {
      const msg = this.cleanErrorMessage(err?.message ?? String(err));
      this.statusMessage$.next({ text: msg, isError: true });
      throw new Error(msg);
    }
  }

  public async getCategories(): Promise<string[]> {
    try {
      const hub = await this.ensureConnection();
      const fetched = await hub.invoke<string[]>('GetCategories');
      if (fetched && fetched.length > 0) {
        this.categories$.next(fetched);
        return fetched;
      }
    } catch {
      // Return cached categories if network is connecting
    }
    return this.categories$.value;
  }


  public async changeCategory(category: string): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('ChangeCategory', roomCode, category);
  }

  public async startGame(targetPoints: number = 10, answerTimeoutSeconds: number = 5, totalRounds: number = 10, category: string = 'جميع التصنيفات'): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('StartGame', roomCode, targetPoints, answerTimeoutSeconds, totalRounds, category);
  }



  public async toggleHint(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('ToggleHint', roomCode);
  }

  public async toggleQuestionVisibility(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('ToggleQuestionVisibility', roomCode);
  }

  public async getNextQuestion(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('GetNextQuestion', roomCode);
  }

  public async endGame(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('EndGame', roomCode);
  }

  public async resetGameSession(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('ResetGameSession', roomCode);
  }

  public async restartGame(): Promise<void> {
    await this.resetGameSession();
  }

  public async adjustPlayerScore(playerId: string, delta: number): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('AdjustPlayerScore', roomCode, playerId, delta);
  }

  public async openBuzz(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('OpenBuzz', roomCode);
  }

  public async buzz(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const nickname = this.currentNickname$.value;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('Buzz', roomCode, nickname);
  }

  public async startAnswerTimer(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('StartAnswerTimer', roomCode);
  }

  public async submitJudgment(playerId: string, isCorrect: boolean): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('SubmitJudgment', roomCode, playerId, isCorrect);
  }

  public async reOpenBuzz(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('ReOpenBuzz', roomCode);
  }

  public async skipQuestion(): Promise<void> {
    const roomCode = this.currentRoomCode;
    const hub = await this.ensureConnection();
    if (!roomCode) return;
    await hub.invoke('SkipQuestion', roomCode);
  }

  public async nextRound(): Promise<void> {
    await this.getNextQuestion();
  }

  public async leaveRoom(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveRoom');
      } catch {
        // ignore
      }
    }
    this.clearSessionState();
  }

  private clearSessionState(): void {
    this.currentRoom$.next(null);
    this.gameSession$.next(null);
    this.currentRole$.next(null);
    this.gameSummary$.next(null);
    this.currentQuestionDto$.next(null);
    this.isHintRevealed$.next(false);
    this.revealedHintText$.next(null);
    this.isQuestionRevealed$.next(false);
    this.revealedQuestionText$.next(null);
    this.scoreboard$.next([]);
    this.lockedOutPlayerIds$.next([]);
    this.timerSeconds$.next(null);
  }
}
