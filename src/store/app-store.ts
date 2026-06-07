import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkinType, BudgetLevel, AgeGroup, Gender, Product, SkinReport, CheckInRecord } from '@/types';

interface UserProfile {
  id: string;
  nickname?: string;
  avatar?: string;
  skinType: SkinType;
  budgetLevel: BudgetLevel;
  age: number;
  gender: Gender;
  ageGroup: AgeGroup;
  allergicIngredients?: string[];
}

interface AppState {
  // 用户信息
  user: UserProfile | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  
  // 肤质档案
  skinProfile: {
    skinType: SkinType;
    budgetLevel: BudgetLevel;
    age: number;
    gender: Gender;
    ageGroup: AgeGroup;
  };
  
  // 检测报告
  reports: SkinReport[];
  latestReport: SkinReport | null;
  
  // 打卡记录
  checkInRecords: CheckInRecord[];
  todayCheckIn: CheckInRecord | null;
  
  // 产品数据
  products: Product[];
  
      // Actions
      login: (user: UserProfile) => void;
      loginAsGuest: () => void;
      logout: () => void;
      updateSkinProfile: (profile: Partial<AppState['skinProfile']>) => void;
      updateUserProfile: (profile: Partial<UserProfile>) => void;
      addReport: (report: SkinReport) => void;
      setTodayCheckIn: (record: CheckInRecord) => void;
      toggleTask: (taskId: string, completed: boolean) => void;
}

const defaultSkinProfile = {
  skinType: 'combination' as SkinType,
  budgetLevel: 'mid' as BudgetLevel,
  age: 25,
  gender: 'female' as Gender,
  ageGroup: 'adult' as AgeGroup,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isLoggedIn: false,
      isGuest: false,
      skinProfile: defaultSkinProfile,
      reports: [],
      latestReport: null,
      checkInRecords: [],
      todayCheckIn: null,
      products: [],
      
      // 登录
      login: (user) => set({
        user,
        isLoggedIn: true,
        isGuest: false,
        skinProfile: {
          ...defaultSkinProfile,
          skinType: user.skinType,
          budgetLevel: user.budgetLevel,
          age: user.age,
          gender: user.gender,
          ageGroup: user.ageGroup,
        },
      }),
      
      // 游客模式
      loginAsGuest: () => set({
        user: {
          id: 'guest-' + Date.now(),
          nickname: '游客用户',
          avatar: '',
          ...defaultSkinProfile,
        },
        isLoggedIn: true,
        isGuest: true,
        skinProfile: defaultSkinProfile,
      }),
      
      // 退出登录
      logout: () => set({
        user: null,
        isLoggedIn: false,
        isGuest: false,
        skinProfile: defaultSkinProfile,
        reports: [],
        latestReport: null,
        checkInRecords: [],
        todayCheckIn: null,
      }),
      
      // 更新肤质档案
      updateSkinProfile: (profile) => set((state) => ({
        skinProfile: { ...state.skinProfile, ...profile },
      })),

      // 更新用户资料
      updateUserProfile: (profile) => set((state) => ({
        user: state.user ? { ...state.user, ...profile } : null,
      })),
      
      // 添加检测报告
      addReport: (report) => set((state) => ({
        reports: [report, ...state.reports],
        latestReport: report,
      })),
      
      // 设置今日打卡
      setTodayCheckIn: (record) => set((state) => ({
        todayCheckIn: record,
        checkInRecords: state.checkInRecords.some(r => r.date === record.date)
          ? state.checkInRecords.map(r => r.date === record.date ? record : r)
          : [record, ...state.checkInRecords],
      })),
      
      // 切换任务状态
      toggleTask: (taskId, completed) => set((state) => {
        if (!state.todayCheckIn?.tasks) return state;
        return {
          todayCheckIn: {
            ...state.todayCheckIn,
            tasks: state.todayCheckIn.tasks.map(t =>
              t.id === taskId ? { ...t, completed } : t
            ),
          },
        };
      }),
    }),
    {
      name: 'ifulab-storage',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        isGuest: state.isGuest,
        skinProfile: state.skinProfile,
        reports: state.reports,
        latestReport: state.latestReport,
        checkInRecords: state.checkInRecords,
      }),
    }
  )
);
