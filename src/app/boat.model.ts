export interface TankConfig {
  id: string;
  name: string;
  type: 'center' | 'port_saddle' | 'stbd_saddle' | 'aux' | 'other';
  capacity: number;
  currentLevel: number;
}

export interface BoatConfig {
  id: string;
  name: string;
  tanks: TankConfig[];
  isActive: boolean;
}

export interface TripEvent {
  id: string;
  tripId: string;
  timestamp: Date;
  type: 'departure' | 'tank_switch' | 'fuel_stop' | 'activity_change' | 'arrival';
  odometer: number;
  fuelLevels: { [tankId: string]: number };
  activeTanks: string[]; // which tanks are currently being used
  activity?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  boatId: string;
  name?: string; // Added trip name field
  startDate: Date;
  endDate?: Date;
  events: TripEvent[];
  status: 'active' | 'completed';
  notes?: string;
}

export interface FuelStats {
  totalUsed: number;
  usageByTank: { [tankId: string]: number };
  totalMiles: number;
  overallMPG: number;
  segmentMPGs: { segment: string; mpg: number }[];
}