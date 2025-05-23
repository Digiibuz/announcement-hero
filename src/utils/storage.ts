
export const saveToStorage = (key: string, data: any) => {
  try {
    if (data && Object.keys(data).length > 0) {
      let hasNonEmptyValues = false;
      
      for (const value of Object.values(data)) {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value) ? value.length > 0 : true) {
            hasNonEmptyValues = true;
            break;
          }
        }
      }
      
      if (hasNonEmptyValues) {
        localStorage.setItem(key, JSON.stringify(data));
        
        // Save current step if available
        if ('_currentStep' in data) {
          localStorage.setItem(`${key}_step`, String(data._currentStep));
        }
      }
    }
  } catch (error) {
    console.error('Error saving to storage:', error);
    throw error;
  }
};

export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const savedData = localStorage.getItem(key);
    if (!savedData) return null;
    
    const parsedData = JSON.parse(savedData) as T;
    
    // Load saved step if available
    const savedStep = localStorage.getItem(`${key}_step`);
    if (savedStep && typeof parsedData === 'object') {
      (parsedData as any)._currentStep = parseInt(savedStep, 10);
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return null;
  }
};

export const clearStorage = (key: string) => {
  localStorage.removeItem(key);
  localStorage.removeItem(`${key}_step`);
};
