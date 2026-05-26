import { create } from 'zustand';

interface DashboardStats {
  totalAssets: number;
  newImports: number;
  assignedAssets: number;
  brokenAssets: number;
}

interface DashboardState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  // Hàm này dùng để gọi API sau này
  fetchStats: () => Promise<void>;
}

// src/store/useDashboardStore.ts
export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    totalAssets: 125,
    newImports: 12,
    assignedAssets: 85,
    brokenAssets: 3,
  },
  loading: false,
  error: null,

  fetchStats: async () => {
  set({ loading: true });
  try {
    // Để 3 giây để bạn kịp cuộn chuột lên xuống kiểm tra xem nó có ở chính giữa không
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    set({ loading: false });
  } catch (err) {
    set({ loading: false });
  }
},
}));