export interface CollectionItem {
  id: number;       // Collection Entry ID (Timestamp)
  userId: number;   // Owner ID
  topicId: number;  // Original Job ID (from DataManagement)
  title: string;
  heat: number;
  collectTime: string;
  note: string;
  tags: string[];
}

const STORAGE_KEY = 'app_collections_v1';

export const collectionStorage = {
  // Get all collections for a specific user
  getUserCollections: (userId: number): CollectionItem[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allCollections: CollectionItem[] = stored ? JSON.parse(stored) : [];
    return allCollections.filter(item => item.userId === userId);
  },

  // Check if a job is already collected by the user
  isCollected: (userId: number, topicId: number): boolean => {
    const userItems = collectionStorage.getUserCollections(userId);
    return userItems.some(item => item.topicId === topicId);
  },

  // Add a new collection
  addCollection: (item: Omit<CollectionItem, 'id' | 'collectTime'>): CollectionItem => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allCollections: CollectionItem[] = stored ? JSON.parse(stored) : [];

    // Prevent duplicates (optional double check)
    if (allCollections.some(c => c.userId === item.userId && c.topicId === item.topicId)) {
      throw new Error("该岗位已收藏");
    }

    const newCollection: CollectionItem = {
      ...item,
      id: Date.now(),
      collectTime: new Date().toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    };

    allCollections.unshift(newCollection);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCollections));
    return newCollection;
  },

  // Remove a collection
  removeCollection: (collectionId: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    let allCollections: CollectionItem[] = JSON.parse(stored);
    allCollections = allCollections.filter(item => item.id !== collectionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCollections));
  }
};
