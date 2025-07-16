import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedPlant {
  id: string;
  name: string;
  commonName: string;
  customName?: string;
  imageUri: string;
  confidence: number;
  healthStatus: string;
  healthScore: number;
  diagnosis: string;
  careAdvice: string[];
  quickFacts: {
    origin: string;
    difficulty: string;
    growthRate: string;
    toxicity: string;
    lightRequirement: string;
    waterFrequency: string;
    humidity: string;
    temperature: string;
  };
  identificationId: string;
  timestamp: string;
  dateAdded: string;
  lastWatered?: string;
  lastFertilized?: string;
  notes?: string;
}

const PLANTS_STORAGE_KEY = '@plantpal_saved_plants';

export const PlantStorage = {
  async savePlant(plantData: Omit<SavedPlant, 'id' | 'dateAdded'>): Promise<SavedPlant> {
    try {
      const plants = await this.getAllPlants();
      const newPlant: SavedPlant = {
        ...plantData,
        id: `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date().toISOString(),
      };
      
      const updatedPlants = [newPlant, ...plants];
      await AsyncStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(updatedPlants));
      return newPlant;
    } catch (error) {
      console.error('Error saving plant:', error);
      throw error;
    }
  },

  async getAllPlants(): Promise<SavedPlant[]> {
    try {
      const plantsJson = await AsyncStorage.getItem(PLANTS_STORAGE_KEY);
      return plantsJson ? JSON.parse(plantsJson) : [];
    } catch (error) {
      console.error('Error loading plants:', error);
      return [];
    }
  },

  async getPlantById(id: string): Promise<SavedPlant | null> {
    try {
      const plants = await this.getAllPlants();
      return plants.find(plant => plant.id === id) || null;
    } catch (error) {
      console.error('Error getting plant by ID:', error);
      return null;
    }
  },

  async updatePlant(id: string, updates: Partial<SavedPlant>): Promise<SavedPlant | null> {
    try {
      const plants = await this.getAllPlants();
      const plantIndex = plants.findIndex(plant => plant.id === id);
      
      if (plantIndex === -1) return null;
      
      const updatedPlant = { ...plants[plantIndex], ...updates };
      plants[plantIndex] = updatedPlant;
      
      await AsyncStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(plants));
      return updatedPlant;
    } catch (error) {
      console.error('Error updating plant:', error);
      throw error;
    }
  },

  async deletePlant(id: string): Promise<boolean> {
    try {
      const plants = await this.getAllPlants();
      const filteredPlants = plants.filter(plant => plant.id !== id);
      
      await AsyncStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(filteredPlants));
      return true;
    } catch (error) {
      console.error('Error deleting plant:', error);
      return false;
    }
  },

  async getPlantStats(): Promise<{
    totalPlants: number;
    healthyPlants: number;
    plantsNeedingCare: number;
    plantsNeedingWater: number;
    averageHealthScore: number;
  }> {
    try {
      const plants = await this.getAllPlants();
      const totalPlants = plants.length;
      
      if (totalPlants === 0) {
        return {
          totalPlants: 0,
          healthyPlants: 0,
          plantsNeedingCare: 0,
          plantsNeedingWater: 0,
          averageHealthScore: 0,
        };
      }
      
      const healthyPlants = plants.filter(plant => 
        plant.healthStatus.toLowerCase() === 'healthy' || plant.healthScore >= 80
      ).length;
      
      const plantsNeedingCare = plants.filter(plant => 
        plant.healthStatus.toLowerCase() === 'poor' || plant.healthScore < 60
      ).length;

      const now = new Date();
      const plantsNeedingWater = plants.filter(plant => {
        if (!plant.lastWatered) return true;
        const lastWatered = new Date(plant.lastWatered);
        const daysSince = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= 7;
      }).length;
      
      const averageHealthScore = plants.reduce((sum, plant) => sum + plant.healthScore, 0) / totalPlants;
      
      return {
        totalPlants,
        healthyPlants,
        plantsNeedingCare,
        plantsNeedingWater,
        averageHealthScore: Math.round(averageHealthScore),
      };
    } catch (error) {
      console.error('Error getting plant stats:', error);
      return {
        totalPlants: 0,
        healthyPlants: 0,
        plantsNeedingCare: 0,
        plantsNeedingWater: 0,
        averageHealthScore: 0,
      };
    }
  },
};