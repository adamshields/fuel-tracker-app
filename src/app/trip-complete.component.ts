import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonNote,
    IonButton, IonText, IonList, IonBadge, IonAvatar, IonThumbnail, 
    IonItemDivider, IonProgressBar, IonIcon
  } from '@ionic/angular/standalone';
import { BoatConfig, Trip } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';


@Component({
  selector: 'app-trip-complete',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonNote, IonButton, IonList, IonBadge, IonAvatar, IonThumbnail, IonItemDivider, IonProgressBar, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/trip-active/' + tripId"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <ion-icon name="flag-outline"></ion-icon>
          Complete Trip
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <!-- Trip Summary -->
      <ion-card *ngIf="trip" color="light" class="ion-margin">
        <ion-card-header>
          <ion-card-title color="dark">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            Trip Summary
          </ion-card-title>
          <ion-card-subtitle color="dark">
            {{ getElapsedTime() }} • {{ trip.events.length }} events logged
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="light" lines="none">
            <ion-icon name="analytics-outline" slot="start" color="primary"></ion-icon>
            <ion-label color="dark">
              <h2>{{ getCurrentDistance() }} Miles</h2>
              <p>Fuel burned: {{ getTotalFuelUsed() | number:'1.1-1' }} gal • Average MPG: {{ getCurrentMPG() | number:'1.1-1' }}</p>
            </ion-label>
            <ion-badge slot="end" color="primary">
              {{ getCurrentMPG() | number:'1.1-1' }} MPG
            </ion-badge>
          </ion-item>

          <ion-list lines="inset" class="ion-margin-top">
            <ion-item color="light">
              <ion-icon name="location-outline" slot="start" color="success"></ion-icon>
              <ion-label color="dark">
                <h3>Distance Traveled</h3>
                <p>Total trip distance</p>
              </ion-label>
              <ion-note slot="end">{{ getCurrentDistance() }} miles</ion-note>
            </ion-item>
            
            <ion-item color="light">
              <ion-icon name="speedometer-outline" slot="start" color="warning"></ion-icon>
              <ion-label color="dark">
                <h3>Fuel Consumed</h3>
                <p>Total fuel usage</p>
              </ion-label>
              <ion-note slot="end">{{ getTotalFuelUsed() | number:'1.1-1' }} gal</ion-note>
            </ion-item>
            
            <ion-item color="light">
              <ion-icon name="trending-up-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label color="dark">
                <h3>Fuel Efficiency</h3>
                <p>Trip average</p>
              </ion-label>
              <ion-note slot="end">{{ getCurrentMPG() | number:'1.1-1' }} MPG</ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Final Readings -->
      <ion-card *ngIf="activeBoat" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="reader-outline"></ion-icon>
            Final Readings
          </ion-card-title>
          <ion-card-subtitle>Enter final readings from instruments</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          
          <ion-list>
            <ion-item-divider>
              <ion-icon name="clipboard-outline" slot="start"></ion-icon>
              <ion-label>Instrument Readings</ion-label>
              <ion-badge slot="end" color="primary">Required</ion-badge>
            </ion-item-divider>

            <ion-item>
              <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">
                Final Odometer
              </ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="finalOdometer"
                [placeholder]="getLastOdometer().toString()">
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-icon name="calculator-outline" slot="start" color="success"></ion-icon>
              <ion-label position="stacked">
                Garmin Total Fuel at Dock
              </ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="finalGarminTotal"
                placeholder="Total fuel reading from Garmin">
              </ion-input>
            </ion-item>
          </ion-list>

          <!-- Calculated Individual Tank Levels -->
          <ion-list *ngIf="finalGarminTotal > 0" class="ion-margin-top">
            <ion-item-divider color="success">
              <ion-icon name="calculator-outline" slot="start"></ion-icon>
              <ion-label>Calculated Tank Levels</ion-label>
              <ion-badge slot="end" color="light">Auto-calculated</ion-badge>
            </ion-item-divider>
            
            <ion-item *ngFor="let tank of activeBoat.tanks">
              <ion-icon 
                [name]="getTankIcon(tank.type)" 
                slot="start"
                [color]="getTankColor(getCalculatedFinalLevel(tank.id) / tank.capacity)">
              </ion-icon>
              <ion-label>
                <h3>{{ tank.name }}</h3>
                <p>{{ getStartingFuelLevel(tank.id) | number:'1.1-1' }} → {{ getCalculatedFinalLevel(tank.id) | number:'1.1-1' }} gal</p>
                <ion-progress-bar 
                  [value]="getCalculatedFinalLevel(tank.id) / tank.capacity"
                  [color]="getTankColor(getCalculatedFinalLevel(tank.id) / tank.capacity)">
                </ion-progress-bar>
              </ion-label>
              <ion-note slot="end">
                <ion-badge [color]="getFuelUsage(tank.id) > 0 ? 'warning' : 'success'">
                  {{ getFuelUsage(tank.id) > 0 ? 'Used' : 'Added' }}
                </ion-badge>
                <br>
                <strong>{{ Math.abs(getFuelUsage(tank.id)) | number:'1.1-1' }} gal</strong>
              </ion-note>
            </ion-item>
          </ion-list>

        </ion-card-content>
      </ion-card>

      <!-- Trip Notes -->
      <ion-card class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="document-text-outline"></ion-icon>
            Trip Notes
          </ion-card-title>
          <ion-card-subtitle>Add any notes about the trip (optional)</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-icon name="create-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">
              Trip Report
            </ion-label>
            <ion-textarea 
              [(ngModel)]="finalNotes"
              placeholder="How was the trip? Any issues, highlights, or notes?"
              rows="4"
              class="ion-margin-top">
            </ion-textarea>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Trip Completion -->
      <ion-card class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="checkmark-done-outline"></ion-icon>
            Complete Trip
          </ion-card-title>
          <ion-card-subtitle>Finalize and save trip data</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="success"
            (click)="completeTrip()"
            [disabled]="!canCompleteTrip()"
            class="ion-margin-bottom">
            <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
            Complete Trip
          </ion-button>
          
          <ion-item *ngIf="!canCompleteTrip()" lines="none" color="warning">
            <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Validation Error:</strong> {{ getValidationMessage() }}
            </ion-label>
          </ion-item>

          <ion-button 
            expand="block" 
            fill="outline"
            color="primary"
            [routerLink]="['/trip-active', tripId]"
            class="ion-margin-top">
            <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
            Continue Trip
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Trip Statistics -->
      <ion-card class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="bar-chart-outline"></ion-icon>
            Trip Statistics
          </ion-card-title>
          <ion-card-subtitle>Performance summary</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-icon name="time-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Trip Duration</h3>
                <p>Total time on water</p>
              </ion-label>
              <ion-badge slot="end" color="primary">{{ getElapsedTime() }}</ion-badge>
            </ion-item>
            
            <ion-item>
              <ion-icon name="list-outline" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Events Logged</h3>
                <p>Trip checkpoints</p>
              </ion-label>
              <ion-badge slot="end" color="success">{{ trip?.events?.length || 0 }}</ion-badge>
            </ion-item>
            
            <ion-item>
              <ion-icon name="trending-up-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Efficiency Rating</h3>
                <p>Fuel performance</p>
              </ion-label>
              <ion-badge slot="end" [color]="getEfficiencyColor()">
                {{ getEfficiencyRating() }}
              </ion-badge>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class TripCompleteComponent implements OnInit {
  trip: Trip | null = null;
  activeBoat: BoatConfig | null = null;
  tripId!: string;
  
  finalOdometer = 0;
  finalGarminTotal = 0;
  finalNotes = '';
  
  // Expose Math to template
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boatService: BoatManagementService,
    private tripService: TripManagementService,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    await this.loadTripData();
  }

  async loadTripData() {
    const trips = await this.tripService.getTrips();
    this.trip = trips.find(t => t.id === this.tripId) || null;
    
    if (this.trip) {
      this.activeBoat = await this.boatService.getActiveBoat();
      
      // Initialize final odometer
      this.finalOdometer = this.getLastOdometer();
      
      // Initialize Garmin total with last known total
      if (this.trip.events.length > 0) {
        const lastEvent = this.trip.events[this.trip.events.length - 1];
        this.finalGarminTotal = Object.values(lastEvent.fuelLevels).reduce((sum, level) => sum + level, 0);
      }
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
    if (!this.trip || this.trip.events.length === 0) return 0;
    
    const firstEvent = this.trip.events[0];
    return this.finalOdometer - firstEvent.odometer;
  }

  getTotalFuelUsed(): number {
    if (!this.trip || this.trip.events.length === 0 || this.finalGarminTotal <= 0) return 0;
    
    const firstEvent = this.trip.events[0];
    const startingTotal = Object.values(firstEvent.fuelLevels).reduce((sum, level) => sum + level, 0);
    
    return startingTotal - this.finalGarminTotal;
  }

  getCurrentMPG(): number {
    const distance = this.getCurrentDistance();
    const fuelUsed = this.getTotalFuelUsed();
    
    return distance > 0 && fuelUsed > 0 ? distance / fuelUsed : 0;
  }

  getLastFuelLevel(tankId: string): number {
    if (!this.trip || this.trip.events.length === 0) return 0;
    
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return lastEvent.fuelLevels[tankId] || 0;
  }

  getLastOdometer(): number {
    if (!this.trip || this.trip.events.length === 0) return 0;
    
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return lastEvent.odometer;
  }

  getStartingFuelLevel(tankId: string): number {
    if (!this.trip || this.trip.events.length === 0) return 0;
    
    const firstEvent = this.trip.events[0];
    return firstEvent.fuelLevels[tankId] || 0;
  }

  getCalculatedFinalLevel(tankId: string): number {
    if (!this.trip || this.trip.events.length === 0 || this.finalGarminTotal <= 0) {
      return this.getLastFuelLevel(tankId);
    }

    // Calculate what the individual tank levels should be based on the Garmin total
    try {
      const lastEvent = this.trip.events[this.trip.events.length - 1];
      const lastGarminTotal = Object.values(lastEvent.fuelLevels).reduce((sum, level) => sum + level, 0);
      const fuelBurned = lastGarminTotal - this.finalGarminTotal;
      
      if (fuelBurned <= 0) {
        // No fuel burned or fuel added
        return this.getLastFuelLevel(tankId);
      }
      
      // Check if this tank was active in the last segment
      const activeTanks = lastEvent.activeTanks || [];
      if (activeTanks.includes(tankId) && activeTanks.length > 0) {
        // Distribute fuel burn evenly across active tanks
        const burnPerTank = fuelBurned / activeTanks.length;
        return Math.max(0, this.getLastFuelLevel(tankId) - burnPerTank);
      } else {
        // Tank wasn't active, level unchanged
        return this.getLastFuelLevel(tankId);
      }
    } catch (error) {
      return this.getLastFuelLevel(tankId);
    }
  }

  getFuelUsage(tankId: string): number {
    const startLevel = this.getStartingFuelLevel(tankId);
    const endLevel = this.getCalculatedFinalLevel(tankId);
    return startLevel - endLevel; // Positive = used, Negative = added
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

  getEfficiencyRating(): string {
    const mpg = this.getCurrentMPG();
    if (mpg > 4) return 'Excellent';
    if (mpg > 3) return 'Good';
    if (mpg > 2) return 'Average';
    if (mpg > 1) return 'Poor';
    return 'Critical';
  }

  getEfficiencyColor(): string {
    const mpg = this.getCurrentMPG();
    if (mpg > 4) return 'success';
    if (mpg > 3) return 'primary';
    if (mpg > 2) return 'warning';
    if (mpg > 1) return 'danger';
    return 'dark';
  }

  canCompleteTrip(): boolean {
    if (!this.activeBoat || !this.trip) return false;
    
    // Check odometer is valid
    if (this.finalOdometer <= this.getLastOdometer()) return false;
    
    // Check Garmin total is valid
    if (this.finalGarminTotal <= 0) return false;
    
    return true;
  }

  getValidationMessage(): string {
    if (!this.activeBoat || !this.trip) return 'Loading trip data...';
    
    if (this.finalOdometer <= this.getLastOdometer()) {
      return 'Final odometer must exceed current reading';
    }
    
    if (this.finalGarminTotal <= 0) {
      return 'Enter final Garmin total fuel reading';
    }
    
    return '';
  }

  async completeTrip() {
    if (!this.trip || !this.canCompleteTrip()) return;

    try {
      // Use the new Garmin-based method
      await this.tripService.addTripEventWithGarmin(this.tripId, {
        timestamp: new Date(),
        type: 'arrival',
        odometer: this.finalOdometer,
        garminTotalFuel: this.finalGarminTotal,
        activeTanks: [], // No active tanks when docked
        notes: this.finalNotes || undefined
      });

      const toast = await this.toastCtrl.create({
        message: 'Trip completed successfully!',
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      // Navigate to trip summary or dashboard
      this.router.navigate(['/dashboard']);

    } catch (error) {
      console.error('Error completing trip:', error);
      
      const toast = await this.toastCtrl.create({
        message: 'Error completing trip. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}