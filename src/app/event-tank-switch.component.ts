import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonNote,
    IonCheckbox, IonChip, IonButton, IonList, IonIcon
  } from '@ionic/angular/standalone';
import { BoatConfig, Trip } from './boat.model';
import { BoatManagementService } from './boat-management.service';
import { TripManagementService } from './trip-management.service';

@Component({
  selector: 'app-event-tank-switch',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonNote, IonCheckbox, IonChip, IonButton, IonList, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/trip-active/' + tripId"></ion-back-button>
        </ion-buttons>
        <ion-title>
          Tank Switch
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Loading State -->
      <ion-card *ngIf="isLoading" class="ion-margin">
        <ion-card-content>
          <ion-item lines="none">
            <ion-icon name="hourglass-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Loading Trip Data...</h3>
              <p>Please wait while we load your trip information</p>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Current Status -->
      <ion-card *ngIf="activeBoat && trip && !isLoading">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="information-circle-outline"></ion-icon>
            Current Status
          </ion-card-title>
          <ion-card-subtitle>Current trip readings and active tanks</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Current Odometer</h3>
                <p>{{ getLastOdometer() }} miles</p>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-icon name="calculator-outline" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Current Total Fuel</h3>
                <p>{{ getLastGarminTotal() | number:'1.1-1' }} gallons</p>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-icon name="checkmark-circle-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Currently Active Tanks:</h3>
                <div class="ion-margin-top">
                  <ion-chip *ngFor="let tankId of getCurrentActiveTanks()" color="success">
                    <ion-icon name="water-outline"></ion-icon>
                    <ion-label>{{ getTankName(tankId) }}</ion-label>
                  </ion-chip>
                  <ion-chip *ngIf="getCurrentActiveTanks().length === 0" color="medium">
                    <ion-label>No active tanks</ion-label>
                  </ion-chip>
                </div>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Tank Switch Form -->
      <ion-card *ngIf="!isLoading">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="create-outline"></ion-icon>
            Log Tank Switch
          </ion-card-title>
          <ion-card-subtitle>Record fuel system change</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          
          <ion-list>
            <ion-item>
              <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">Current Odometer</ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="currentOdometer"
                [placeholder]="getLastOdometer().toString()">
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-icon name="calculator-outline" slot="start" color="success"></ion-icon>
              <ion-label position="stacked">Garmin Total Fuel</ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="garminTotalFuel"
                [placeholder]="getLastGarminTotal().toString()">
              </ion-input>
              <ion-note slot="helper">Enter total fuel reading from your Garmin</ion-note>
            </ion-item>
          </ion-list>

          <!-- Tank Selection -->
          <ion-list class="ion-margin-top">
            <ion-item lines="none">
              <ion-icon name="layers-outline" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Switch to These Tanks:</h3>
                <p>Select the tanks you want to activate</p>
              </ion-label>
            </ion-item>
            
            <ion-item *ngFor="let tank of activeBoat?.tanks">
              <ion-checkbox 
                slot="start" 
                [(ngModel)]="newActiveTanks[tank.id]"
                color="primary">
              </ion-checkbox>
              <ion-icon 
                name="water-outline" 
                slot="start" 
                color="primary"
                class="ion-margin-start">
              </ion-icon>
              <ion-label>
                <h3>{{ tank.name }}</h3>
                <p>{{ getTankType(tank.type) }} • Estimated: {{ getLastFuelLevel(tank.id) | number:'1.1-1' }} gal</p>
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-item class="ion-margin-top">
            <ion-icon name="document-text-outline" slot="start" color="tertiary"></ion-icon>
            <ion-label position="stacked">Reason for Switch (optional)</ion-label>
            <ion-textarea 
              [(ngModel)]="switchReason"
              placeholder="e.g., 'Switched to saddles for trolling', 'Center tank empty'"
              rows="2">
            </ion-textarea>
          </ion-item>

        </ion-card-content>
      </ion-card>

      <!-- Selected Tanks Preview -->
      <ion-card *ngIf="getSelectedTanks().length > 0 && !isLoading" color="light">
        <ion-card-header>
          <ion-card-title color="dark">
            <ion-icon name="checkmark-done-outline"></ion-icon>
            New Configuration
          </ion-card-title>
          <ion-card-subtitle color="dark">Tanks that will be activated</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="light" lines="none">
            <ion-icon name="layers-outline" slot="start" color="primary"></ion-icon>
            <ion-label color="dark">
              <h3>{{ getSelectedTanks().length }} Tank{{ getSelectedTanks().length !== 1 ? 's' : '' }} Selected</h3>
              <div class="ion-margin-top">
                <ion-chip *ngFor="let tankId of getSelectedTanks()" color="primary">
                  <ion-icon name="water-outline"></ion-icon>
                  <ion-label>{{ getTankName(tankId) }}</ion-label>
                </ion-chip>
              </div>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Action Buttons -->
      <ion-card *ngIf="!isLoading">
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="success"
            (click)="logTankSwitch()"
            [disabled]="!canLogSwitch() || isLogging">
            <ion-icon [name]="isLogging ? 'hourglass-outline' : 'checkmark-circle-outline'" slot="start"></ion-icon>
            {{ isLogging ? 'Logging...' : 'Log Tank Switch' }}
          </ion-button>
          
          <ion-item *ngIf="!canLogSwitch()" color="warning" lines="none" class="ion-margin-top">
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
export class EventTankSwitchComponent implements OnInit {
  trip: Trip | null = null;
  activeBoat: BoatConfig | null = null;
  tripId!: string;
  
  // Loading states
  isLoading = false;
  isLogging = false;
  
  currentOdometer = 0;
  garminTotalFuel = 0;
  newActiveTanks: { [tankId: string]: boolean } = {};
  switchReason = '';

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
    this.isLoading = true;
    try {
      const trips = await this.tripService.getTrips();
      this.trip = trips.find(t => t.id === this.tripId) || null;
      
      if (this.trip) {
        this.activeBoat = await this.boatService.getActiveBoat();
        this.currentOdometer = this.getLastOdometer();
        this.garminTotalFuel = this.getLastGarminTotal();
        
        // Initialize tank selection
        if (this.activeBoat) {
          this.activeBoat.tanks.forEach(tank => {
            this.newActiveTanks[tank.id] = false;
          });
        }
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
      await this.showErrorToast('Failed to load trip data');
    } finally {
      this.isLoading = false;
    }
  }

  getLastOdometer(): number {
    if (!this.trip || this.trip.events.length === 0) return 0;
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return lastEvent.odometer;
  }

  getLastGarminTotal(): number {
    if (!this.trip || this.trip.events.length === 0) return 0;
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return Object.values(lastEvent.fuelLevels).reduce((sum, level) => sum + level, 0);
  }

  getLastFuelLevel(tankId: string): number {
    if (!this.trip || this.trip.events.length === 0) return 0;
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return lastEvent.fuelLevels[tankId] || 0;
  }

  getCurrentActiveTanks(): string[] {
    if (!this.trip || this.trip.events.length === 0) return [];
    const lastEvent = this.trip.events[this.trip.events.length - 1];
    return lastEvent.activeTanks || [];
  }

  getTankName(tankId: string): string {
    if (!this.activeBoat) return '';
    const tank = this.activeBoat.tanks.find(t => t.id === tankId);
    return tank ? tank.name : '';
  }

  getTankType(type: string): string {
    switch (type) {
      case 'center': return 'Center Tank';
      case 'port_saddle': return 'Port Saddle';
      case 'stbd_saddle': return 'Starboard Saddle';
      case 'aux': return 'Auxiliary Tank';
      default: return type;
    }
  }

  getSelectedTanks(): string[] {
    return Object.keys(this.newActiveTanks).filter(tankId => this.newActiveTanks[tankId]);
  }

  canLogSwitch(): boolean {
    if (!this.trip || !this.activeBoat) return false;
    
    // Must have valid odometer
    if (this.currentOdometer <= this.getLastOdometer()) return false;
    
    // Must select at least one tank
    if (this.getSelectedTanks().length === 0) return false;
    
    // Must have valid Garmin total
    if (this.garminTotalFuel <= 0) return false;
    
    return true;
  }

  getValidationMessage(): string {
    if (!this.trip || !this.activeBoat) return 'Loading trip data...';
    
    if (this.currentOdometer <= this.getLastOdometer()) {
      return 'Odometer must be greater than last reading';
    }
    
    if (this.getSelectedTanks().length === 0) {
      return 'Select at least one tank to switch to';
    }
    
    if (this.garminTotalFuel <= 0) {
      return 'Enter current Garmin total fuel reading';
    }
    
    return '';
  }

  async logTankSwitch() {
    if (!this.canLogSwitch() || this.isLogging) return;
  
    this.isLogging = true;
    try {
      await this.tripService.addTripEventWithGarmin(this.tripId, {
        timestamp: new Date(),
        type: 'tank_switch',
        odometer: this.currentOdometer,
        garminTotalFuel: this.garminTotalFuel,
        activeTanks: this.getSelectedTanks(),
        activity: this.switchReason || undefined
      });
  
      await this.showSuccessToast('Tank switch logged successfully!');
  
      // Reset loading state before navigation
      this.isLogging = false;
  
      // Navigate back to active trip using replaceUrl to prevent back button issues
      this.router.navigate(['/trip-active', this.tripId], { replaceUrl: true });
  
    } catch (error) {
      console.error('Error logging tank switch:', error);
      await this.showErrorToast('Error logging event. Please try again.');
      
      // Reset loading state on error
      this.isLogging = false;
    }
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
}