import { Routes } from '@angular/router';
import { TripLogComponent } from './trip-log.component';
import { EditTripComponent } from './edit-trip.component';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  { path: 'log', component: TripLogComponent },
  { path: 'edit/:id', component: EditTripComponent }
];
