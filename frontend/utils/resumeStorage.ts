import { ResumeProfile } from '../types';

const STORAGE_KEY = 'app_resume_profiles_v1';

type ResumeRecordMap = Record<string, ResumeProfile>;

const getCurrentUserId = (): number | null => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    return typeof user?.id === 'number' ? user.id : null;
  } catch (error) {
    return null;
  }
};

const readMap = (): ResumeRecordMap => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as ResumeRecordMap;
  } catch (error) {
    return {};
  }
};

const writeMap = (value: ResumeRecordMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const resumeStorage = {
  saveLatest: (profile: ResumeProfile, userId?: number): void => {
    const targetUserId = userId ?? getCurrentUserId();
    if (!targetUserId) return;

    const map = readMap();
    map[String(targetUserId)] = profile;
    writeMap(map);
  },

  getLatest: (userId?: number): ResumeProfile | null => {
    const targetUserId = userId ?? getCurrentUserId();
    if (!targetUserId) return null;

    const map = readMap();
    return map[String(targetUserId)] || null;
  },

  clearLatest: (userId?: number): void => {
    const targetUserId = userId ?? getCurrentUserId();
    if (!targetUserId) return;

    const map = readMap();
    delete map[String(targetUserId)];
    writeMap(map);
  }
};
