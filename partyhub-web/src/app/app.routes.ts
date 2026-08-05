import { Routes } from '@angular/router';
import { RoleSelectionComponent } from './pages/role-selection/role-selection.component';
import { HostSetupComponent } from './pages/host-setup/host-setup.component';
import { PlayerSetupComponent } from './pages/player-setup/player-setup.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { GameComponent } from './pages/game/game.component';

export const routes: Routes = [
  { path: '', redirectTo: 'role-selection', pathMatch: 'full' },
  { path: 'role-selection', component: RoleSelectionComponent },
  { path: 'host-setup', component: HostSetupComponent },
  { path: 'player-setup', component: PlayerSetupComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'game', component: GameComponent },
  { path: '**', redirectTo: 'role-selection' }
];
