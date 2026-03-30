// Simulates network delay for realistic loading states
export const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));
