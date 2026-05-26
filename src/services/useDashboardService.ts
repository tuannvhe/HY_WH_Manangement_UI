import axiosClient from '../axiosClient';

// --- INTERFACES ---
export interface DashboardStats {
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  maintenanceAssets: number;
  brokenAssets: number;
  totalLicenses: number;
  monthlyAssignments: number;
  totalVendors: number;
  warrantyExpired: number;
  warrantyExpiringSoon: number;
  warrantyActive: number;
}

export interface TopMetric {
  name: string;
  count: number;
}

export interface Consumable {
  id: number | string;
  name: string;
  quantity: number;
  minQuantity: number;
}

export interface DashboardData {
  
  stats: DashboardStats;
  topCategories: TopMetric[];
  consumables: Consumable[];
  licenses: LicenseMetric[];
}

export interface LicenseMetric {
    name: string;
    quantity: number;    // Số người dùng
    minQuantity: number; // Tổng số chỗ
    daysRemaining: number;
}

// --- SERVICE ---
export const dashboardService = {
  /**
   * Lấy dữ liệu tổng hợp cho Dashboard (Stats, Top Categories, Consumables)
   * Sử dụng trực tiếp axiosClient để thừa hưởng cấu hình Token/BaseURL
   */
  getSummary: async (): Promise<DashboardData> => {
    try {
      // Lưu ý: Không cần .create() lại nếu axiosClient đã cấu hình sẵn
      const response = await axiosClient.get<DashboardData>('/dashboard/summary');
      return response.data;
    } catch (error: any) {
      console.error("Dashboard Service Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Xuất báo cáo Dashboard ra file Excel (Blob)
   */
  exportReport: async (month: number, year: number): Promise<Blob> => {
    try {
      const response = await axiosClient.get('/dashboard/export', {
        params: { month, year },
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      console.error("Export Error:", error);
      throw error;
    }
  }
};

/**
 * Hàm hỗ trợ tải file trực tiếp trên trình duyệt
 */
export const downloadDashboardExcel = async (month: number, year: number) => {
  try {
    const blob = await dashboardService.exportReport(month, year);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Vinatech_Asset_Report_${month}_${year}.xlsx`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup để tránh rò rỉ bộ nhớ
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};