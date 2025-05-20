import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'tripLog';

@Injectable({ providedIn: 'root' })
export class TripStorageService {
  async getTrips(): Promise<any[]> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async saveTrips(trips: any[]): Promise<void> {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(trips) });
  }

  async addTrip(trip: any): Promise<void> {
    const trips = await this.getTrips();
    trips.push(trip);
    await this.saveTrips(trips);
  }

  async updateTrip(index: number, updatedTrip: any): Promise<void> {
    const trips = await this.getTrips();
    trips[index] = updatedTrip;
    await this.saveTrips(trips);
  }

  async deleteTrip(index: number): Promise<void> {
    const trips = await this.getTrips();
    trips.splice(index, 1);
    await this.saveTrips(trips);
  }
}
