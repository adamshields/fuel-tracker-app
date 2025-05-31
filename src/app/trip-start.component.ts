import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonNote,
  IonCheckbox, IonChip, IonButton, IonList, IonIcon, IonBadge,
  IonItemDivider, IonProgressBar, IonAvatar, IonThumbnail, IonDatetime
} from '@ionic/angular/standalone';

import { BoatConfig, TankConfig } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';

@Component({
  selector: 'app-trip-start',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonNote, IonCheckbox, IonChip, IonButton, IonList, IonIcon, IonBadge, IonItemDivider, IonDatetime],
  template: `
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/dashboard"></ion-back-button>
    </ion-buttons>
    <ion-title>
      Start Trip
    </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">

  <!-- Trip Basic Information -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>
        <ion-icon name="information-circle-outline"></ion-icon>
        Trip Information
      </ion-card-title>
      <ion-card-subtitle>
        Configure trip details and start time
      </ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <ion-list>
        <ion-item>
          <ion-icon name="create-outline" slot="start" color="primary"></ion-icon>
          <ion-label position="stacked">Trip Name</ion-label>
          <ion-input 
            [(ngModel)]="tripName"
            placeholder="e.g., Sandbar Trip, Wahoo Fishing Trip">
          </ion-input>
        </ion-item>

        <ion-item>
          <ion-icon name="calendar-outline" slot="start" color="success"></ion-icon>
          <ion-label position="stacked">Start Date & Time</ion-label>
          <ion-datetime 
            [(ngModel)]="startDateTime"
            [max]="maxDateTime"
            display-format="MMM DD, YYYY HH:mm"
            picker-format="MMM DD YYYY HH:mm"
            presentation="date-time">
          </ion-datetime>
        </ion-item>
      </ion-list>
    </ion-card-content>
  </ion-card>

  <!-- Fuel Configuration -->
  <ion-card *ngIf="activeBoat">
    <ion-card-header>
      <ion-card-title>
        <ion-icon name="checkmark-circle-outline"></ion-icon>
        Fuel Configuration
      </ion-card-title>
      <ion-card-subtitle>
        Verify tank levels and select active systems
      </ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>

      <!-- Tank Level Configuration -->
      <ion-list>
        <ion-item-divider>
          <ion-icon name="water-outline" slot="start"></ion-icon>
          <ion-label>Tank Fuel Levels</ion-label>
        </ion-item-divider>

        <ion-item *ngFor="let tank of activeBoat.tanks">
          <ion-icon 
            [name]="getTankIcon(tank.type)" 
            slot="start"
            [color]="getTankColor(tank.currentLevel / tank.capacity)">
          </ion-icon>

          <ion-label position="stacked">
            {{ tank.name }} ({{ formatTankType(tank.type) }})
          </ion-label>

          <ion-input 
            type="number" 
            [(ngModel)]="fuelLevels[tank.id]"
            (ngModelChange)="updateGarminTotalFuel()"
            [placeholder]="tank.currentLevel.toString()"
            [max]="tank.capacity"
            min="0">
          </ion-input>

          <ion-note slot="end">
            <ion-badge [color]="getTankColor(tank.currentLevel / tank.capacity)">
              {{ tank.capacity }} gal max
            </ion-badge>
          </ion-note>
        </ion-item>
      </ion-list>

      <!-- Tank Selection -->
      <ion-list class="ion-margin-top">
        <ion-item-divider>
          <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
          <ion-label>Active Fuel Systems</ion-label>
        </ion-item-divider>

        <ion-item *ngFor="let tank of activeBoat.tanks">
          <ion-checkbox 
            slot="start" 
            [(ngModel)]="activeTanks[tank.id]"
            (ngModelChange)="updateGarminTotalFuel()"
            [color]="getTankColor(tank.currentLevel / tank.capacity)">
          </ion-checkbox>

          <ion-icon 
            [name]="getTankIcon(tank.type)" 
            slot="start"
            color="primary">
          </ion-icon>

          <ion-label>
            <h3>{{ tank.name }}</h3>
            <p>{{ formatTankType(tank.type) }} Tank</p>
            <p>{{ fuelLevels[tank.id] || 0 | number:'1.1-1' }} gallons available</p>
          </ion-label>

          <ion-badge 
            slot="end" 
            [color]="activeTanks[tank.id] ? 'success' : 'medium'">
            {{ activeTanks[tank.id] ? 'ACTIVE' : 'STANDBY' }}
          </ion-badge>
        </ion-item>
      </ion-list>

      <!-- Selected Tanks Summary -->
      <ion-card *ngIf="getSelectedTanks().length > 0" color="light" class="ion-margin-top">
        <ion-card-header>
          <ion-card-title color="dark">
            <ion-icon name="analytics-outline"></ion-icon>
            Trip Configuration
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="light" lines="none">
            <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
            <ion-label color="dark">
              <h2>{{ garminTotalFuel | number:'1.0-0' }} Gallons</h2>
              <p>Total fuel selected for trip</p>
            </ion-label>
            <ion-badge slot="end" color="primary">
              {{ getSelectedTanks().length }} Tank{{ getSelectedTanks().length !== 1 ? 's' : '' }}
            </ion-badge>
          </ion-item>

          <ion-item color="light" lines="none">
            <ion-label color="dark">
              <h4>Active Systems:</h4>
              <div>
                <ion-chip *ngFor="let tank of getSelectedTanks()" color="primary">
                  <ion-icon [name]="getTankIcon(tank.type)"></ion-icon>
                  <ion-label>{{ tank.name }}</ion-label>
                </ion-chip>
              </div>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

    </ion-card-content>
  </ion-card>

  <!-- Trip Parameters -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>
        <ion-icon name="map-outline"></ion-icon>
        Trip Parameters
      </ion-card-title>
      <ion-card-subtitle>Configure tracking information</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <ion-list>
        <ion-item>
          <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
          <ion-label position="stacked">Starting Odometer</ion-label>
          <ion-input 
            type="number" 
            [(ngModel)]="startingOdometer"
            placeholder="Current odometer reading">
          </ion-input>
          <ion-note slot="end">
            <ion-badge color="primary">MILES</ion-badge>
          </ion-note>
        </ion-item>

        <ion-item>
          <ion-icon name="calculator-outline" slot="start" color="success"></ion-icon>
          <ion-label position="stacked">Garmin Total Fuel</ion-label>
          <ion-input 
            type="number" 
            [value]="garminTotalFuel"
            readonly>
          </ion-input>
          <ion-note slot="end">
            <ion-badge color="success">AUTO-CALC</ion-badge>
          </ion-note>
        </ion-item>

        <ion-item>
          <ion-icon name="document-text-outline" slot="start" color="tertiary"></ion-icon>
          <ion-label position="stacked">Trip Notes (optional)</ion-label>
          <ion-textarea 
            [(ngModel)]="tripNotes"
            placeholder="Fishing trip, family outing, equipment testing..."
            rows="3">
          </ion-textarea>
        </ion-item>
      </ion-list>
    </ion-card-content>
  </ion-card>

  <!-- System Check -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>
        <ion-icon name="shield-checkmark-outline"></ion-icon>
        System Check
      </ion-card-title>
      <ion-card-subtitle>Verify all systems before departure</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <ion-list *ngIf="activeBoat">
        <ion-item>
          <ion-icon name="checkmark-circle-outline" slot="start" [color]="getSelectedTanks().length > 0 ? 'success' : 'danger'"></ion-icon>
          <ion-label>
            <h3>Fuel Systems</h3>
            <p>{{ getSelectedTanks().length > 0 ? 'Operational' : 'Not configured' }}</p>
          </ion-label>
          <ion-badge slot="end" [color]="getSelectedTanks().length > 0 ? 'success' : 'danger'">
            {{ getSelectedTanks().length > 0 ? 'READY' : 'ERROR' }}
          </ion-badge>
        </ion-item>

        <ion-item>
          <ion-icon name="speedometer-outline" slot="start" [color]="startingOdometer > 0 ? 'success' : 'danger'"></ion-icon>
          <ion-label>
            <h3>Navigation System</h3>
            <p>{{ startingOdometer > 0 ? 'Odometer configured' : 'Odometer required' }}</p>
          </ion-label>
          <ion-badge slot="end" [color]="startingOdometer > 0 ? 'success' : 'danger'">
            {{ startingOdometer > 0 ? 'READY' : 'ERROR' }}
          </ion-badge>
        </ion-item>

        <ion-item>
          <ion-icon name="create-outline" slot="start" [color]="tripName.trim().length > 0 ? 'success' : 'warning'"></ion-icon>
          <ion-label>
            <h3>Trip Information</h3>
            <p>{{ tripName.trim().length > 0 ? 'Trip name configured' : 'Trip name recommended' }}</p>
          </ion-label>
          <ion-badge slot="end" [color]="tripName.trim().length > 0 ? 'success' : 'warning'">
            {{ tripName.trim().length > 0 ? 'READY' : 'OPTIONAL' }}
          </ion-badge>
        </ion-item>

        <ion-item>
          <ion-icon name="shield-checkmark-outline" slot="start" [color]="canStartTrip() ? 'success' : 'warning'"></ion-icon>
          <ion-label>
            <h3>Overall Status</h3>
            <p>{{ canStartTrip() ? 'All systems ready' : 'System check required' }}</p>
          </ion-label>
          <ion-badge slot="end" [color]="canStartTrip() ? 'success' : 'warning'">
            {{ canStartTrip() ? 'GO' : 'HOLD' }}
          </ion-badge>
        </ion-item>
      </ion-list>

      <div class="ion-margin-top">
        <ion-button 
          expand="block" 
          size="large"
          [color]="canStartTrip() ? 'success' : 'medium'"
          (click)="startTrip()"
          [disabled]="!canStartTrip() || isStartingTrip">
          <ion-icon [name]="isStartingTrip ? 'hourglass-outline' : (canStartTrip() ? 'play-outline' : 'warning-outline')" slot="start"></ion-icon>
          {{ isStartingTrip ? 'Starting Trip...' : (canStartTrip() ? 'Start Trip' : 'System Check Required') }}
        </ion-button>
      </div>

      <ion-item *ngIf="!canStartTrip()" color="warning" lines="none" class="ion-margin-top">
        <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
        <ion-label class="ion-text-wrap">
          <strong>System Alert:</strong> {{ getValidationMessage() }}
        </ion-label>
      </ion-item>
    </ion-card-content>
  </ion-card>

</ion-content>

  `
})
export class TripStartComponent implements OnInit {
  activeBoat: BoatConfig | null = null;
  fuelLevels: { [tankId: string]: number } = {};
  activeTanks: { [tankId: string]: boolean } = {};
  startingOdometer = 0;
  garminTotalFuel = 0;
  tripNotes = '';
  tripName = '';
  startDateTime = new Date().toISOString();
  maxDateTime = '';

