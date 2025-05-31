import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonProgressBar, IonList, IonNote, IonBadge, IonItemDivider
} from '@ionic/angular/standalone';

import { BoatConfig, TankConfig } from './boat.model';
import { BoatManagementService } from './boat-management.service';

@Component({
  selector: 'app-boat-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonProgressBar, IonList, IonNote,  IonBadge, IonItemDivider],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          Boat Configuration
        </ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/dashboard" fill="clear">
            <ion-icon name="home-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      
      <!-- Active Boat Display -->
      <ion-card *ngIf="activeBoat">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="boat-outline"></ion-icon>
            {{ activeBoat.name }}
          </ion-card-title>
          <ion-card-subtitle>Current Fuel Status</ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <!-- Total Fuel Summary -->
          <ion-item lines="full">
            <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>{{ totalFuel | number:'1.1-1' }} gallons</h2>
              <p>{{ totalCapacity | number:'1.0-0' }} total capacity • {{ ((totalFuel/totalCapacity)*100) | number:'1.0-0' }}% full</p>
            </ion-label>
            <ion-badge slot="end" [color]="getProgressColor(totalFuel / totalCapacity)">
              {{ ((totalFuel/totalCapacity)*100) | number:'1.0-0' }}%
            </ion-badge>
          </ion-item>
          
          <ion-progress-bar 
            [value]="totalFuel / totalCapacity"
            [color]="getProgressColor(totalFuel / totalCapacity)">
          </ion-progress-bar>

          <!-- Individual Tanks -->
          <ion-list lines="inset" class="ion-margin-top">
            <ion-item-divider>
              <ion-label>Tank Details</ion-label>
            </ion-item-divider>
            
            <ion-item *ngFor="let tank of activeBoat.tanks" button>
              <ion-icon 
                name="water-outline" 
                slot="start" 
                [color]="getProgressColor(tank.currentLevel / tank.capacity)">
              </ion-icon>
              <ion-label>
                <h3>{{ tank.name }}</h3>
                <p>{{ tank.currentLevel | number:'1.1-1' }} / {{ tank.capacity }} gallons</p>
                <p>{{ formatTankType(tank.type) }} Tank • {{ ((tank.currentLevel/tank.capacity)*100) | number:'1.0-0' }}% full</p>
              </ion-label>
              
              <ion-note slot="end">
                <ion-progress-bar 
                  [value]="tank.currentLevel / tank.capacity"
                  [color]="getProgressColor(tank.currentLevel / tank.capacity)">
                </ion-progress-bar>
              </ion-note>
              
              <ion-button 
                slot="end"
                fill="outline" 
                size="small" 
                color="primary"
                [disabled]="updatingTanks[tank.id]"
                (click)="updateTankLevel(tank)">
                <ion-icon [name]="updatingTanks[tank.id] ? 'hourglass-outline' : 'create-outline'" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- No Boat Setup Message -->
      <ion-card *ngIf="!activeBoat && !isLoading" color="light">
        <ion-card-header>
          <ion-card-title color="dark">
            <ion-icon name="boat-outline"></ion-icon>
            Welcome to Fuel Tracker
          </ion-card-title>
          <ion-card-subtitle color="dark">Setup your boat configuration</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item color="light" lines="none">
            <ion-icon name="information-circle-outline" slot="start" color="primary"></ion-icon>
            <ion-label color="dark" class="ion-text-wrap">
              <p>Configure your boat and fuel tanks to begin tracking your trips on the water.</p>
            </ion-label>
          </ion-item>
          
          <ion-button 
            expand="block" 
            color="primary" 
            (click)="showAddBoatForm = true"
            class="ion-margin-top">
            <ion-icon name="add-circle-outline" slot="start"></ion-icon>
            Add Your Boat
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Add Boat Form -->
      <ion-card *ngIf="showAddBoatForm">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="boat-outline"></ion-icon>
            Add New Boat
          </ion-card-title>
          <ion-card-subtitle>Enter your boat information</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-icon name="text-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Boat Name</ion-label>
            <ion-input 
              [(ngModel)]="newBoat.name" 
              placeholder="e.g., Sea Hawk, Fishing Dreams">
            </ion-input>
          </ion-item>
          
          <div class="ion-margin-top">
            <ion-button 
              expand="block" 
              color="success"
              (click)="addBoat()" 
              [disabled]="!newBoat.name || isAddingBoat">
              <ion-icon [name]="isAddingBoat ? 'hourglass-outline' : 'checkmark-circle-outline'" slot="start"></ion-icon>
              {{ isAddingBoat ? 'Creating...' : 'Create Boat' }}
            </ion-button>
            
            <ion-button 
              expand="block" 
              fill="outline" 
              color="medium"
              [disabled]="isAddingBoat"
              (click)="cancelAddBoat()">
              <ion-icon name="close-circle-outline" slot="start"></ion-icon>
              Cancel
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Tank Management -->
      <ion-card *ngIf="activeBoat && !showAddTankForm">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="layers-outline"></ion-icon>
            Tank Management
          </ion-card-title>
          <ion-card-subtitle>Configure your fuel tanks</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="none">
            <ion-icon name="information-circle-outline" slot="start" color="primary"></ion-icon>
            <ion-label class="ion-text-wrap">
              <p>Add all your boat's fuel tanks to accurately track fuel usage across your trips.</p>
            </ion-label>
          </ion-item>
          
          <ion-button 
            expand="block" 
            color="success" 
            (click)="showAddTankForm = true"
            class="ion-margin-top">
            <ion-icon name="add-circle-outline" slot="start"></ion-icon>
            Add New Tank
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Add Tank Form -->
      <ion-card *ngIf="showAddTankForm">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="water-outline"></ion-icon>
            Add Fuel Tank
          </ion-card-title>
          <ion-card-subtitle>Configure tank specifications</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon name="text-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">Tank Name</ion-label>
              <ion-input 
                [(ngModel)]="newTank.name" 
                placeholder="e.g., Center Tank, Port Saddle">
              </ion-input>
            </ion-item>
            
            <ion-item>
              <ion-icon name="list-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">Tank Type</ion-label>
              <ion-select [(ngModel)]="newTank.type" interface="popover">
                <ion-select-option value="center">
                  Center Tank
                </ion-select-option>
                <ion-select-option value="port_saddle">
                  Port Saddle
                </ion-select-option>
                <ion-select-option value="stbd_saddle">
                  Starboard Saddle
                </ion-select-option>
                <ion-select-option value="aux">
                  Auxiliary Tank
                </ion-select-option>
                <ion-select-option value="other">
                  Other
                </ion-select-option>
              </ion-select>
            </ion-item>
            
            <ion-item>
              <ion-icon name="resize-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">Capacity (gallons)</ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="newTank.capacity" 
                placeholder="e.g., 100, 45">
              </ion-input>
            </ion-item>
            
            <ion-item>
              <ion-icon name="water-outline" slot="start" color="primary"></ion-icon>
              <ion-label position="stacked">Current Level (gallons)</ion-label>
              <ion-input 
                type="number" 
                [(ngModel)]="newTank.currentLevel" 
                placeholder="e.g., 85, 40">
              </ion-input>
            </ion-item>
          </ion-list>
          
          <div class="ion-margin-top">
            <ion-button 
              expand="block" 
              color="success"
              (click)="addTank()" 
              [disabled]="!canAddTank() || isAddingTank">
              <ion-icon [name]="isAddingTank ? 'hourglass-outline' : 'checkmark-circle-outline'" slot="start"></ion-icon>
              {{ isAddingTank ? 'Adding...' : 'Add Tank' }}
            </ion-button>
            
            <ion-button 
              expand="block" 
              fill="outline" 
              color="medium"
              [disabled]="isAddingTank"
              (click)="cancelAddTank()">
              <ion-icon name="close-circle-outline" slot="start"></ion-icon>
              Cancel
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Quick Actions -->
      <ion-card *ngIf="activeBoat && !showAddBoatForm && !showAddTankForm">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="flash-outline"></ion-icon>
            Quick Actions
          </ion-card-title>
          <ion-card-subtitle>Navigate to other features</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item button routerLink="/trip-start">
              <ion-icon name="play-outline" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Start New Trip</h3>
                <p>Begin tracking fuel usage</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
            
            <ion-item button routerLink="/dashboard">
              <ion-icon name="home-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>View Dashboard</h3>
                <p>See fuel status & recent trips</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
            
            <ion-item button routerLink="/log">
              <ion-icon name="list-outline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Trip History</h3>
                <p>View all your logged trips</p>
              </ion-label>
              <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class BoatSetupComponent implements OnInit {
  activeBoat: BoatConfig | null = null;
  totalFuel = 0;
  totalCapacity = 0;
  
  // Loading states
  isLoading = false;
  isAddingBoat = false;
  isAddingTank = false;
  updatingTanks: { [tankId: string]: boolean } = {};
  
  showAddBoatForm = false;
  showAddTankForm = false;
  
  newBoat = { name: '' };
  newTank = {
    name: '',
    type: 'center' as any,
    capacity: 0,
    currentLevel: 0
  };

  constructor(
    private boatService: BoatManagementService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadBoatInfo();
  }

  async ionViewWillEnter() {
    // Refresh data when returning to this page
    await this.loadBoatInfo();
  }

  async ionViewDidEnter() {
    // Also refresh when view has fully entered
    await this.loadBoatInfo();
  }

  async loadBoatInfo() {
    this.isLoading = true;
    try {
      this.activeBoat = await this.boatService.getActiveBoat();
      
      if (this.activeBoat) {
        this.totalFuel = await this.boatService.getTotalFuel(this.activeBoat.id);
        this.totalCapacity = await this.boatService.getTotalCapacity(this.activeBoat.id);
      }
    } catch (error) {
      console.error('Error loading boat info:', error);
      await this.showErrorToast('Failed to load boat information');
    } finally {
      this.isLoading = false;
    }
  }

  async addBoat() {
    if (this.isAddingBoat || !this.newBoat.name.trim()) return;
    
    this.isAddingBoat = true;
    try {
      await this.boatService.addBoat({
        name: this.newBoat.name.trim(),
        tanks: [],
        isActive: true
      });
      
      // Force refresh data after adding boat
      await this.loadBoatInfo();
      
      // Close form and reset
      this.cancelAddBoat();
      
      await this.showSuccessToast('Boat added successfully!');
      
    } catch (error) {
      console.error('Error adding boat:', error);
      await this.showErrorToast('Failed to add boat. Please try again.');
    } finally {
      this.isAddingBoat = false;
    }
  }

  cancelAddBoat() {
    this.showAddBoatForm = false;
    this.newBoat = { name: '' };
  }

  async addTank() {
    if (!this.activeBoat || this.isAddingTank || !this.canAddTank()) return;
    
    this.isAddingTank = true;
    try {
      await this.boatService.addTank(this.activeBoat.id, {
        name: this.newTank.name.trim(),
        type: this.newTank.type,
        capacity: this.newTank.capacity,
        currentLevel: this.newTank.currentLevel
      });
      
      // Force refresh data after adding tank
      await this.loadBoatInfo();
      
      // Close form and reset
      this.cancelAddTank();
      
      await this.showSuccessToast('Tank added successfully!');
      
    } catch (error) {
      console.error('Error adding tank:', error);
      await this.showErrorToast('Failed to add tank. Please try again.');
    } finally {
      this.isAddingTank = false;
    }
  }

  cancelAddTank() {
    this.showAddTankForm = false;
    this.newTank = {
      name: '',
      type: 'center',
      capacity: 0,
      currentLevel: 0
    };
  }

  canAddTank(): boolean {
    return !!(this.newTank.name.trim() && 
              this.newTank.type && 
              this.newTank.capacity > 0 && 
              this.newTank.currentLevel >= 0 &&
              this.newTank.currentLevel <= this.newTank.capacity);
  }

  async updateTankLevel(tank: TankConfig) {
    if (this.updatingTanks[tank.id]) return;
    
    const alert = await this.alertCtrl.create({
      header: `Update ${tank.name}`,
      message: 'Enter the current fuel level',
      inputs: [
        {
          name: 'level',
          type: 'number',
          placeholder: 'Fuel level',
          value: tank.currentLevel,
          min: 0,
          max: tank.capacity
        }
      ],
      buttons: [
        { 
          text: 'Cancel', 
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: (data) => {
            const newLevel = parseFloat(data.level);
            // ✅ blur active element to avoid aria-hidden warning
            // (document.activeElement as HTMLElement)?.blur();
        
            if (newLevel >= 0 && newLevel <= tank.capacity) {
              this.performTankUpdate(tank, newLevel);
              return true; // closes modal
            } else {
              this.showErrorToast('Invalid fuel level entered');
              return false; // keeps modal open
            }
          }
        }
        
      ]
    });
    
    await alert.present();
  }

  private async performTankUpdate(tank: TankConfig, newLevel: number) {
    this.updatingTanks[tank.id] = true;
    try {
      await this.boatService.updateTankLevel(this.activeBoat!.id, tank.id, newLevel);
      
      // Force refresh data after updating tank
      await this.loadBoatInfo();
      
      await this.showSuccessToast('Tank level updated successfully!');
    } catch (error) {
      console.error('Error updating tank level:', error);
      await this.showErrorToast('Failed to update tank level');
    } finally {
      this.updatingTanks[tank.id] = false;
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

  getProgressColor(percentage: number): string {
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
}