import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private loserAudio: HTMLAudioElement | null = null;
  private winnerAudio: HTMLAudioElement | null = null;
  private buzzAudio: HTMLAudioElement | null = null;
  private welcomeAudio: HTMLAudioElement | null = null;
  private hasPlayedEndGameSound = false;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.loserAudio = new Audio('assets/sounds/متعيطش.mp3');
      this.loserAudio.preload = 'auto';

      this.winnerAudio = new Audio('assets/sounds/الله عليك.mp3');
      this.winnerAudio.preload = 'auto';

      this.buzzAudio = new Audio('assets/sounds/pew.mp3');
      this.buzzAudio.preload = 'auto';

      this.welcomeAudio = new Audio('assets/sounds/اهلا.mp3');
      this.welcomeAudio.preload = 'auto';
    } catch (err) {
      console.warn('[AudioService] Could not preload audio:', err);
    }
  }

  public playWinnerSound(): void {
    if (this.hasPlayedEndGameSound) return;

    try {
      if (!this.winnerAudio) {
        this.winnerAudio = new Audio('assets/sounds/الله عليك.mp3');
      }
      if (this.winnerAudio) {
        this.winnerAudio.currentTime = 0;
        this.winnerAudio.play().then(() => {
          this.hasPlayedEndGameSound = true;
          console.log('[AudioService] Playing winner sound: الله عليك.mp3');
        }).catch(err => {
          console.warn('[AudioService] Autoplay blocked or sound failed:', err);
        });
      }
    } catch (ex) {
      console.warn('[AudioService] Exception playing winner sound:', ex);
    }
  }

  public playLoserSound(): void {
    if (this.hasPlayedEndGameSound) return;

    try {
      if (!this.loserAudio) {
        this.loserAudio = new Audio('assets/sounds/متعيطش.mp3');
      }
      if (this.loserAudio) {
        this.loserAudio.currentTime = 0;
        this.loserAudio.play().then(() => {
          this.hasPlayedEndGameSound = true;
          console.log('[AudioService] Playing loser sound: متعيطش.mp3');
        }).catch(err => {
          console.warn('[AudioService] Autoplay blocked or sound failed:', err);
        });
      }
    } catch (ex) {
      console.warn('[AudioService] Exception playing loser sound:', ex);
    }
  }

  public resetLoserSoundState(): void {
    this.hasPlayedEndGameSound = false;
  }

  public playBuzzSound(): void {
    try {
      if (!this.buzzAudio) {
        this.buzzAudio = new Audio('assets/sounds/pew.mp3');
      }
      if (this.buzzAudio) {
        this.buzzAudio.currentTime = 0;
        this.buzzAudio.play().then(() => {
          console.log('[AudioService] Playing buzz sound: pew.mp3');
        }).catch(err => {
          console.warn('[AudioService] Autoplay blocked or buzz sound failed:', err);
        });
      }
    } catch (ex) {
      console.warn('[AudioService] Exception playing buzz sound:', ex);
    }
  }

  public playWelcomeSound(): void {
    try {
      if (!this.welcomeAudio) {
        this.welcomeAudio = new Audio('assets/sounds/اهلا.mp3');
      }
      if (this.welcomeAudio) {
        this.welcomeAudio.currentTime = 0;
        this.welcomeAudio.play().then(() => {
          console.log('[AudioService] Playing welcome sound: اهلا.mp3');
        }).catch(err => {
          console.warn('[AudioService] Autoplay blocked or welcome sound failed:', err);
        });
      }
    } catch (ex) {
      console.warn('[AudioService] Exception playing welcome sound:', ex);
    }
  }
}
