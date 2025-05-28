import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Trip, TripEvent, FuelStats } from './boat.model';
import { BoatManagementService } from './boat-management.service';

const TRIPS_STORAGE_KEY = 'trips_v2';

@Injectable({ providedIn: 'root' })
export class TripManagementService {

  constructor(private boatService: BoatManagementService) {}

  async getTrips(): Promise<Trip[]> {
    const { value } = await Preferences.get({ key: TRIPS_STORAGE_KEY });
    const trips = value ? JSON.parse(value) : [];
    
    // Convert date strings back to Date objects
    return trips.map((trip: any) => ({
      ...trip,
      startDate: new Date(trip.startDate),
      endDate: trip.endDate ? new Date(trip.endDate) : undefined,
      events: trip.events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }))
    }));
  }

  async saveTrips(trips: Trip[]): Promise<void> {
    await Preferences.set({ key: TRIPS_STORAGE_KEY, value: JSON.stringify(trips) });
  }

  async startTrip(boatId: string, initialEvent: Omit<TripEvent, 'id' | 'tripId'>): Promise<Trip> {
    const trips = await this.getTrips();
    
    // Check if there's already an active trip
    const activeTrip = trips.find(trip => trip.status === 'active');
    if (activeTrip) {
      throw new Error('There is already an active trip. Complete it first.');
    }

    const tripId = this.generateId();
    const eventId = this.generateId();

    const trip: Trip = {
      id: tripId,
      boatId,
      startDate: new Date(),
      status: 'active',
      events: [{
        ...initialEvent,
        id: eventId,
        tripId,
        type: 'departure'
      }]
    };

    trips.push(trip);
    await this.saveTrips(trips);
    return trip;
  }

  async addTripEvent(tripId: string, event: Omit<TripEvent, 'id' | 'tripId'>): Promise<void> {
    const trips = await this.getTrips();
    const trip = trips.find(t => t.id === tripId);
    
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status !== 'active') {
      throw new Error('Cannot add events to completed trip');
    }

    const newEvent: TripEvent = {
      ...event,
      id: this.generateId(),
      tripId
    };

    trip.events.push(newEvent);

    // If this is an arrival event, complete the trip
    if (event.type === 'arrival') {
      trip.status = 'completed';
      trip.endDate = new Date();
      
      // Update boat tank levels to match final event
      await this.updateBoatTankLevels(trip.boatId, event.fuelLevels);
    }

    await this.saveTrips(trips);
  }

  async addTripEventWithGarmin(tripId: string, event: {
    timestamp: Date;
    type: 'departure' | 'tank_switch' | 'fuel_stop' | 'activity_change' | 'arrival';
    odometer: number;
    garminTotalFuel: number;
    activeTanks: string[];
    activity?: string;
    notes?: string;
  }): Promise<void> {
    const trips = await this.getTrips();
    const trip = trips.find(t => t.id === tripId);
    
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status !== 'active') {
      throw new Error('Cannot add events to completed trip');
    }

    // Calculate individual tank levels based on fuel burn
    const fuelLevels = await this.calculateIndividualTankLevels(trip, event.garminTotalFuel, event.activeTanks);

    const newEvent: TripEvent = {
      id: this.generateId(),
      tripId,
      timestamp: event.timestamp,
      type: event.type,
      odometer: event.odometer,
      fuelLevels,
      activeTanks: event.activeTanks,
      activity: event.activity,
      notes: event.notes
    };

    trip.events.push(newEvent);

    // If this is an arrival event, complete the trip
    if (event.type === 'arrival') {
      trip.status = 'completed';
      trip.endDate = new Date();
      
      // Update boat tank levels to match final event
      await this.updateBoatTankLevels(trip.boatId, fuelLevels);
    }

    await this.saveTrips(trips);
  }

  private async calculateIndividualTankLevels(
    trip: Trip, 
    currentGarminTotal: number, 
    currentActiveTanks: string[]
  ): Promise<{ [tankId: string]: number }> {
    
    if (trip.events.length === 0) {
      throw new Error('No previous events to calculate from');
    }

    const lastEvent = trip.events[trip.events.length - 1];
    const lastGarminTotal = Object.values(lastEvent.fuelLevels).reduce((sum, level) => sum + level, 0);
    
    // Calculate total fuel burned since last event
    const fuelBurned = lastGarminTotal - currentGarminTotal;
    
    // Start with last known fuel levels
    const newFuelLevels = { ...lastEvent.fuelLevels };
    
    if (fuelBurned > 0) {
      // Determine which tanks were burning fuel (tanks that were active in previous segment)
      const previousActiveTanks = lastEvent.activeTanks || [];
      
      if (previousActiveTanks.length > 0) {
        // Distribute fuel burn across previously active tanks
        const burnPerTank = fuelBurned / previousActiveTanks.length;
        
        previousActiveTanks.forEach(tankId => {
          newFuelLevels[tankId] = Math.max(0, (newFuelLevels[tankId] || 0) - burnPerTank);
        });
      }
    } else if (fuelBurned < 0) {
      // Fuel was added - distribute across currently active tanks
      const fuelAdded = Math.abs(fuelBurned);
      if (currentActiveTanks.length > 0) {
        const addPerTank = fuelAdded / currentActiveTanks.length;
        
        for (const tankId of currentActiveTanks) {
          // Get tank capacity to prevent overfilling
          const boats = await this.boatService.getBoats();
          const boat = boats.find(b => b.id === trip.boatId);
          const tank = boat?.tanks.find(t => t.id === tankId);
          const capacity = tank?.capacity || 1000; // Fallback to large number
          
          newFuelLevels[tankId] = Math.min(capacity, (newFuelLevels[tankId] || 0) + addPerTank);
        }
      }
    }
    
    return newFuelLevels;
  }

  async getActiveTrip(): Promise<Trip | null> {
    const trips = await this.getTrips();
    return trips.find(trip => trip.status === 'active') || null;
  }

  async completeTrip(tripId: string, finalEvent?: Omit<TripEvent, 'id' | 'tripId'>): Promise<void> {
    const trips = await this.getTrips();
    const trip = trips.find(t => t.id === tripId);
    
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (finalEvent) {
      await this.addTripEvent(tripId, { ...finalEvent, type: 'arrival' });
    } else {
      trip.status = 'completed';
      trip.endDate = new Date();
      await this.saveTrips(trips);
    }
  }

  async calculateTripStats(tripId: string): Promise<FuelStats> {
    const trips = await this.getTrips();
    const trip = trips.find(t => t.id === tripId);
    
    if (!trip || trip.events.length < 2) {
      throw new Error('Trip not found or insufficient data');
    }

    const firstEvent = trip.events[0];
    const lastEvent = trip.events[trip.events.length - 1];

    // Calculate total fuel used by tank
    const usageByTank: { [tankId: string]: number } = {};
    let totalUsed = 0;

    Object.keys(firstEvent.fuelLevels).forEach(tankId => {
      const startLevel = firstEvent.fuelLevels[tankId] || 0;
      const endLevel = lastEvent.fuelLevels[tankId] || 0;
      const used = startLevel - endLevel;
      
      if (used > 0) {
        usageByTank[tankId] = used;
        totalUsed += used;
      }
    });

    // Calculate total miles
    const totalMiles = lastEvent.odometer - firstEvent.odometer;

    // Calculate overall MPG
    const overallMPG = totalUsed > 0 ? totalMiles / totalUsed : 0;

    // Calculate segment MPGs
    const segmentMPGs = this.calculateSegmentMPGs(trip.events);

    return {
      totalUsed,
      usageByTank,
      totalMiles,
      overallMPG,
      segmentMPGs
    };
  }

  private calculateSegmentMPGs(events: TripEvent[]): { segment: string; mpg: number }[] {
    const segments = [];
    
    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i - 1];
      const currentEvent = events[i];
      
      const miles = currentEvent.odometer - prevEvent.odometer;
      let fuelUsed = 0;
      
      // Calculate fuel used in this segment across all active tanks
      prevEvent.activeTanks?.forEach(tankId => {
        const prevLevel = prevEvent.fuelLevels[tankId] || 0;
        const currentLevel = currentEvent.fuelLevels[tankId] || 0;
        fuelUsed += (prevLevel - currentLevel);
      });

      if (miles > 0 && fuelUsed > 0) {
        segments.push({
          segment: `${prevEvent.type} to ${currentEvent.type}`,
          mpg: miles / fuelUsed
        });
      }
    }
    
    return segments;
  }

  private async updateBoatTankLevels(boatId: string, fuelLevels: { [tankId: string]: number }): Promise<void> {
    for (const [tankId, level] of Object.entries(fuelLevels)) {
      try {
        await this.boatService.updateTankLevel(boatId, tankId, level);
      } catch (error) {
        console.warn(`Failed to update tank ${tankId}:`, error);
      }
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}