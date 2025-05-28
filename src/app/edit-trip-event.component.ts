import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonSelect,
    IonSelectOption, IonNote, IonCheckbox, IonList
  } from '@ionic/angular/standalone';
import { BoatConfig, Trip, TripEvent } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';

@Component({
  selector: 'app-edit-trip-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonNote, IonCheckbox, IonList],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/trip-details/' + tripId"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <ion-icon name="create-outline"></ion-icon>
          Edit Event
        </ion-title>
        <ion-buttons slot="end">
          <ion-button 
            color="danger" 
            fill="clear"
            (click)="deleteEvent()" 
            *ngIf="eventIndex > 0 && trip && eventIndex < trip.events.length - 1">
            <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Event Info -->
      <ion-card *ngIf="event">
        <ion-card-header>
          <ion-card-title>
            <ion-icon [name]="getEventIcon(event.type)"></ion-icon>
            {{ getEventTitle(event.type) }}
          </ion-card-title>
          <ion-card-subtitle>{{ event.timestamp | date:'MMM d, yyyy HH:mm' }}</ion-card-subtitle>
        </ion-card-header>
      </ion-card>

      <!-- Cannot Edit First/Last Event Warning -->
      <ion-card *ngIf="(eventIndex === 0) || (trip && eventIndex === trip.events.length - 1)" color="warning">
        <ion-card-content>
          <ion-item color="warning" lines="none">
            <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Limited Editing:</strong> {{ eventIndex === 0 ? 'Starting' : 'Final' }} events can only have limited edits to prevent data corruption.
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Edit Form -->
      <ion-card *ngIf="event && activeBoat">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="clipboard-outline"></ion-icon>
            Event Details
          </ion-card-title>
          <ion-card-subtitle>Edit event information</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          
          <ion-list>
            <!-- Odometer -->
            <ion-item>
              <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">Odometer Reading</ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="editForm.odometer"
                [disabled]="!canEditOdometer()">
              </ion-input>
              <ion-note slot="helper" *ngIf="!canEditOdometer()">
                Cannot edit odometer for first/last event
              </ion-note>
            </ion-item>

            <!-- Garmin Total (for middle events) -->
            <ion-item *ngIf="canEditGarminTotal()">
              <ion-icon name="calculator-outline" slot="start" color="success"></ion-icon>
              <ion-label position="stacked">Garmin Total Fuel</ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="editForm.garminTotal">
              </ion-input>
              <ion-note slot="helper">Total fuel reading from Garmin</ion-note>
            </ion-item>
          </ion-list>

          <!-- Manual Tank Levels (for first/last events) -->
          <ion-list *ngIf="!canEditGarminTotal()">
            <ion-item lines="none">
              <ion-icon name="layers-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Individual Tank Levels</h3>
                <p>Enter fuel level for each tank</p>
              </ion-label>
            </ion-item>
            <ion-item *ngFor="let tank of activeBoat.tanks">
              <ion-icon name="water-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">{{ tank.name }}</ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="editForm.fuelLevels[tank.id]"
                [max]="tank.capacity"
                min="0">
              </ion-input>
              <ion-note slot="helper">Maximum: {{ tank.capacity }} gallons</ion-note>
            </ion-item>
          </ion-list>

          <!-- Active Tanks Selection -->
          <ion-list *ngIf="canEditActiveTanks()">
            <ion-item lines="none">
              <ion-icon name="checkmark-done-outline" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Active Tanks</h3>
                <p>Select tanks that were active at this event</p>
              </ion-label>
            </ion-item>
            <ion-item *ngFor="let tank of activeBoat.tanks">
              <ion-checkbox 
                slot="start" 
                [(ngModel)]="editForm.activeTanks[tank.id]"
                color="primary">
              </ion-checkbox>
              <ion-icon name="water-outline" slot="start" color="primary" class="ion-margin-start"></ion-icon>
              <ion-label>
                <h3>{{ tank.name }}</h3>
                <p>{{ getCalculatedTankLevel(tank.id) | number:'1.1-1' }} gallons</p>
              </ion-label>
            </ion-item>
          </ion-list>

          <!-- Activity/Notes -->
          <ion-list class="ion-margin-top">
            <ion-item>
              <ion-icon name="flag-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label position="stacked">Activity/Reason</ion-label>
              <ion-input 
                [(ngModel)]="editForm.activity"
                placeholder="e.g., 'Switched to trolling', 'Refueled'">
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-icon name="document-text-outline" slot="start" color="medium"></ion-icon>
              <ion-label position="stacked">Notes</ion-label>
              <ion-textarea 
                [(ngModel)]="editForm.notes"
                placeholder="Additional notes about this event"
                rows="3">
              </ion-textarea>
            </ion-item>

            <!-- Event Type (limited editing) -->
            <ion-item *ngIf="canEditEventType()">
              <ion-icon name="list-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">Event Type</ion-label>
              <ion-select [(ngModel)]="editForm.type" interface="popover">
                <ion-select-option value="tank_switch">Tank Switch</ion-select-option>
                <ion-select-option value="activity_change">Activity Change</ion-select-option>
                <ion-select-option value="fuel_stop">Fuel Stop</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>

        </ion-card-content>
      </ion-card>

      <!-- Preview Changes -->
      <ion-card *ngIf="hasChanges()" color="light">
        <ion-card-header>
          <ion-card-title color="dark">
            <ion-icon name="eye-outline"></ion-icon>
            Preview Changes
          </ion-card-title>
          <ion-card-subtitle color="dark">Summary of modifications</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngIf="editForm.odometer !== event?.odometer" color="light">
              <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
              <ion-label color="dark">
                <h3>Odometer</h3>
                <p>{{ event?.odometer }} → {{ editForm.odometer }} miles</p>
              </ion-label>
            </ion-item>
            <ion-item *ngIf="getGarminTotal() !== getOriginalGarminTotal()" color="light">
              <ion-icon name="calculator-outline" slot="start" color="success"></ion-icon>
              <ion-label color="dark">
                <h3>Total Fuel</h3>
                <p>{{ getOriginalGarminTotal() | number:'1.1-1' }} → {{ getGarminTotal() | number:'1.1-1' }} gallons</p>
              </ion-label>
            </ion-item>
            <ion-item *ngIf="getActiveTanksChanged()" color="light">
              <ion-icon name="layers-outline" slot="start" color="warning"></ion-icon>
              <ion-label color="dark">
                <h3>Active Tanks</h3>
                <p>{{ getActiveTanksPreview() }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Save/Cancel Buttons -->
      <ion-card>
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="success"
            (click)="saveChanges()"
            [disabled]="!canSave()">
            <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
            Save Changes
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline"
            color="medium"
            [routerLink]="['/trip-details', tripId]">
            <ion-icon name="close-outline" slot="start"></ion-icon>
            Cancel
          </ion-button>
          
          <ion-item *ngIf="!canSave()" color="warning" lines="none" class="ion-margin-top">
            <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Validation Error:</strong> {{ getValidationMessage() }}
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class EditTripEventComponent implements OnInit {
  trip: Trip | null = null;
  event: TripEvent | null = null;
  activeBoat: BoatConfig | null = null;
  tripId!: string;
  eventIndex!: number;
  
  editForm: {
    odometer: number;
    garminTotal: number;
    fuelLevels: { [tankId: string]: number };
    activeTanks: { [tankId: string]: boolean };
    activity: string;
    notes: string;
    type: string;
  } = {
    odometer: 0,
    garminTotal: 0,
    fuelLevels: {},
    activeTanks: {},
    activity: '',
    notes: '',
    type: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boatService: BoatManagementService,
    private tripService: TripManagementService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('tripId')!;
    this.eventIndex = parseInt(this.route.snapshot.paramMap.get('eventIndex')!, 10);
    await this.loadData();
  }

  async loadData() {
    const trips = await this.tripService.getTrips();
    this.trip = trips.find(t => t.id === this.tripId) || null;
    
    if (this.trip && this.eventIndex >= 0 && this.eventIndex < this.trip.events.length) {
      this.event = this.trip.events[this.eventIndex];
      this.activeBoat = await this.boatService.getActiveBoat();
      
      // Initialize edit form
      this.editForm = {
        odometer: this.event.odometer,
        garminTotal: this.getOriginalGarminTotal(),
        fuelLevels: { ...this.event.fuelLevels },
        activeTanks: {},
        activity: this.event.activity || '',
        notes: this.event.notes || '',
        type: this.event.type
      };
      
      // Initialize active tanks
      if (this.activeBoat) {
        this.activeBoat.tanks.forEach(tank => {
          this.editForm.activeTanks[tank.id] = this.event?.activeTanks?.includes(tank.id) || false;
        });
      }
    }
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'departure': return 'play-circle-outline';
      case 'tank_switch': return 'swap-horizontal-outline';
      case 'fuel_stop': return 'car-outline';
      case 'activity_change': return 'flag-outline';
      case 'arrival': return 'stop-circle-outline';
      default: return 'radio-button-on-outline';
    }
  }

  getEventTitle(type: string): string {
    switch (type) {
      case 'departure': return 'Departure';
      case 'tank_switch': return 'Tank Switch';
      case 'fuel_stop': return 'Fuel Stop';
      case 'activity_change': return 'Activity Change';
      case 'arrival': return 'Arrival';
      default: return 'Event';
    }
  }

  canEditOdometer(): boolean {
    // Can't edit odometer of first or last event (would break calculations)
    if (!this.trip) return false;
    return this.eventIndex > 0 && this.eventIndex < this.trip.events.length - 1;
  }

  canEditGarminTotal(): boolean {
    // Can edit Garmin total for middle events (not first/last)
    if (!this.trip) return false;
    return this.eventIndex > 0 && this.eventIndex < this.trip.events.length - 1;
  }

  canEditActiveTanks(): boolean {
    // Can edit active tanks for any event except arrival
    return this.event?.type !== 'arrival';
  }

  canEditEventType(): boolean {
    // Can only change type of middle events, not departure/arrival
    if (!this.trip) return false;
    return this.eventIndex > 0 && this.eventIndex < this.trip.events.length - 1;
  }

  getOriginalGarminTotal(): number {
    if (!this.event) return 0;
    return Object.values(this.event.fuelLevels).reduce((sum, level) => sum + level, 0);
  }

  getGarminTotal(): number {
    if (this.canEditGarminTotal()) {
      return this.editForm.garminTotal;
    } else {
      return Object.values(this.editForm.fuelLevels).reduce((sum, level) => sum + level, 0);
    }
  }

  getCalculatedTankLevel(tankId: string): number {
    return this.editForm.fuelLevels[tankId] || 0;
  }

  getSelectedActiveTanks(): string[] {
    return Object.keys(this.editForm.activeTanks).filter(tankId => this.editForm.activeTanks[tankId]);
  }

  hasChanges(): boolean {
    if (!this.event) return false;
    
    return (
      this.editForm.odometer !== this.event.odometer ||
      this.editForm.activity !== (this.event.activity || '') ||
      this.editForm.notes !== (this.event.notes || '') ||
      this.editForm.type !== this.event.type ||
      JSON.stringify(this.editForm.fuelLevels) !== JSON.stringify(this.event.fuelLevels) ||
      this.getActiveTanksChanged()
    );
  }

  getActiveTanksChanged(): boolean {
    if (!this.event) return false;
    
    const originalActive = this.event.activeTanks || [];
    const newActive = this.getSelectedActiveTanks();
    
    return JSON.stringify(originalActive.sort()) !== JSON.stringify(newActive.sort());
  }

  getActiveTanksPreview(): string {
    const originalActive = this.event?.activeTanks || [];
    const newActive = this.getSelectedActiveTanks();
    
    const originalNames = originalActive.map(id => this.getTankName(id)).join(', ');
    const newNames = newActive.map(id => this.getTankName(id)).join(', ');
    
    return `${originalNames} → ${newNames}`;
  }

  getTankName(tankId: string): string {
    if (!this.activeBoat) return tankId;
    const tank = this.activeBoat.tanks.find(t => t.id === tankId);
    return tank ? tank.name : tankId;
  }

  canSave(): boolean {
    if (!this.trip || !this.event || !this.activeBoat) return false;
    
    // Check odometer constraints
    if (this.canEditOdometer()) {
      const prevEvent = this.eventIndex > 0 ? this.trip.events[this.eventIndex - 1] : null;
      const nextEvent = this.eventIndex < this.trip.events.length - 1 ? this.trip.events[this.eventIndex + 1] : null;
      
      if (prevEvent && this.editForm.odometer <= prevEvent.odometer) return false;
      if (nextEvent && this.editForm.odometer >= nextEvent.odometer) return false;
    }
    
    // Check fuel levels are valid
    const validFuelLevels = this.activeBoat.tanks.every(tank => {
      const level = this.editForm.fuelLevels[tank.id] || 0;
      return level >= 0 && level <= tank.capacity;
    });
    
    if (!validFuelLevels) return false;
    
    // Must have at least one active tank (except for arrival)
    if (this.editForm.type !== 'arrival' && this.getSelectedActiveTanks().length === 0) return false;
    
    return true;
  }

  getValidationMessage(): string {
    if (!this.trip || !this.event || !this.activeBoat) return 'Loading data...';
    
    if (this.canEditOdometer()) {
      const prevEvent = this.eventIndex > 0 ? this.trip.events[this.eventIndex - 1] : null;
      const nextEvent = this.eventIndex < this.trip.events.length - 1 ? this.trip.events[this.eventIndex + 1] : null;
      
      if (prevEvent && this.editForm.odometer <= prevEvent.odometer) {
        return `Odometer must be greater than ${prevEvent.odometer}`;
      }
      if (nextEvent && this.editForm.odometer >= nextEvent.odometer) {
        return `Odometer must be less than ${nextEvent.odometer}`;
      }
    }
    
    const invalidTank = this.activeBoat.tanks.find(tank => {
      const level = this.editForm.fuelLevels[tank.id] || 0;
      return level < 0 || level > tank.capacity;
    });
    
    if (invalidTank) {
      return `Check fuel level for ${invalidTank.name}`;
    }
    
    if (this.editForm.type !== 'arrival' && this.getSelectedActiveTanks().length === 0) {
      return 'Select at least one active tank';
    }
    
    return '';
  }

  async saveChanges() {
    if (!this.canSave() || !this.trip || !this.event) return;

    try {
      // Update the event in the trip
      const updatedEvent: TripEvent = {
        ...this.event,
        odometer: this.editForm.odometer,
        fuelLevels: { ...this.editForm.fuelLevels },
        activeTanks: this.getSelectedActiveTanks(),
        activity: this.editForm.activity || undefined,
        notes: this.editForm.notes || undefined,
        type: this.editForm.type as any
      };
      
      // If editing with Garmin total, recalculate individual levels
      if (this.canEditGarminTotal()) {
        // This is complex - we'd need to recalculate fuel distribution
        // For now, we'll update the event directly and let the user handle it
        const totalDiff = this.editForm.garminTotal - this.getOriginalGarminTotal();
        if (totalDiff !== 0) {
          // Distribute the difference across active tanks
          const activeTanks = this.getSelectedActiveTanks();
          if (activeTanks.length > 0) {
            const adjustmentPerTank = totalDiff / activeTanks.length;
            activeTanks.forEach(tankId => {
              updatedEvent.fuelLevels[tankId] = Math.max(0, 
                (updatedEvent.fuelLevels[tankId] || 0) + adjustmentPerTank
              );
            });
          }
        }
      }

      // Update the trip
      this.trip.events[this.eventIndex] = updatedEvent;
      
      // Save the updated trip
      const allTrips = await this.tripService.getTrips();
      const tripIndex = allTrips.findIndex(t => t.id === this.tripId);
      if (tripIndex >= 0) {
        allTrips[tripIndex] = this.trip;
        await this.tripService.saveTrips(allTrips);
      }

      const toast = await this.toastCtrl.create({
        message: 'Event updated successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/trip-details', this.tripId]);

    } catch (error) {
      console.error('Error updating event:', error);
      
      const toast = await this.toastCtrl.create({
        message: 'Error updating event. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async deleteEvent() {
    if (!this.trip || this.eventIndex <= 0 || this.eventIndex >= this.trip.events.length - 1) {
      return; // Can't delete first or last event
    }

    const alert = await this.alertCtrl.create({
      header: 'Delete Event',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              // Remove the event
              this.trip!.events.splice(this.eventIndex, 1);
              
              // Save the updated trip
              const allTrips = await this.tripService.getTrips();
              const tripIndex = allTrips.findIndex(t => t.id === this.tripId);
              if (tripIndex >= 0) {
                allTrips[tripIndex] = this.trip!;
                await this.tripService.saveTrips(allTrips);
              }

              const toast = await this.toastCtrl.create({
                message: 'Event deleted successfully!',
                duration: 2000,
                color: 'success'
              });
              await toast.present();

              this.router.navigate(['/trip-details', this.tripId]);

            } catch (error) {
              console.error('Error deleting event:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }
}