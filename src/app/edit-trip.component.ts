import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TripStorageService } from './trip-storage.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Edit Trip</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" *ngIf="trip">
      <ion-item>
        <ion-label position="stacked">Center Tank (gal)</ion-label>
        <ion-input type="number" [(ngModel)]="trip.center"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Port Saddle (gal)</ion-label>
        <ion-input type="number" [(ngModel)]="trip.port"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Starboard Saddle (gal)</ion-label>
        <ion-input type="number" [(ngModel)]="trip.stbd"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Notes</ion-label>
        <ion-textarea [(ngModel)]="trip.notes"></ion-textarea>
      </ion-item>

      <ion-button expand="full" (click)="save()">Save</ion-button>
    </ion-content>
  `
})
export class EditTripComponent implements OnInit {
  trip: any;
  index!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripStorageService
  ) {}

  async ngOnInit() {
    this.index = parseInt(this.route.snapshot.paramMap.get('id')!, 10);
    const trips = await this.tripService.getTrips();
    this.trip = { ...trips[this.index] }; // clone to avoid inline edit
  }

  async save() {
    await this.tripService.updateTrip(this.index, this.trip);
    this.router.navigateByUrl('/');
  }
}
