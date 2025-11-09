import { Student, SchoolSettings } from "@/types/student";

const STORAGE_KEYS = {
  STUDENTS: "school_students",
  SETTINGS: "school_settings",
};

export const storageHelper = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getSettings(): SchoolSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data
        ? JSON.parse(data)
        : {
            schoolName: "Secondary School",
            schoolAddress: "P.O. Box 123, City, Country",
            subscriptionDays: 30,
            subscriptionExpiry: 0,
            adminKey: "9801",
          };
    } catch {
      return {
        schoolName: "Secondary School",
        schoolAddress: "P.O. Box 123, City, Country",
        subscriptionDays: 30,
        subscriptionExpiry: 0,
        adminKey: "9801",
      };
    }
  },

  saveSettings(settings: SchoolSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },
};
