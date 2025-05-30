import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonProgressBar, IonBadge, IonChip, IonList, IonNote
  } from '@ionic/angular/standalone';
import { BoatConfig, Trip, FuelStats } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [CommonModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonProgressBar, IonBadge, IonChip, IonList, IonNote],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>
          {{ trip?.name || 'Trip Details' }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showEditOptions()" fill="clear">
            <ion-icon name="create-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Trip Overview -->
      <ion-card *ngIf="trip">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="calendar-outline"></ion-icon>
            {{ trip.name || (trip.startDate | date:'MMM d, yyyy') }}
          </ion-card-title>
          <ion-card-subtitle>
            {{ getTripDuration() }} • {{ trip.status | titlecase }}
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Start Time</h3>
                <p>{{ trip.startDate | date:'MMM d, yyyy HH:mm' }}</p>
              </ion-label>
            </ion-item>
            
            <ion-item *ngIf="trip.endDate">
              <ion-icon name="flag-outline" slot="start" color="danger"></ion-icon>
              <ion-label>
                <h3>End Time</h3>
                <p>{{ trip.endDate | date:'MMM d, yyyy HH:mm' }}</p>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-icon name="speedometer-outline" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h3>Starting Odometer</h3>
                <p>{{ getStartingOdometer() }} miles</p>
              </ion-label>
            </ion-item>
            
            <ion-item *ngIf="trip.endDate">
              <ion-icon name="flag-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Ending Odometer</h3>
                <p>{{ getEndingOdometer() }} miles</p>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-icon name="location-outline" slot="start" color="primary"></ion-icon>
              <ion-label>Distance Traveled</ion-label>
              <ion-note slot="end">{{ getTotalDistance() }} miles</ion-note>
            </ion-item>
            <ion-item>
              <ion-icon name="speedometer-outline" slot="start" color="warning"></ion-icon>
              <ion-label>Fuel Used</ion-label>
              <ion-note slot="end">{{ getTotalFuelUsed() | number:'1.1-1' }} gal</ion-note>
            </ion-item>
            <ion-item>
              <ion-icon name="trending-up-outline" slot="start" color="success"></ion-icon>
              <ion-label>Overall MPG</ion-label>
              <ion-note slot="end">{{ getOverallMPG() | number:'1.1-1' }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-icon name="list-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>Events Logged</ion-label>
              <ion-note slot="end">{{ trip.events.length }}</ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Fuel Usage Breakdown -->
      <ion-card *ngIf="fuelStats">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="bar-chart-outline"></ion-icon>
            Fuel Usage by Tank
          </ion-card-title>
          <ion-card-subtitle>Individual tank consumption</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let tankId of getUsedTanks()">
              <ion-icon name="water-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>{{ getTankName(tankId) }}</h3>
                <p>{{ fuelStats.usageByTank[tankId] | number:'1.1-1' }} gallons consumed</p>
                <ion-progress-bar 
                  [value]="fuelStats.usageByTank[tankId] / fuelStats.totalUsed"
                  color="primary"
                  class="ion-margin-top">
                </ion-progress-bar>
              </ion-label>
              <ion-note slot="end">
                {{ (fuelStats.usageByTank[tankId] / fuelStats.totalUsed * 100) | number:'1.0-0' }}%
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Segment Analysis -->
      <ion-card *ngIf="fuelStats && fuelStats.segmentMPGs.length > 0">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="analytics-outline"></ion-icon>
            Segment Performance
          </ion-card-title>
          <ion-card-subtitle>Fuel efficiency by trip segment</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let segment of fuelStats.segmentMPGs">
              <ion-icon name="trending-up-outline" slot="start" [color]="getSegmentColor(segment.mpg)"></ion-icon>
              <ion-label>
                <h3>{{ segment.segment }}</h3>
                <p>{{ segment.mpg | number:'1.1-1' }} miles per gallon</p>
              </ion-label>
              <ion-badge slot="end" [color]="getSegmentColor(segment.mpg)">
                {{ segment.mpg | number:'1.1-1' }} MPG
              </ion-badge>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Trip Timeline -->
      <ion-card *ngIf="trip">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="time-outline"></ion-icon>
            Trip Timeline
          </ion-card-title>
          <ion-card-subtitle>Complete event history</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let event of trip.events; let i = index">
              <ion-icon 
                [name]="getEventIcon(event.type)" 
                slot="start" 
                [color]="getEventColor(event.type)">
              </ion-icon>
              <ion-label>
                <h3>{{ getEventTitle(event.type) }}</h3>
                <p>
                  <ion-icon name="time-outline" color="medium"></ion-icon>
                  {{ event.timestamp | date:'HH:mm' }} • 
                  <ion-icon name="location-outline" color="medium"></ion-icon>
                  {{ event.odometer }} miles • 
                  <ion-icon name="speedometer-outline" color="medium"></ion-icon>
                  {{ getTotalFuelAtEvent(event) | number:'1.1-1' }} gal total
                </p>
                
                <div *ngIf="event.activeTanks && event.activeTanks.length > 0" class="ion-margin-top">
                  <p><strong>Active Tanks:</strong></p>
                  <ion-chip *ngFor="let tankId of event.activeTanks" size="small" color="success">
                    <ion-icon name="water-outline"></ion-icon>
                    <ion-label>{{ getTankName(tankId) }}</ion-label>
                  </ion-chip>
                </div>
                
                <div *ngIf="getAllTankIds().length > 0" class="ion-margin-top">
                  <p><strong>Tank Levels:</strong></p>
                  <div *ngFor="let tankId of getAllTankIds()">
                    <small>{{ getTankName(tankId) }}: {{ event.fuelLevels[tankId] || 0 | number:'1.1-1' }} gallons</small>
                  </div>
                </div>
                
                <p *ngIf="event.activity" class="ion-margin-top">
                  <ion-icon name="flag-outline" color="tertiary"></ion-icon>
                  <strong>Activity:</strong> {{ event.activity }}
                </p>
                <p *ngIf="event.notes" class="ion-margin-top">
                  <ion-icon name="document-text-outline" color="medium"></ion-icon>
                  <strong>Notes:</strong> {{ event.notes }}
                </p>
                
                <div *ngIf="i > 0" class="ion-margin-top">
                  <p><strong>Segment Performance:</strong></p>
                  <small>
                    Distance: {{ getSegmentDistance(i) }} miles • 
                    Fuel: {{ getSegmentFuel(i) | number:'1.1-1' }} gal • 
                    MPG: {{ getSegmentMPG(i) | number:'1.1-1' }}
                  </small>
                </div>
              </ion-label>
              
              <ion-button 
                slot="end"
                fill="outline" 
                size="small" 
                color="primary"
                (click)="editEvent(i)"
                *ngIf="canEditEvent(i)">
                <ion-icon name="create-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Trip Notes -->
      <ion-card *ngIf="trip?.notes">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="document-text-outline"></ion-icon>
            Trip Notes
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ trip?.notes }}</p>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class TripDetailsComponent implements OnInit {
  trip: Trip | null = null;
  activeBoat: BoatConfig | null = null;
  fuelStats: FuelStats | null = null;
  tripId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boatService: BoatManagementService,
    private tripService: TripManagementService,
    private actionSheetCtrl: ActionSheetController
  ) {}

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    await this.loadTripData();
  }

  async ionViewWillEnter() {
    await this.loadTripData();
  }

  async loadTripData() {
    const trips = await this.tripService.getTrips();
    const found = trips.find(t => t.id === this.tripId) || null;
    this.trip = found ? structuredClone(found) : null;

    if (this.trip) {
      const boat = await this.boatService.getActiveBoat();
      this.activeBoat = boat ? structuredClone(boat) : null;

      try {
        this.fuelStats = await this.tripService.calculateTripStats(this.tripId);
      } catch (error) {
        console.warn('Could not calculate trip stats:', error);
      }
    }
  }

  trackByEventId(index: number, event: any): string | number {
    return event.timestamp || index;
  }

  getTripDuration(): string {
    if (!this.trip) return '';
    const start = this.trip.startDate;
    const end = this.trip.endDate || new Date();
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  getStartingOdometer(): number {
    return this.trip?.events?.[0]?.odometer || 0;
  }

  getEndingOdometer(): number {
    return this.trip?.events?.[this.trip.events.length - 1]?.odometer || 0;
  }

  getTotalDistance(): number {
    if (!this.trip || this.trip.events.length < 2) return 0;
    return this.getEndingOdometer() - this.getStartingOdometer();
  }

  getTotalFuelUsed(): number {
    return this.fuelStats?.totalUsed || 0;
  }

  getOverallMPG(): number {
    return this.fuelStats?.overallMPG || 0;
  }

  getUsedTanks(): string[] {
    return this.fuelStats ? Object.keys(this.fuelStats.usageByTank) : [];
  }

  getTankName(tankId: string): string {
    const tank = this.activeBoat?.tanks.find(t => t.id === tankId);
    return tank ? tank.name : tankId;
  }

  getSegmentColor(mpg: number): string {
    if (mpg > 3) return 'success';
    if (mpg > 2) return 'warning';
    return 'danger';
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

  getEventColor(type: string): string {
    switch (type) {
      case 'departure': return 'success';
      case 'tank_switch': return 'warning';
      case 'fuel_stop': return 'secondary';
      case 'activity_change': return 'tertiary';
      case 'arrival': return 'danger';
      default: return 'medium';
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

  getTotalFuelAtEvent(event: any): number {
    return Object.values(event.fuelLevels || {}).reduce((sum: number, val: any) => sum + (val || 0), 0);
  }

  getAllTankIds(): string[] {
    if (!this.trip) return [];
    const set = new Set<string>();
    this.trip.events.forEach(e => Object.keys(e.fuelLevels || {}).forEach(t => set.add(t)));
    return Array.from(set);
  }

  getSegmentDistance(index: number): number {
    if (!this.trip || index === 0) return 0;
    return this.trip.events[index].odometer - this.trip.events[index - 1].odometer;
  }

  getSegmentFuel(index: number): number {
    if (!this.trip || index === 0) return 0;
    const prevTotal = Object.values(this.trip.events[index - 1].fuelLevels || {}).reduce((sum: number, v: any) => sum + (v || 0), 0);
    const currTotal = Object.values(this.trip.events[index].fuelLevels || {}).reduce((sum: number, v: any) => sum + (v || 0), 0);
    return prevTotal - currTotal;
  }

  getSegmentMPG(index: number): number {
    const distance = this.getSegmentDistance(index);
    const fuel = this.getSegmentFuel(index);
    return distance > 0 && fuel > 0 ? distance / fuel : 0;
  }

  editEvent(eventIndex: number) {
    this.router.navigate(['/edit-trip-event', this.tripId, eventIndex]);
  }

  canEditEvent(eventIndex: number): boolean {
    return true;
  }

  async showEditOptions() {
    if (!this.trip) return;

    const buttons = [
      {
        text: 'Edit Trip Details',
        icon: 'create-outline',
        handler: () => {
          this.router.navigate(['/edit-trip-details', this.tripId]);
          return true;
        }
      },
      ...this.trip.events.map((event, index) => ({
        text: `Edit ${this.getEventTitle(event.type)} (${event.timestamp.toLocaleTimeString()})`,
        icon: 'create-outline',
        handler: () => {
          this.editEvent(index);
          return true;
        }
      })),
      {
        text: 'Cancel',
        icon: 'close-outline',
        role: 'cancel',
        handler: () => true
      }
    ];

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Edit Options',
      buttons
    });

    await actionSheet.present();
  }
}