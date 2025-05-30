import { Routes } from '@angular/router';
import { BoatSetupComponent } from './boat-setup.component';
import { DashboardComponent } from './dashboard.component';
import { TripStartComponent } from './trip-start.component';
import { TripActiveComponent } from './trip-active.component';
import { TripCompleteComponent } from './trip-complete.component';
import { EventTankSwitchComponent } from './event-tank-switch.component';
import { TripDetailsComponent } from './trip-details.component';
import { EditTripEventComponent } from './edit-trip-event.component';
import { TripLogComponent } from './trip-log.component';
import { EditTripDetailsComponent } from './edit-trip-details.component';

// export const routes: Routes = [
//   // {
//   //   path: 'home',
//   //   loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
//   // }, 
//    {
//     path: '',
//     loadComponent: () => import('./trip-form.component').then((m) => m.TripFormComponent),
//   },

//   { path: 'log', component: TripLogComponent },
//   { path: 'summary/:id', component: TripSummaryComponent },
//   { path: 'edit/:id', component: EditTripFormComponent },

// ];





export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent //done
  },
  {
    path: 'boat-setup',
    component: BoatSetupComponent 
  },
  {
    path: 'trip-start',
    component: TripStartComponent 
  },
  {
    path: 'trip-active/:id',
    component: TripActiveComponent
  },
  {
    path: 'trip-complete/:id',
    component: TripCompleteComponent 
  },
  {
    path: 'trip-details/:id',  
    component: TripDetailsComponent
  },
  {
    path: 'edit-trip-details/:id',
    component: EditTripDetailsComponent
  },
  {
    path: 'event-tank-switch/:id',
    component: EventTankSwitchComponent
  },
  {
    path: 'edit-trip-event/:tripId/:eventIndex',
    component: EditTripEventComponent
  },
  // // Existing routes
  { path: 'log', component: TripLogComponent },
  // { path: 'summary/:id', component: TripSummaryComponent },  
  // { path: 'edit/:id', component: EditTripFormComponent },
];