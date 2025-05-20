import { Component, OnInit } from '@angular/core';
import { TripStorageService } from './trip-storage.service';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-trip-log',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button [routerLink]="['/']">Home</ion-button>
          <ion-button [routerLink]="['/log']">Log</ion-button>
        </ion-buttons>
        <ion-title>Trip Log</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list *ngIf="trips.length">
        <ion-item *ngFor="let trip of trips; let i = index">
          <ion-label>
            <h2>{{ trip.date }}</h2>
            <p>Center: {{ trip.center }} | Port: {{ trip.port }} | Stbd: {{ trip.stbd }}</p>
            <p><i>{{ trip.notes }}</i></p>
          </ion-label>
          <ion-button slot="end" fill="clear" color="primary" [routerLink]="['/edit', i]">Edit</ion-button>
          <ion-button slot="end" fill="clear" color="danger" (click)="deleteTrip(i)">Delete</ion-button>
        </ion-item>
      </ion-list>

      <ion-button expand="full" color="medium" [routerLink]="['/']">Add New Trip</ion-button>
    </ion-content>
  `
})
export class TripLogComponent implements OnInit {
  trips: any[] = [];

  constructor(
    private tripService: TripStorageService,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    this.trips = await this.tripService.getTrips();
  }

  async deleteTrip(index: number) {
    await this.tripService.deleteTrip(index);
    this.trips = await this.tripService.getTrips();
  }
}