  isStartingTrip = false;

  constructor(
    private boatService: BoatManagementService,
    private tripService: TripManagementService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.maxDateTime = new Date().toISOString();
    this.initBoatAndDefaults();
  }

  private async initBoatAndDefaults() {
    this.activeBoat = await this.boatService.getActiveBoat();

    if (this.activeBoat) {
      this.activeBoat.tanks.forEach(tank => {
        this.fuelLevels[tank.id] = tank.currentLevel;
        this.activeTanks[tank.id] = tank.currentLevel > 0;
      });
      this.generateDefaultTripName();
    }
  }

  private generateDefaultTripName() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    this.tripName = `Trip - ${dateStr}`;
  }

  getSelectedTanks(): TankConfig[] {
    return this.activeBoat?.tanks.filter(tank => this.activeTanks[tank.id]) ?? [];
  }

  getTotalSelectedFuel(): number {
    const total = this.getSelectedTanks().reduce((sum, tank) => sum + (this.fuelLevels[tank.id] || 0), 0);
    this.garminTotalFuel = total;
    return total;
  }
  
  updateGarminTotalFuel(): void {
    this.garminTotalFuel = this.getSelectedTanks().reduce((sum, tank) => {
      return sum + (this.fuelLevels[tank.id] || 0);
    }, 0);
  }
  
  canStartTrip(): boolean {
    if (!this.activeBoat) return false;

    const hasTanks = this.getSelectedTanks().length > 0;
    const validOdo = this.startingOdometer > 0;
    const validFuel = this.getSelectedTanks().every(t => {
      const level = this.fuelLevels[t.id];
      return level > 0 && level <= t.capacity;
    });

    return hasTanks && validOdo && validFuel;
  }

  getValidationMessage(): string {
    if (!this.activeBoat) return 'No boat configured';
    if (this.getSelectedTanks().length === 0) return 'Select at least one fuel system to activate';
    if (this.startingOdometer <= 0) return 'Enter valid odometer reading for navigation';

    const invalid = this.getSelectedTanks().find(t => {
      const lvl = this.fuelLevels[t.id];
      return lvl <= 0 || lvl > t.capacity;
    });

    return invalid ? `Check fuel level configuration for ${invalid.name}` : '';
  }

  async startTrip(): Promise<void> {
    if (!this.canStartTrip() || !this.activeBoat || this.isStartingTrip) return;

    this.isStartingTrip = true;
    try {
      const selectedTankIds = this.getSelectedTanks().map(t => t.id);
      const startTime = new Date(this.startDateTime);

      const trip = await this.tripService.startTrip(
        this.activeBoat.id,
        {
          timestamp: startTime,
          type: 'departure',
          odometer: this.startingOdometer,
          fuelLevels: this.fuelLevels,
          activeTanks: selectedTankIds,
          notes: this.tripNotes || undefined
        },
        this.tripName.trim() || undefined,
        startTime
      );

      for (const tank of this.activeBoat.tanks) {
        const updatedLevel = this.fuelLevels[tank.id];
        if (updatedLevel !== tank.currentLevel) {
          await this.boatService.updateTankLevel(this.activeBoat.id, tank.id, updatedLevel);
        }
      }

      await this.toastCtrl.create({
        message: 'Trip started successfully! Safe travels!',
        duration: 3000,
        color: 'success',
      }).then(toast => toast.present());

      this.router.navigate(['/trip-active', trip.id], { replaceUrl: true });
    } catch (err) {
      console.error('Error starting trip:', err);
      await this.toastCtrl.create({
        message: 'Trip launch failed. Please try again.',
        duration: 3000,
        color: 'danger',
      }).then(toast => toast.present());
    } finally {
      this.isStartingTrip = false;
    }
  }

  formatTankType(type: string): string {
    return ({
      center: 'Center',
      port_saddle: 'Port Saddle',
      stbd_saddle: 'Starboard Saddle',
      aux: 'Auxiliary',
    } as Record<string, string>)[type] ?? type;
  }

  getTankIcon(type: string): string {
    return ({
      center: 'ellipse-outline',
      port_saddle: 'chevron-back-circle-outline',
      stbd_saddle: 'chevron-forward-circle-outline',
      aux: 'battery-half-outline',
    } as Record<string, string>)[type] ?? 'water-outline';
  }

  getTankColor(percentage: number): string {
    return percentage > 0.6 ? 'success' : percentage > 0.3 ? 'warning' : 'danger';
  }
}