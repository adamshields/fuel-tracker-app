import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonButton,
    IonDatetime, IonIcon, IonNote
  } from '@ionic/angular/standalone';
import { Trip } from './boat.model';
import { TripManagementService } from './trip-management.service';

@Component({
  selector: 'app-edit-trip-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader,IonNote, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonButton, IonDatetime, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/trip-details/' + tripId"></ion-back-button>
        </ion-buttons>
        <ion-title>
          Edit Trip Details
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Trip Basic Information -->
      <ion-card *ngIf="trip">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="create-outline"></ion-icon>
            Trip Information
          </ion-card-title>
          <ion-card-subtitle>
            Edit trip name, timing, and departure details
          </ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <ion-item>
            <ion-icon name="text-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Trip Name</ion-label>
            <ion-input 
              [(ngModel)]="editForm.name"
              placeholder="e.g., Sandbar Trip, Wahoo Fishing Trip">
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-icon name="calendar-outline" slot="start" color="success"></ion-icon>
            <ion-label position="stacked">Start Date & Time</ion-label>
            <ion-datetime 
              [(ngModel)]="editForm.startDate"
              display-format="MMM DD, YYYY HH:mm"
              picker-format="MMM DD YYYY HH:mm"
              presentation="date-time">
            </ion-datetime>
          </ion-item>

          <ion-item *ngIf="trip.status === 'completed'">
            <ion-icon name="flag-outline" slot="start" color="danger"></ion-icon>
            <ion-label position="stacked">End Date & Time</ion-label>
            <ion-datetime 
              [(ngModel)]="editForm.endDate"
              display-format="MMM DD, YYYY HH:mm"
              picker-format="MMM DD YYYY HH:mm"
              presentation="date-time">
            </ion-datetime>
          </ion-item>

          <ion-item>
            <ion-icon name="speedometer-outline" slot="start" color="warning"></ion-icon>
            <ion-label position="stacked">Departure Odometer</ion-label>
            <ion-input 
              type="number"
              [(ngModel)]="editForm.startingOdometer"
              placeholder="Starting odometer reading">
            </ion-input>
            <ion-note slot="helper">Miles at trip departure - affects all trip calculations</ion-note>
          </ion-item>

          <ion-item>
            <ion-icon name="document-text-outline" slot="start" color="tertiary"></ion-icon>
            <ion-label position="stacked">Trip Notes</ion-label>
            <ion-textarea 
              [(ngModel)]="editForm.notes"
              placeholder="Add notes about this trip..."
              rows="4">
            </ion-textarea>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Quick Edit Actions -->
      <ion-card *ngIf="trip">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="flash-outline"></ion-icon>
            Quick Actions
          </ion-card-title>
          <ion-card-subtitle>Direct access to event editing</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            fill="outline"
            color="primary"
            [disabled]="isSaving"
            (click)="editDepartureEvent()">
            <ion-icon name="play-circle-outline" slot="start"></ion-icon>
            Edit Departure Event
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline"
            color="tertiary"
            [disabled]="isSaving || !trip.endDate"
            (click)="editArrivalEvent()"
            *ngIf="trip.status === 'completed'">
            <ion-icon name="stop-circle-outline" slot="start"></ion-icon>
            Edit Arrival Event
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Save/Cancel Buttons -->
      <ion-card>
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="success"
            (click)="saveChanges()"
            [disabled]="!hasChanges() || isSaving">
            <ion-icon [name]="isSaving ? 'hourglass-outline' : 'checkmark-circle-outline'" slot="start"></ion-icon>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline"
            color="medium"
            [disabled]="isSaving"
            [routerLink]="['/trip-details', tripId]">
            <ion-icon name="close-outline" slot="start"></ion-icon>
            Cancel
          </ion-button>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class EditTripDetailsComponent implements OnInit {
    trip: Trip | null = null;
    tripId!: string;
    isSaving = false;
  
    editForm = {
      name: '',
      startDate: '',
      endDate: '',
      startingOdometer: 0,
      notes: ''
    };
  
    originalForm = {
      name: '',
      startDate: '',
      endDate: '',
      startingOdometer: 0,
      notes: ''
    };
  
    constructor(
      private route: ActivatedRoute,
      private router: Router,
      private tripService: TripManagementService,
      private toastCtrl: ToastController
    ) {}
  
    async ngOnInit() {
      this.tripId = this.route.snapshot.paramMap.get('id')!;
      await this.loadTripData();
    }
  
    async loadTripData() {
      const trips = await this.tripService.getTrips();
      const found = trips.find(t => t.id === this.tripId);
      this.trip = found ? structuredClone(found) : null;
  
      if (this.trip) {
        this.editForm = {
          name: this.trip.name || '',
          startDate: this.trip.startDate.toISOString(),
          endDate: this.trip.endDate ? this.trip.endDate.toISOString() : '',
          startingOdometer: this.trip.events.length > 0 ? this.trip.events[0].odometer : 0,
          notes: this.trip.notes || ''
        };
  
        this.originalForm = JSON.parse(JSON.stringify(this.editForm));
      }
    }
  
    hasChanges(): boolean {
      return JSON.stringify(this.editForm) !== JSON.stringify(this.originalForm);
    }
  
    async saveChanges() {
      if (!this.trip || !this.hasChanges() || this.isSaving) return;
  
      this.isSaving = true;
      try {
        const updates: any = {};
  
        if (this.editForm.name !== this.originalForm.name) {
          updates.name = this.editForm.name.trim();
        }
  
        if (this.editForm.startDate !== this.originalForm.startDate) {
          updates.startDate = new Date(this.editForm.startDate);
        }
  
        if (this.editForm.endDate !== this.originalForm.endDate) {
          updates.endDate = this.editForm.endDate ? new Date(this.editForm.endDate) : undefined;
        }
  
        if (this.editForm.notes !== this.originalForm.notes) {
          updates.notes = this.editForm.notes.trim();
        }
  
        if (this.editForm.startingOdometer !== this.originalForm.startingOdometer) {
          updates.startingOdometer = this.editForm.startingOdometer;
        }
  
        await this.tripService.updateTripDetails(this.tripId, updates);
  
        const toast = await this.toastCtrl.create({
          message: 'Trip details updated successfully!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
  
        // Reload trip details properly
        await this.router.navigateByUrl('/', { skipLocationChange: true });
        await this.router.navigate(['/trip-details', this.tripId]);
  
      } catch (error) {
        console.error('Error updating trip details:', error);
  
        const toast = await this.toastCtrl.create({
          message: 'Error updating trip details. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      } finally {
        this.isSaving = false;
      }
    }
  
    editDepartureEvent() {
      if (!this.trip) return;
      this.router.navigate(['/edit-trip-event', this.tripId, 0]);
    }
  
    editArrivalEvent() {
      if (!this.trip) return;
      const lastIndex = this.trip.events.length - 1;
      this.router.navigate(['/edit-trip-event', this.tripId, lastIndex]);
    }
  }