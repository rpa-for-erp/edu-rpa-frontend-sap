import { LocalStorage } from "@/constants/localStorage";

const getLocalStorageObject = (key: string) => {
  const currentStorage = localStorage.getItem(key);
  if (!currentStorage) {
    return [];
  }
  try {
    return JSON.parse(currentStorage);
  } catch (e) {
    console.error(`Error parsing storage for key "${key}". Returning empty array.`, e);
    return [];
  }
};

const setLocalStorageObject = (key: string, value: object[] | string) => {
  localStorage.setItem(key, JSON.stringify(value));
  // Dispatch custom event for same-tab updates when process list changes
  if (key === LocalStorage.PROCESS_LIST) {
    window.dispatchEvent(new Event("processUpdated"));
  }
};

export { getLocalStorageObject, setLocalStorageObject };
