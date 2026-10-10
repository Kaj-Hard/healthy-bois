import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';

/**
 * Native key-value storage (Android SharedPreferences) so data survives the OS
 * clearing WebView storage. Falls back to localStorage automatically on web.
 */
export const deviceStorage: StateStorage = {
  async getItem(name) {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  async setItem(name, value) {
    await Preferences.set({ key: name, value });
  },
  async removeItem(name) {
    await Preferences.remove({ key: name });
  },
};
