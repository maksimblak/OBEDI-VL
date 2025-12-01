
import { User } from '../types';

const USER_STORAGE_KEY = 'obedi_vl_user';

export const authService = {
  // Simulate sending SMS
  sendOtp: async (phone: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1500); // Simulate network delay
    });
  },

  // Simulate verifying SMS code (Mock code is 0000)
  verifyOtp: async (phone: string, code: string): Promise<User | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (code === '0000') {
          // Create or retrieve mock user
          const user: User = {
            id: phone, // Simple ID based on phone for this demo
            phone: phone,
            name: 'Гость', // Default name
            loyaltyPoints: 150, // Welcome bonus
            joinedDate: new Date().toISOString()
          };
          
          // Check if we have a saved name for this user in local storage
          const savedUserStr = localStorage.getItem(USER_STORAGE_KEY);
          if (savedUserStr) {
             const savedUser = JSON.parse(savedUserStr);
             if (savedUser.phone === phone) {
                 resolve(savedUser);
                 return;
             }
          }

          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          resolve(user);
        } else {
          resolve(null);
        }
      }, 1000);
    });
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  updateProfile: (user: User): void => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  logout: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};
