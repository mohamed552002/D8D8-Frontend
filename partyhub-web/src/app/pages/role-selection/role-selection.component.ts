import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  template: `
    <div class="shell">
      <main class="panel">
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2rem;">
          <div>
            <h1 class="brand-title" style="font-size: 3rem;">دغ دغ</h1>
            <p class="subtitle" style="font-size: 1.2rem;">لعبة التحدي والسرعة التفاعلية - اختر دورك للبدء</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; width: 100%; max-width: 550px;">
            <!-- Host Card -->
            <button type="button" class="card-option host-card" (click)="selectRole('host')">
              <span style="font-size: 3.5rem;">🎤</span>
              <span style="font-size: 1.5rem; font-weight: 900; color: #FFFFFF;">مضيف (Host)</span>
              <span style="font-size: 0.95rem; color: var(--sky-blue);">قم بإنشاء غرفة وإدارة التحدي والأطباق</span>
            </button>

            <!-- Player Card -->
            <button type="button" class="card-option player-card" (click)="selectRole('player')">
              <span style="font-size: 3.5rem;">📱</span>
              <span style="font-size: 1.5rem; font-weight: 900; color: #FFFFFF;">لاعب (Player)</span>
              <span style="font-size: 0.95rem; color: var(--sky-blue);">ادخل رمز الغرفة واضغط على الـ Buzz بسرعة</span>
            </button>
          </div>
        </div>
      </main>
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
