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
                display-format="MMM DD, YYYY HH:mm"
                picker-format="MMM DD YYYY HH:mm"
                [max]="maxDateTime"
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
                  <h2>{{ getTotalSelectedFuel() | number:'1.0-0' }} Gallons</h2>
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
                [(ngModel)]="garminTotalFuel"
                [placeholder]="getTotalSelectedFuel().toString()"
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
          <!-- System Status -->
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

          <!-- Start Trip Button -->
          <div class="ion-margin-top">
            <ion-button 
              expand="block" 
              size="large"
              [color]="canStartTrip() ? 'success' : 'medium'"
              (click)="startTrip()"
              [disabled]="!canStartTrip()">
              <ion-icon [name]="canStartTrip() ? 'play-outline' : 'warning-outline'" slot="start"></ion-icon>
              {{ canStartTrip() ? 'Start Trip' : 'System Check Required' }}
            </ion-button>
          </div>
          
          <!-- Validation Message -->
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
  maxDateTime = new Date().toISOString();

  constructor(
    private boatService: BoatManagementService,
    private tripService: TripManagementService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.activeBoat = await this.boatService.getActiveBoat();
    
    if (this.activeBoat) {
      // Initialize fuel levels with current levels
      this.activeBoat.tanks.forEach(tank => {
        this.fuelLevels[tank.id] = tank.currentLevel;
        this.activeTanks[tank.id] = tank.currentLevel > 0; // Auto-select tanks with fuel
      });

      // Generate default trip name
      this.generateDefaultTripName();
    }
  }

  generateDefaultTripName() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric'
    });
    this.tripName = `Trip - ${dateStr}`;
  }

  getSelectedTanks(): TankConfig[] {
    if (!this.activeBoat) return [];
    
    return this.activeBoat.tanks.filter(tank => this.activeTanks[tank.id]);
  }

  getTotalSelectedFuel(): number {
    const total = this.getSelectedTanks().reduce((total, tank) => {
      return total + (this.fuelLevels[tank.id] || 0);
    }, 0);
    
    // Auto-update garmin total when selection changes
    this.garminTotalFuel = total;
    return total;
  }

  canStartTrip(): boolean {
    if (!this.activeBoat) return false;
    
    const hasSelectedTanks = this.getSelectedTanks().length > 0;
    const hasValidOdometer = this.startingOdometer > 0;
    const hasValidFuelLevels = this.getSelectedTanks().every(tank => {
      const level = this.fuelLevels[tank.id];
      return level > 0 && level <= tank.capacity;
    });
    
    return hasSelectedTanks && hasValidOdometer && hasValidFuelLevels;
  }

  getValidationMessage(): string {
    if (!this.activeBoat) return 'No boat configured';
    
    if (this.getSelectedTanks().length === 0) {
      return 'Select at least one fuel system to activate';
    }
    
    if (this.startingOdometer <= 0) {
      return 'Enter valid odometer reading for navigation';
    }
    
    const invalidTank = this.getSelectedTanks().find(tank => {
      const level = this.fuelLevels[tank.id];
      return level <= 0 || level > tank.capacity;
    });
    
    if (invalidTank) {
      return `Check fuel level configuration for ${invalidTank.name}`;
    }
    
    return '';
  }

  async startTrip() {
    if (!this.activeBoat || !this.canStartTrip()) {
      return;
    }

    try {
      // Create the departure event
      const selectedTankIds = this.getSelectedTanks().map(tank => tank.id);
      const startDate = new Date(this.startDateTime);
      
      const trip = await this.tripService.startTrip(this.activeBoat.id, {
        timestamp: startDate,
        type: 'departure',
        odometer: this.startingOdometer,
        fuelLevels: this.fuelLevels,
        activeTanks: selectedTankIds,
        notes: this.tripNotes || undefined
      }, this.tripName.trim() || undefined, startDate);

      // Update boat tank levels if they've changed
      for (const tank of this.activeBoat.tanks) {
        const newLevel = this.fuelLevels[tank.id];
        if (newLevel !== tank.currentLevel) {
          await this.boatService.updateTankLevel(this.activeBoat.id, tank.id, newLevel);
        }
      }

      const toast = await this.toastCtrl.create({
        message: 'Trip started successfully! Safe travels!',
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      // Navigate to active trip screen
      this.router.navigate(['/trip-active', trip.id]);

    } catch (error) {
      console.error('Error starting trip:', error);
      
      const toast = await this.toastCtrl.create({
        message: 'Trip launch failed. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  formatTankType(type: string): string {
    switch (type) {
      case 'center': return 'Center';
      case 'port_saddle': return 'Port Saddle';
      case 'stbd_saddle': return 'Starboard Saddle';
      case 'aux': return 'Auxiliary';
      default: return type;
    }
  }

  getTankIcon(type: string): string {
    switch (type) {
      case 'center': return 'ellipse-outline';
      case 'port_saddle': return 'chevron-back-circle-outline';
      case 'stbd_saddle': return 'chevron-forward-circle-outline';
      case 'aux': return 'battery-half-outline';
      default: return 'water-outline';
    }
  }

  getTankColor(percentage: number): string {
    if (percentage > 0.6) return 'success';
    if (percentage > 0.3) return 'warning';
    return 'danger';
  }
}