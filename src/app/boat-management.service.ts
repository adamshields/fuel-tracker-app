import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BoatConfig, TankConfig } from './boat.model';

const BOATS_STORAGE_KEY = 'boats';

@Injectable({ providedIn: 'root' })
export class BoatManagementService {
  
  async getBoats(): Promise<BoatConfig[]> {
    const { value } = await Preferences.get({ key: BOATS_STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async saveBoats(boats: BoatConfig[]): Promise<void> {
    await Preferences.set({ key: BOATS_STORAGE_KEY, value: JSON.stringify(boats) });
  }

  async getActiveBoat(): Promise<BoatConfig | null> {
    const boats = await this.getBoats();
    return boats.find(boat => boat.isActive) || null;
  }

  async addBoat(boat: Omit<BoatConfig, 'id'>): Promise<BoatConfig> {
    const boats = await this.getBoats();
    
    // If this is the first boat, make it active
    const isFirstBoat = boats.length === 0;
    
    const newBoat: BoatConfig = {
      ...boat,
      id: this.generateId(),
      isActive: isFirstBoat || boat.isActive
    };

    // If making this boat active, deactivate others
    if (newBoat.isActive) {
      boats.forEach(b => b.isActive = false);
    }

    boats.push(newBoat);
    await this.saveBoats(boats);
    return newBoat;
  }

  async updateBoat(boatId: string, updates: Partial<BoatConfig>): Promise<void> {
    const boats = await this.getBoats();
    const boatIndex = boats.findIndex(b => b.id === boatId);
    
    if (boatIndex === -1) {
      throw new Error('Boat not found');
    }

    // If making this boat active, deactivate others
    if (updates.isActive) {
      boats.forEach(b => b.isActive = false);
    }

    boats[boatIndex] = { ...boats[boatIndex], ...updates };
    await this.saveBoats(boats);
  }

  async updateTankLevel(boatId: string, tankId: string, newLevel: number): Promise<void> {
    const boats = await this.getBoats();
    const boat = boats.find(b => b.id === boatId);
    
    if (!boat) {
      throw new Error('Boat not found');
    }

    const tank = boat.tanks.find(t => t.id === tankId);
    if (!tank) {
      throw new Error('Tank not found');
    }

    if (newLevel < 0 || newLevel > tank.capacity) {
      throw new Error('Invalid fuel level');
    }

    tank.currentLevel = newLevel;
    await this.saveBoats(boats);
  }

  async addTank(boatId: string, tank: Omit<TankConfig, 'id'>): Promise<void> {
    const boats = await this.getBoats();
    const boat = boats.find(b => b.id === boatId);
    
    if (!boat) {
      throw new Error('Boat not found');
    }

    const newTank: TankConfig = {
      ...tank,
      id: this.generateId()
    };

    boat.tanks.push(newTank);
    await this.saveBoats(boats);
  }

  async removeTank(boatId: string, tankId: string): Promise<void> {
    const boats = await this.getBoats();
    const boat = boats.find(b => b.id === boatId);
    
    if (!boat) {
      throw new Error('Boat not found');
    }

    boat.tanks = boat.tanks.filter(t => t.id !== tankId);
    await this.saveBoats(boats);
  }

  async getTotalFuel(boatId: string): Promise<number> {
    const boats = await this.getBoats();
    const boat = boats.find(b => b.id === boatId);
    
    if (!boat) {
      return 0;
    }

    return boat.tanks.reduce((total, tank) => total + tank.currentLevel, 0);
  }

  async getTotalCapacity(boatId: string): Promise<number> {
    const boats = await this.getBoats();
    const boat = boats.find(b => b.id === boatId);
    
    if (!boat) {
      return 0;
    }

    return boat.tanks.reduce((total, tank) => total + tank.capacity, 0);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}