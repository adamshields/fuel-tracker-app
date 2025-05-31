import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, 
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, 
  IonCardContent, IonItem, IonLabel, IonProgressBar, IonNote, 
  IonList, IonBadge, IonItemDivider, IonChip, IonAvatar, IonThumbnail
} from '@ionic/angular/standalone';

import { BoatConfig, Trip } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';
import { Preferences } from '@capacitor/preferences';




@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonProgressBar, IonNote, IonList, IonBadge, IonItemDivider, IonChip],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="boat-outline"></ion-icon>
          Fuel Tracker
        </ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/boat-setup" fill="clear">
            <ion-icon name="settings-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      
      <!-- Active Trip Alert -->
      <ion-card *ngIf="activeTrip" color="warning" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="navigate-circle-outline"></ion-icon>
            {{ activeTrip.name || 'Trip in Progress' }}
          </ion-card-title>
          <ion-card-subtitle>
            Started {{ activeTrip.startDate | date:'short' }}
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="warning" lines="none">
            <ion-icon name="analytics-outline" slot="start"></ion-icon>
            <ion-label>
              <h3>{{ activeTrip.events.length }} Events Logged</h3>
              <p>Trip is currently being tracked</p>
            </ion-label>
            <ion-badge slot="end" color="dark">ACTIVE</ion-badge>
          </ion-item>
          
          <div class="ion-margin-top">
            <ion-button 
              expand="block" 
              color="dark"
              [disabled]="isNavigating"
              (click)="continueTrip()">
              <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'play-outline'" slot="start"></ion-icon>
              {{ isNavigating ? 'Loading...' : 'Continue Trip' }}
            </ion-button>
            
            <ion-button 
              expand="block" 
              fill="outline" 
              color="dark"
              [disabled]="isNavigating"
              (click)="endTrip()">
              <ion-icon name="stop-outline" slot="start"></ion-icon>
              End Trip
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Fuel Status Overview -->
      <ion-card *ngIf="activeBoat" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="boat-outline"></ion-icon>
            {{ activeBoat.name }}
          </ion-card-title>
          <ion-card-subtitle>
            Fuel Status Overview
          </ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <!-- Total Fuel Display -->
          <ion-item lines="full">
            <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h1>{{ totalFuel | number:'1.0-0' }} Gallons</h1>
              <h3>{{ totalCapacity | number:'1.0-0' }} total capacity</h3>
              <p>{{ getFuelPercentage() }}% of capacity remaining</p>
            </ion-label>
            <ion-badge 
              slot="end" 
              [color]="getTotalFuelColor()">
              {{ getFuelPercentage() }}%
            </ion-badge>
          </ion-item>
          
          <ion-progress-bar 
            [value]="totalFuel / totalCapacity"
            [color]="getTotalFuelColor()">
          </ion-progress-bar>

          <!-- Individual Tank Status -->
          <ion-list lines="inset" class="ion-margin-top">
            <ion-item-divider>
              <ion-icon name="layers-outline" slot="start"></ion-icon>
              <ion-label>Tank Details</ion-label>
            </ion-item-divider>
            
            <ion-item *ngFor="let tank of activeBoat.tanks">
              <ion-icon 
                [name]="getTankIcon(tank.type)" 
                slot="start"
                [color]="getTankColor(tank.currentLevel / tank.capacity)">
              </ion-icon>
              
              <ion-label>
                <h3>{{ tank.name }}</h3>
                <p>{{ formatTankType(tank.type) }} Tank</p>
                <p>{{ tank.currentLevel | number:'1.1-1' }} / {{ tank.capacity }} gal</p>
              </ion-label>
              
              <ion-note slot="end">
                <ion-badge 
                  [color]="getTankColor(tank.currentLevel / tank.capacity)">
                  {{ getTankPercentage(tank) }}%
                </ion-badge>
                <ion-progress-bar 
                  [value]="tank.currentLevel / tank.capacity"
                  [color]="getTankColor(tank.currentLevel / tank.capacity)"
                  class="ion-margin-top">
                </ion-progress-bar>
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Trip Management -->
      <ion-card *ngIf="activeBoat && !activeTrip" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="add-circle-outline"></ion-icon>
            Trip Management
          </ion-card-title>
          <ion-card-subtitle>Start tracking a new trip</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="success"
            [disabled]="totalFuel <= 0 || isNavigating"
            (click)="startTrip()">
            <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'play-outline'" slot="start"></ion-icon>
            {{ isNavigating ? 'Loading...' : 'Start New Trip' }}
          </ion-button>
          
          <ion-item *ngIf="totalFuel <= 0" color="warning" lines="none" class="ion-margin-top">
            <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Fuel Required:</strong> Add fuel to your tanks before starting a trip
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Recent Trips (Limited to 4) -->
      <ion-card *ngIf="recentTrips.length > 0" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="document-text-outline"></ion-icon>
            Recent Trips
          </ion-card-title>
          <ion-card-subtitle>Your latest fuel tracking history</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="inset">
            <ion-item *ngFor="let trip of recentTrips" button (click)="viewTrip(trip.id)" [disabled]="isNavigating">
              <ion-icon name="boat-outline" slot="start" color="primary"></ion-icon>
              
              <ion-label>
                <h3>{{ trip.name || (trip.startDate | date:'MMM d, yyyy') }}</h3>
                <p>{{ trip.events.length }} events recorded</p>
                <p>Distance: {{ calculateTripDistance(trip) }} miles</p>
              </ion-label>
              
              <ion-note slot="end">
                <ion-badge color="success">
                  {{ calculateTripDistance(trip) }} mi
                </ion-badge>
                <br>
                <ion-chip color="medium" size="small">
                  <ion-label>{{ trip.status | titlecase }}</ion-label>
                </ion-chip>
              </ion-note>
            </ion-item>
          </ion-list>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            color="primary"
            [disabled]="isNavigating"
            routerLink="/log"
            class="ion-margin-top">
            <ion-icon name="list-outline" slot="start"></ion-icon>
            View All Trips
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Setup Required -->
      <ion-card *ngIf="!activeBoat && !isLoading" color="light" class="ion-margin">
        <ion-card-header>
          <ion-card-title color="dark">
            <ion-icon name="construct-outline"></ion-icon>
            Setup Required
          </ion-card-title>
          <ion-card-subtitle color="dark">Configure your boat to begin tracking</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="light" lines="none">
            <ion-icon name="information-circle-outline" slot="start" color="primary"></ion-icon>
            <ion-label color="dark" class="ion-text-wrap">
              <h3>Welcome to Fuel Tracker</h3>
              <p>Configure your boat and fuel tanks to begin tracking your trips on the water.</p>
            </ion-label>
          </ion-item>
          
          <ion-button 
            expand="block" 
            color="primary"
            [disabled]="isNavigating"
            routerLink="/boat-setup"
            class="ion-margin-top">
            <ion-icon name="settings-outline" slot="start"></ion-icon>
            Configure Boat
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Quick Actions -->
      <ion-card *ngIf="activeBoat" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="grid-outline"></ion-icon>
            Quick Actions
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item button routerLink="/boat-setup" [disabled]="isNavigating">
              <ion-icon name="settings-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Boat Configuration</h3>
                <p>Manage tanks and settings</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
            
            <ion-item button routerLink="/log" [disabled]="isNavigating">
              <ion-icon name="list-outline" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Trip History</h3>
                <p>View all logged trips</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Loading State -->
      <ion-card *ngIf="isLoading" class="ion-margin">
        <ion-card-content>
          <ion-item lines="none">
            <ion-icon name="hourglass-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Loading Dashboard...</h3>
              <p>Please wait while we load your boat information</p>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class DashboardComponent implements OnInit {
  activeBoat: BoatConfig | null = null;
  activeTrip: Trip | null = null;
  recentTrips: Trip[] = [];
  totalFuel = 0;
  totalCapacity = 0;
  
  // Loading states
  isLoading = false;
  isNavigating = false;

  constructor(
    private boatService: BoatManagementService,
    private tripService: TripManagementService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    // await Preferences.clear();
    await this.loadData();
  }

  async ionViewWillEnter() {
    // Always refresh when returning to dashboard
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.activeBoat = await this.boatService.getActiveBoat();
      
      if (this.activeBoat) {
        this.totalFuel = await this.boatService.getTotalFuel(this.activeBoat.id);
        this.totalCapacity = await this.boatService.getTotalCapacity(this.activeBoat.id);
      }

      this.activeTrip = await this.tripService.getActiveTrip();
      
      const allTrips = await this.tripService.getTrips();
      // Limit recent trips to only 4
      this.recentTrips = allTrips
        .filter(trip => trip.status === 'completed')
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
        .slice(0, 4); // Changed from 5 to 4
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      await this.showErrorToast('Failed to load dashboard data');
    } finally {
      this.isLoading = false;
    }
  }

  async startTrip() {
    if (!this.activeBoat || this.totalFuel <= 0 || this.isNavigating) {
      return;
    }
    
    this.isNavigating = true;
    try {
      // Reset loading state before navigation
      this.isNavigating = false;
      this.router.navigate(['/trip-start'], { replaceUrl: true });
    } catch (error) {
      console.error('Error navigating to trip start:', error);
      await this.showErrorToast('Failed to navigate to trip start');
      this.isNavigating = false; // Reset on error
    }
  }

  async continueTrip() {
    if (!this.activeTrip || this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      // Reset loading state before navigation
      this.isNavigating = false;
      this.router.navigate(['/trip-active', this.activeTrip.id], { replaceUrl: true });
    } catch (error) {
      console.error('Error navigating to active trip:', error);
      await this.showErrorToast('Failed to navigate to active trip');
      this.isNavigating = false; // Reset on error
    }
  }

  async endTrip() {
    if (!this.activeTrip || this.isNavigating) return;

    const alert = await this.alertCtrl.create({
      header: 'End Trip',
      message: 'Are you sure you want to end this trip?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'End Trip',
          handler: async () => {
            this.isNavigating = true;
            try {
              // Reset loading state before navigation
              this.isNavigating = false;
              this.router.navigate(['/trip-complete', this.activeTrip!.id], { replaceUrl: true });
            } catch (error) {
              console.error('Error ending trip:', error);
              await this.showErrorToast('Failed to navigate to trip completion');
              this.isNavigating = false; // Reset on error
            }
          }
        }
      ]
    });

    await alert.present();
  }

  calculateTripDistance(trip: Trip): number {
    if (trip.events.length < 2) return 0;
    
    const firstEvent = trip.events[0];
    const lastEvent = trip.events[trip.events.length - 1];
    
    return lastEvent.odometer - firstEvent.odometer;
  }

  async viewTrip(tripId: string) {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      // Reset loading state before navigation
      this.isNavigating = false;
      this.router.navigate(['/trip-details', tripId], { replaceUrl: true });
    } catch (error) {
      console.error('Error navigating to trip details:', error);
      await this.showErrorToast('Failed to open trip details');
      this.isNavigating = false; // Reset on error
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

  getTotalFuelColor(): string {
    const percentage = this.totalFuel / this.totalCapacity;
    if (percentage > 0.6) return 'success';
    if (percentage > 0.3) return 'warning';
    return 'danger';
  }

  getTankColor(percentage: number): string {
    if (percentage > 0.6) return 'success';
    if (percentage > 0.3) return 'warning';
    return 'danger';
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

  getFuelPercentage(): number {
    if (this.totalCapacity === 0) return 0;
    return Math.round((this.totalFuel / this.totalCapacity) * 100);
  }

  getTankPercentage(tank: any): number {
    if (tank.capacity === 0) return 0;
    return Math.round((tank.currentLevel / tank.capacity) * 100);
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
}