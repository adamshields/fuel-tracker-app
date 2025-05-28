import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonProgressBar, IonBadge, IonChip, IonNote, 
    IonList, IonAvatar, IonThumbnail, IonItemDivider
  } from '@ionic/angular/standalone';
import { BoatConfig, Trip, TripEvent } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';

@Component({
  selector: 'app-trip-active',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonProgressBar, IonBadge, IonChip, IonNote, IonList,  IonItemDivider],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <!-- <ion-icon name="navigate-circle-outline"></ion-icon> -->
          Active Trip
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="endTrip()" color="danger" fill="clear" [disabled]="isLoading">
            <ion-icon name="stop-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <!-- Loading State -->
      <ion-card *ngIf="isLoading" class="ion-margin">
        <ion-card-content>
          <ion-item lines="none">
            <ion-icon name="hourglass-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Loading Trip Data...</h3>
              <p>Please wait while we refresh your trip information</p>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Trip Status Overview -->
      <ion-card *ngIf="trip && !isLoading" color="warning" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="time-outline"></ion-icon>
            {{ getElapsedTime() }} Active
          </ion-card-title>
          <ion-card-subtitle>
            Trip in progress • {{ trip.events.length }} events logged
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="warning" lines="none">
            <ion-icon name="speedometer-outline" slot="start" color="dark"></ion-icon>
            <ion-label color="dark">
              <h2>{{ getCurrentDistance() }} Miles Traveled</h2>
              <p>Current MPG: {{ getCurrentMPG() | number:'1.1-1' }} • Fuel efficiency tracking</p>
            </ion-label>
            <ion-badge slot="end" color="dark">
              {{ getCurrentMPG() | number:'1.1-1' }} MPG
            </ion-badge>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Fuel Status -->
      <ion-card *ngIf="activeBoat && !isLoading" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="speedometer-outline"></ion-icon>
            Fuel Status
          </ion-card-title>
          <ion-card-subtitle>Live fuel monitoring</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item-divider>
              <ion-icon name="layers-outline" slot="start"></ion-icon>
              <ion-label>Tank Status</ion-label>
              <ion-badge slot="end" color="success">LIVE</ion-badge>
            </ion-item-divider>
            
            <ion-item *ngFor="let tank of activeBoat.tanks">
              <ion-icon 
                [name]="getTankIcon(tank.id)" 
                slot="start"
                [color]="getTankColor(getLastFuelLevel(tank.id) / tank.capacity)">
              </ion-icon>
              
              <ion-label>
                <h3>{{ tank.name }}</h3>
                <p>{{ getLastFuelLevel(tank.id) | number:'1.1-1' }} / {{ tank.capacity }} gal</p>
                <p>{{ getTankPercentage(tank.id) }}% remaining</p>
              </ion-label>
              
              <ion-note slot="end">
                <ion-badge 
                  *ngIf="isActiveTank(tank.id)" 
                  color="success">
                  ACTIVE
                </ion-badge>
                <ion-badge 
                  *ngIf="!isActiveTank(tank.id)"
                  color="medium">
                  STANDBY
                </ion-badge>
                <br>
                <ion-progress-bar 
                  [value]="getLastFuelLevel(tank.id) / tank.capacity"
                  [color]="getTankColor(getLastFuelLevel(tank.id) / tank.capacity)"
                  class="ion-margin-top">
                </ion-progress-bar>
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Trip Actions -->
      <ion-card *ngIf="!isLoading" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="add-circle-outline"></ion-icon>
            Trip Actions
          </ion-card-title>
          <ion-card-subtitle>Log events and manage trip</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="primary"
            [disabled]="isNavigating"
            (click)="showEventOptions()"
            class="ion-margin-bottom">
            <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'add-outline'" slot="start"></ion-icon>
            {{ isNavigating ? 'Loading...' : 'Log Event' }}
          </ion-button>
          
          <!-- Quick Action Buttons -->
          <ion-list lines="none">
            <ion-item button (click)="addTankSwitch()" [disabled]="isNavigating">
              <ion-icon name="swap-horizontal-outline" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Switch Tanks</h3>
                <p>Change active fuel source</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
            
            <ion-item button (click)="addActivityChange()" [disabled]="isNavigating">
              <ion-icon name="flag-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Activity Change</h3>
                <p>Log fishing, cruising, trolling</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
            
            <ion-item button (click)="addFuelStop()" [disabled]="isNavigating">
              <ion-icon name="car-outline" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Fuel Stop</h3>
                <p>Record refueling event</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Trip Timeline -->
      <ion-card *ngIf="trip && !isLoading" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="list-outline"></ion-icon>
            Trip Timeline
          </ion-card-title>
          <ion-card-subtitle>Event log and trip history</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item-divider>
              <ion-icon name="time-outline" slot="start"></ion-icon>
              <ion-label>Event Log</ion-label>
              <ion-badge slot="end" color="primary">{{ trip.events.length }}</ion-badge>
            </ion-item-divider>
            
            <ion-item *ngFor="let event of getReversedEvents(); let i = index">
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
                  {{ event.odometer }} miles
                </p>
                
                <!-- Active Tanks Display -->
                <div *ngIf="event.activeTanks && event.activeTanks.length > 0">
                  <ion-chip *ngFor="let tankId of event.activeTanks" size="small" color="success">
                    <ion-icon name="water-outline"></ion-icon>
                    <ion-label>{{ getTankName(tankId) }}</ion-label>
                  </ion-chip>
                </div>
                
                <p *ngIf="event.activity">
                  <ion-icon name="flag-outline" color="medium"></ion-icon>
                  {{ event.activity }}
                </p>
                <p *ngIf="event.notes">
                  <ion-icon name="document-text-outline" color="medium"></ion-icon>
                  {{ event.notes }}
                </p>
              </ion-label>
              
              <ion-note slot="end">
                <ion-badge [color]="getEventColor(event.type)">
                  {{ getEventBadge(event.type) }}
                </ion-badge>
                <br>
                <ion-button 
                  fill="outline" 
                  size="small" 
                  color="primary"
                  [disabled]="isNavigating"
                  (click)="editEvent(getReversedEvents().length - 1 - i)"
                  *ngIf="i > 0"
                  class="ion-margin-top">
                  <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Trip Controls -->
      <ion-card *ngIf="!isLoading" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="settings-outline"></ion-icon>
            Trip Controls
          </ion-card-title>
          <ion-card-subtitle>End trip or return to dashboard</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="danger"
            [disabled]="isNavigating"
            (click)="endTrip()"
            class="ion-margin-bottom">
            <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'stop-circle-outline'" slot="start"></ion-icon>
            {{ isNavigating ? 'Loading...' : 'End Trip' }}
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            color="primary"
            [disabled]="isNavigating"
            routerLink="/dashboard">
            <ion-icon name="home-outline" slot="start"></ion-icon>
            Return to Dashboard
          </ion-button>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class TripActiveComponent implements OnInit {
  trip: Trip | null = null;
  activeBoat: BoatConfig | null = null;
  tripId!: string;
  
  // Loading states
  isLoading = false;
  isNavigating = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boatService: BoatManagementService,
    private tripService: TripManagementService,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    await this.loadTripData();
  }

  async ionViewWillEnter() {
    // Refresh data when returning from event pages
    await this.loadTripData();
  }

  async loadTripData() {
    this.isLoading = true;
    try {
      const trips = await this.tripService.getTrips();
      this.trip = trips.find(t => t.id === this.tripId) || null;
      
      if (this.trip) {
        this.activeBoat = await this.boatService.getActiveBoat();
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
      await this.showErrorToast('Failed to load trip data');
    } finally {
      this.isLoading = false;
    }
  }

  getElapsedTime(): string {
    if (!this.trip) return '';
    
    const now = new Date();
    const start = this.trip.startDate;
    const elapsed = now.getTime() - start.getTime();
    
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  getCurrentDistance(): number {
    if (!this.trip || this.trip.events.length < 2) return 0;
    
    const firstEvent = this.trip.events[0];
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    
    return lastEvent.odometer - firstEvent.odometer;
  }

  getCurrentMPG(): number {
    if (!this.trip || this.trip.events.length < 2) return 0;
    
    const distance = this.getCurrentDistance();
    if (distance <= 0) return 0;
    
    const firstEvent = this.trip.events[0];
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    
    let totalFuelUsed = 0;
    Object.keys(firstEvent.fuelLevels).forEach(tankId => {
      const startLevel = firstEvent.fuelLevels[tankId] || 0;
      const currentLevel = lastEvent.fuelLevels[tankId] || 0;
      totalFuelUsed += (startLevel - currentLevel);
    });
    
    return totalFuelUsed > 0 ? distance / totalFuelUsed : 0;
  }

  getLastFuelLevel(tankId: string): number {
    if (!this.trip || this.trip.events.length === 0) return 0;
    
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return lastEvent.fuelLevels[tankId] || 0;
  }

  isActiveTank(tankId: string): boolean {
    if (!this.trip || this.trip.events.length === 0) return false;
    
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return lastEvent.activeTanks?.includes(tankId) || false;
  }

  getTankColor(percentage: number): string {
    if (percentage > 0.6) return 'success';
    if (percentage > 0.3) return 'warning';
    return 'danger';
  }

  getTankPercentage(tankId: string): number {
    if (!this.activeBoat) return 0;
    
    const tank = this.activeBoat.tanks.find(t => t.id === tankId);
    if (!tank) return 0;
    
    const currentLevel = this.getLastFuelLevel(tankId);
    return Math.round((currentLevel / tank.capacity) * 100);
  }

  getTankName(tankId: string): string {
    if (!this.activeBoat) return '';
    
    const tank = this.activeBoat.tanks.find(t => t.id === tankId);
    return tank ? tank.name : '';
  }

  getTankIcon(tankId: string): string {
    if (!this.activeBoat) return 'water-outline';
    
    const tank = this.activeBoat.tanks.find(t => t.id === tankId);
    if (!tank) return 'water-outline';
    
    switch (tank.type) {
      case 'center': return 'ellipse-outline';
      case 'port_saddle': return 'chevron-back-circle-outline';
      case 'stbd_saddle': return 'chevron-forward-circle-outline';
      case 'aux': return 'battery-half-outline';
      default: return 'water-outline';
    }
  }

  getReversedEvents(): TripEvent[] {
    if (!this.trip) return [];
    return [...this.trip.events].reverse();
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

  getEventBadge(type: string): string {
    switch (type) {
      case 'departure': return 'START';
      case 'tank_switch': return 'SWITCH';
      case 'fuel_stop': return 'FUEL';
      case 'activity_change': return 'ACTIVITY';
      case 'arrival': return 'END';
      default: return 'LOG';
    }
  }

  async showEventOptions() {
    if (this.isNavigating) return;
    
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Add Trip Event',
      buttons: [
        {
          text: 'Switch Tanks',
          icon: 'swap-horizontal-outline',
          handler: () => this.addTankSwitch()
        },
        {
          text: 'Activity Change',
          icon: 'flag-outline',
          handler: () => this.addActivityChange()
        },
        {
          text: 'Fuel Stop',
          icon: 'car-outline',
          handler: () => this.addFuelStop()
        },
        {
          text: 'General Note',
          icon: 'document-text-outline',
          handler: () => this.addGeneralNote()
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async addTankSwitch() {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.router.navigate(['/event-tank-switch', this.tripId]);
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }
  }

  async addActivityChange() {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.router.navigate(['/event-activity', this.tripId]);
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }
  }

  async addFuelStop() {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.router.navigate(['/event-fuel-stop', this.tripId]);
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }
  }

  async addGeneralNote() {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.router.navigate(['/event-note', this.tripId]);
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }
  }

  async endTrip() {
    if (this.isNavigating) return;
    
    const alert = await this.alertCtrl.create({
      header: 'End Trip',
      message: 'Are you ready to end this trip and return to dock?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'End Trip',
          handler: async () => {
            this.isNavigating = true;
            try {
              await this.router.navigate(['/trip-complete', this.tripId]);
            } catch (error) {
              console.error('Error navigating to trip completion:', error);
              await this.showErrorToast('Failed to navigate to trip completion');
            } finally {
              setTimeout(() => {
                this.isNavigating = false;
              }, 1000);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editEvent(eventIndex: number) {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.router.navigate(['/edit-trip-event', this.tripId, eventIndex]);
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: 'danger',
      position: 'bottom',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}