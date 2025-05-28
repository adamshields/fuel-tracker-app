import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonProgressBar, IonBadge, IonChip, 
    IonList, IonNote, IonSearchbar, IonSelect, IonSelectOption, IonItemDivider,
    IonFab, IonFabButton
  } from '@ionic/angular/standalone';
import { BoatConfig, Trip } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';

@Component({
  selector: 'app-trip-log',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel,  IonBadge,  IonList, IonNote, IonSearchbar, IonSelect, IonSelectOption, IonItemDivider, IonFab, IonFabButton],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button routerLink="/dashboard" fill="clear">
            <ion-icon name="home-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <!-- <ion-icon name="list-outline"></ion-icon> -->
          Trip Log
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showFilterOptions()" fill="clear" [disabled]="isLoading">
            <ion-icon name="funnel-outline" slot="icon-only"></ion-icon>
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
              <h3>Loading Trip History...</h3>
              <p>Please wait while we load your trips</p>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Search and Filter Bar -->
      <ion-card *ngIf="!isLoading" class="ion-margin">
        <ion-card-content>
          <ion-searchbar 
            [(ngModel)]="searchTerm"
            (ionInput)="filterTrips()"
            placeholder="Search trips by notes or date"
            show-clear-button="focus">
          </ion-searchbar>
          
          <ion-item lines="none">
            <ion-icon name="options-outline" slot="start" color="primary"></ion-icon>
            <ion-label>Sort by:</ion-label>
            <ion-select 
              [(ngModel)]="sortBy" 
              (ionChange)="sortTrips()"
              interface="popover"
              slot="end">
              <ion-select-option value="date-desc">Newest First</ion-select-option>
              <ion-select-option value="date-asc">Oldest First</ion-select-option>
              <ion-select-option value="distance-desc">Longest Distance</ion-select-option>
              <ion-select-option value="distance-asc">Shortest Distance</ion-select-option>
              <ion-select-option value="mpg-desc">Best MPG</ion-select-option>
              <ion-select-option value="mpg-asc">Worst MPG</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Trip Statistics Summary -->
      <ion-card *ngIf="tripStats && !isLoading" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="analytics-outline"></ion-icon>
            Trip Statistics
          </ion-card-title>
          <ion-card-subtitle>Summary of all logged trips</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-icon name="boat-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Total Trips</h3>
                <p>{{ tripStats.totalTrips }} completed</p>
              </ion-label>
              <ion-note slot="end">{{ tripStats.totalTrips }}</ion-note>
            </ion-item>
            
            <ion-item>
              <ion-icon name="location-outline" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Total Distance</h3>
                <p>{{ tripStats.totalDistance }} miles traveled</p>
              </ion-label>
              <ion-note slot="end">{{ tripStats.totalDistance }} mi</ion-note>
            </ion-item>
            
            <ion-item>
              <ion-icon name="speedometer-outline" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Total Fuel Used</h3>
                <p>{{ tripStats.totalFuelUsed | number:'1.1-1' }} gallons consumed</p>
              </ion-label>
              <ion-note slot="end">{{ tripStats.totalFuelUsed | number:'1.1-1' }} gal</ion-note>
            </ion-item>
            
            <ion-item>
              <ion-icon name="trending-up-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Average MPG</h3>
                <p>{{ tripStats.averageMPG | number:'1.1-1' }} fuel efficiency</p>
              </ion-label>
              <ion-note slot="end">{{ tripStats.averageMPG | number:'1.1-1' }} MPG</ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Active Trip Alert -->
      <ion-card *ngIf="activeTrip && !isLoading" color="warning" class="ion-margin">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="navigate-circle-outline"></ion-icon>
            Active Trip
          </ion-card-title>
          <ion-card-subtitle>Trip currently in progress</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="warning" lines="none">
            <ion-icon name="time-outline" slot="start" color="dark"></ion-icon>
            <ion-label color="dark">
              <h3>Started {{ activeTrip.startDate | date:'MMM d, HH:mm' }}</h3>
              <p>{{ activeTrip.events.length }} events logged</p>
            </ion-label>
          </ion-item>
          
          <ion-button 
            expand="block" 
            color="dark"
            [disabled]="isNavigating"
            [routerLink]="['/trip-active', activeTrip.id]"
            class="ion-margin-top">
            <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'play-outline'" slot="start"></ion-icon>
            {{ isNavigating ? 'Loading...' : 'Continue Trip' }}
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Trips List -->
      <div *ngIf="filteredTrips.length > 0 && !isLoading">
        <ion-item-divider *ngIf="groupedTrips.length > 0">
          <ion-icon name="calendar-outline" slot="start"></ion-icon>
          <ion-label>Trip History</ion-label>
          <ion-badge slot="end" color="primary">{{ filteredTrips.length }}</ion-badge>
        </ion-item-divider>

        <ion-card *ngFor="let trip of filteredTrips" class="ion-margin" [button]="true" (click)="viewTripDetails(trip.id)" [disabled]="isNavigating">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="calendar-outline"></ion-icon>
              {{ trip.startDate | date:'MMM d, yyyy' }}
              <ion-badge 
                slot="end" 
                [color]="getTripStatusColor(trip.status)"
                class="ion-float-right">
                {{ trip.status | titlecase }}
              </ion-badge>
            </ion-card-title>
            <ion-card-subtitle>
              {{ getTripDuration(trip) }} • {{ trip.events.length }} events
            </ion-card-subtitle>
          </ion-card-header>
          
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-icon name="location-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Distance</h3>
                  <p>{{ getTripDistance(trip) }} miles</p>
                </ion-label>
                <ion-note slot="end">{{ getTripDistance(trip) }} mi</ion-note>
              </ion-item>
              
              <ion-item>
                <ion-icon name="speedometer-outline" slot="start" color="warning"></ion-icon>
                <ion-label>
                  <h3>Fuel Used</h3>
                  <p>{{ getTripFuelUsed(trip) | number:'1.1-1' }} gallons</p>
                </ion-label>
                <ion-note slot="end">{{ getTripFuelUsed(trip) | number:'1.1-1' }} gal</ion-note>
              </ion-item>
              
              <ion-item>
                <ion-icon name="trending-up-outline" slot="start" [color]="getMPGColor(getTripMPG(trip))"></ion-icon>
                <ion-label>
                  <h3>Fuel Efficiency</h3>
                  <p>{{ getTripMPG(trip) | number:'1.1-1' }} MPG</p>
                </ion-label>
                <ion-badge slot="end" [color]="getMPGColor(getTripMPG(trip))">
                  {{ getTripMPG(trip) | number:'1.1-1' }} MPG
                </ion-badge>
              </ion-item>
            </ion-list>

            <!-- Trip Notes Preview -->
            <ion-item *ngIf="trip.notes" lines="none" class="ion-margin-top">
              <ion-icon name="document-text-outline" slot="start" color="medium"></ion-icon>
              <ion-label class="ion-text-wrap">
                <p><em>"{{ trip.notes.length > 100 ? trip.notes.substring(0, 100) + '...' : trip.notes }}"</em></p>
              </ion-label>
            </ion-item>

            <!-- Quick Actions -->
            <div class="ion-margin-top">
              <ion-button 
                fill="outline" 
                size="small" 
                color="primary"
                [disabled]="isNavigating"
                (click)="viewTripDetails(trip.id); $event.stopPropagation()">
                <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'eye-outline'" slot="start"></ion-icon>
                {{ isNavigating ? 'Loading...' : 'View Details' }}
              </ion-button>
              
              <ion-button 
                fill="outline" 
                size="small" 
                color="medium"
                [disabled]="isDeleting"
                (click)="showTripActions(trip); $event.stopPropagation()"
                class="ion-margin-start">
                <ion-icon [name]="isDeleting ? 'hourglass-outline' : 'ellipsis-horizontal-outline'" slot="start"></ion-icon>
                Actions
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- No Trips Message -->
      <ion-card *ngIf="filteredTrips.length === 0 && !isLoading" class="ion-margin">
        <ion-card-content>
          <ion-item lines="none">
            <ion-icon name="boat-outline" slot="start" color="medium" size="large"></ion-icon>
            <ion-label class="ion-text-center">
              <h2>No Trips Found</h2>
              <p *ngIf="searchTerm">No trips match your search criteria.</p>
              <p *ngIf="!searchTerm">Start your first trip to see it logged here.</p>
            </ion-label>
          </ion-item>
          
          <ion-button 
            expand="block" 
            color="primary"
            [disabled]="isNavigating"
            routerLink="/trip-start"
            class="ion-margin-top">
            <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'add-outline'" slot="start"></ion-icon>
            {{ isNavigating ? 'Loading...' : 'Start New Trip' }}
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Floating Action Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="success" routerLink="/trip-start" [disabled]="isNavigating">
          <ion-icon [name]="isNavigating ? 'hourglass-outline' : 'add-outline'"></ion-icon>
        </ion-fab-button>
      </ion-fab>

    </ion-content>
  `
})
export class TripLogComponent implements OnInit {
  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  groupedTrips: any[] = [];
  activeTrip: Trip | null = null;
  searchTerm = '';
  sortBy = 'date-desc';
  
  // Loading states
  isLoading = false;
  isNavigating = false;
  isDeleting = false;
  
  tripStats = {
    totalTrips: 0,
    totalDistance: 0,
    totalFuelUsed: 0,
    averageMPG: 0
  };

  constructor(
    private router: Router,
    private tripService: TripManagementService,
    private boatService: BoatManagementService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController
  ) {}

  async ngOnInit() {
    await this.loadTrips();
  }

  async ionViewWillEnter() {
    // Refresh data when returning to this page
    await this.loadTrips();
  }

  async loadTrips() {
    this.isLoading = true;
    try {
      this.trips = await this.tripService.getTrips();
      this.activeTrip = await this.tripService.getActiveTrip();
      
      // Calculate statistics
      this.calculateTripStats();
      
      // Apply current filters and sorting
      this.filterTrips();
      this.sortTrips();
    } catch (error) {
      console.error('Error loading trips:', error);
      await this.showErrorToast('Failed to load trip history');
    } finally {
      this.isLoading = false;
    }
  }

  calculateTripStats() {
    const completedTrips = this.trips.filter(trip => trip.status === 'completed');
    
    this.tripStats = {
      totalTrips: completedTrips.length,
      totalDistance: completedTrips.reduce((sum, trip) => sum + this.getTripDistance(trip), 0),
      totalFuelUsed: completedTrips.reduce((sum, trip) => sum + this.getTripFuelUsed(trip), 0),
      averageMPG: 0
    };
    
    // Calculate average MPG
    if (this.tripStats.totalDistance > 0 && this.tripStats.totalFuelUsed > 0) {
      this.tripStats.averageMPG = this.tripStats.totalDistance / this.tripStats.totalFuelUsed;
    }
  }

  filterTrips() {
    if (!this.searchTerm.trim()) {
      this.filteredTrips = [...this.trips.filter(trip => trip.status === 'completed')];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredTrips = this.trips.filter(trip => 
        trip.status === 'completed' && (
          trip.notes?.toLowerCase().includes(term) ||
          trip.startDate.toDateString().toLowerCase().includes(term) ||
          trip.startDate.toLocaleDateString().toLowerCase().includes(term)
        )
      );
    }
  }

  sortTrips() {
    this.filteredTrips.sort((a, b) => {
      switch (this.sortBy) {
        case 'date-desc':
          return b.startDate.getTime() - a.startDate.getTime();
        case 'date-asc':
          return a.startDate.getTime() - b.startDate.getTime();
        case 'distance-desc':
          return this.getTripDistance(b) - this.getTripDistance(a);
        case 'distance-asc':
          return this.getTripDistance(a) - this.getTripDistance(b);
        case 'mpg-desc':
          return this.getTripMPG(b) - this.getTripMPG(a);
        case 'mpg-asc':
          return this.getTripMPG(a) - this.getTripMPG(b);
        default:
          return 0;
      }
    });
  }

  getTripDistance(trip: Trip): number {
    if (trip.events.length < 2) return 0;
    const firstEvent = trip.events[0];
    const lastEvent = trip.events[trip.events.length - 1];
    return lastEvent.odometer - firstEvent.odometer;
  }

  getTripFuelUsed(trip: Trip): number {
    if (trip.events.length < 2) return 0;
    const firstEvent = trip.events[0];
    const lastEvent = trip.events[trip.events.length - 1];
    
    const startTotal = Object.values(firstEvent.fuelLevels).reduce((sum, level) => sum + level, 0);
    const endTotal = Object.values(lastEvent.fuelLevels).reduce((sum, level) => sum + level, 0);
    
    return startTotal - endTotal;
  }

  getTripMPG(trip: Trip): number {
    const distance = this.getTripDistance(trip);
    const fuelUsed = this.getTripFuelUsed(trip);
    return distance > 0 && fuelUsed > 0 ? distance / fuelUsed : 0;
  }

  getTripDuration(trip: Trip): string {
    const start = trip.startDate;
    const end = trip.endDate || new Date();
    const duration = end.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  getTripStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getMPGColor(mpg: number): string {
    if (mpg > 3) return 'success';
    if (mpg > 2) return 'warning';
    return 'danger';
  }

  async viewTripDetails(tripId: string) {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.router.navigate(['/trip-details', tripId]);
    } catch (error) {
      console.error('Error navigating to trip details:', error);
      await this.showErrorToast('Failed to open trip details');
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }
  }

  async showFilterOptions() {
    if (this.isLoading) return;
    
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filter & Sort Options',
      buttons: [
        {
          text: 'Clear Search',
          icon: 'close-outline',
          handler: () => {
            this.searchTerm = '';
            this.filterTrips();
          }
        },
        {
          text: 'Export Trip Data',
          icon: 'download-outline',
          handler: () => this.exportTripData()
        },
        {
          text: 'Trip Statistics',
          icon: 'analytics-outline',
          handler: () => this.showTripStatistics()
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

  async showTripActions(trip: Trip) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Trip Actions - ${trip.startDate.toLocaleDateString()}`,
      buttons: [
        {
          text: 'View Details',
          icon: 'eye-outline',
          handler: () => this.viewTripDetails(trip.id)
        },
        {
          text: 'Duplicate Trip',
          icon: 'copy-outline',
          handler: () => this.duplicateTrip(trip)
        },
        {
          text: 'Delete Trip',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.deleteTrip(trip)
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

  async duplicateTrip(trip: Trip) {
    // Implementation for duplicating a trip (copy settings for new trip)
    await this.showInfoToast('Trip duplication feature coming soon!');
  }

  async deleteTrip(trip: Trip) {
    if (this.isDeleting) return;
    
    const alert = await this.alertCtrl.create({
      header: 'Delete Trip',
      message: `Are you sure you want to delete the trip from ${trip.startDate.toLocaleDateString()}? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            this.isDeleting = true;
            try {
              await this.tripService.deleteTrip(trip.id);
              
              // Auto-refresh the list
              await this.loadTrips();
              
              await this.showSuccessToast('Trip deleted successfully');
            } catch (error) {
              console.error('Error deleting trip:', error);
              await this.showErrorToast('Error deleting trip. Please try again.');
            } finally {
              this.isDeleting = false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async exportTripData() {
    // Implementation for exporting trip data
    await this.showInfoToast('Export feature coming soon!');
  }

  async showTripStatistics() {
    const alert = await this.alertCtrl.create({
      header: 'Trip Statistics',
      message: `
        <strong>Total Trips:</strong> ${this.tripStats.totalTrips}<br>
        <strong>Total Distance:</strong> ${this.tripStats.totalDistance} miles<br>
        <strong>Total Fuel Used:</strong> ${this.tripStats.totalFuelUsed.toFixed(1)} gallons<br>
        <strong>Average MPG:</strong> ${this.tripStats.averageMPG.toFixed(1)}<br>
      `,
      buttons: ['Close']
    });

    await alert.present();
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
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

  private async showInfoToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      color: 'medium',
      position: 'bottom'
    });
    await toast.present();
  }
}