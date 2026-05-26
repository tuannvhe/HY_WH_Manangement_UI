import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Card,
  Typography,
  Tag,
  Popconfirm,
  message,
  Select,
  DatePicker,
  InputNumber,
  Statistic,
  Row,
  Col,
  Tooltip,
  Avatar,
  List,
  Spin,
  Upload,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  QrcodeOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  CameraOutlined,
  DownloadOutlined,
  UserAddOutlined,
  UserOutlined,
  ImportOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ReconciliationOutlined,
  FileExcelOutlined,
  DesktopOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FilterOutlined,
  EyeOutlined,
  LaptopOutlined,
  TagOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsQR from "jsqr";
import { QRCodeCanvas } from "qrcode.react";
import { generateQrPdf } from "../utils/generateQrPdf";
import * as XLSX from "xlsx";
import parse from "html-react-parser";
// Import Services
import {
  hardwareAssetService,
  type HardwareAsset,
} from "../services/useHardwareAssetService";
import {
  assignmentService,
  employeeService,
} from "../services/assignmentService";
import { modelService } from "../services/useModelService";
import QrDetailView from "./QrDetailView";
import "../CSS/GlobalStyle.css";
import { useMemo } from "react";
const { Title, Text } = Typography;
const { Option } = Select;

import AssignMultipleModal from "./AssignMultipleModal"; // Điều chỉnh đường dẫn
import axiosClient from "../axiosClient";
import { debounce } from "lodash";
import { locationService, type Location } from "../services/useLocationService";
import AssetNoteModal from "./AssetNoteTab"; // Import file vừa tạo
import { makeQrDetailUrl } from "../utils/qrUtils";

const HardwareAssetList: React.FC = () => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [form] = Form.useForm();
  const [data, setData] = useState<HardwareAsset[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({ total: 0, inUse: 0, inStorage: 0 });
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<HardwareAsset | null>(
    null,
  );
  const [viewingAsset, setViewingAsset] = useState<HardwareAsset | null>(null);
  const [qrScanModalOpen, setQrScanModalOpen] = useState(false);
  const [scannedText, setScannedText] = useState("");
  const [scannedAsset, setScannedAsset] = useState<HardwareAsset | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [empSearchText, setEmpSearchText] = useState("");

  const assetStatus = Form.useWatch("status", form);
  const isEditingInUse = selectedAsset && selectedAsset.status === "In Use";
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [statusInput, setStatusInput] = useState<string | undefined>(undefined);

  const [excelSerials, setExcelSerials] = useState<string[]>([]);

  const [isBulk, setIsBulk] = useState(false); // Trạng thái chuyển đổi chế độ
  const [bulkInputMode, setBulkInputMode] = useState<"excel" | "text">("excel"); // Chế độ nhập hàng loạt: Excel hoặc Text
  const [locations, setLocations] = useState<Location[]>([]);

  const [selectedLocationName, setSelectedLocationName] = useState<
    string | null
  >(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<HardwareAsset | null>(null);

  const handleOpenDetail = (record: HardwareAsset) => {
    setDetailAsset(record);
    setIsDetailModalOpen(true);
  };

  const handleOpenNote = (record: HardwareAsset) => {
    //console.log(record);
    setSelectedAsset(record);
    setIsNoteModalOpen(true);
  };

  const updateNoteApi = async (id: number, notes: string) => {
    try {
      await hardwareAssetService.updateNote(id, notes);

      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, note: notes } : item)),
      );
      message.success("Lưu ghi chú thành công!");
    } catch (error) {
      console.error("Lỗi khi gọi API update:", error);
      throw error;
    }
  };
  useEffect(() => {
    const loadLocations = async () => {
      if (assignModalOpen) {
        try {
          const res = await locationService.getAll();
          setLocations(res.data);
        } catch (error) {
          console.error("Error loading locations:", error);
        }
      }
    };
    loadLocations();
  }, [assignModalOpen]);

  useEffect(() => {
    const loadModels = async () => {
      // Chỉ gọi API khi Modal được mở
      if (isModalOpen) {
        try {
          const res = await modelService.getAll();
          setModels(res.data);
        } catch (error) {
          console.error("Error loading models:", error);
        }
      }
    };

    loadModels();
  }, [isModalOpen]); // Thêm isModalOpen vào mảng dependency
  // Hàm load dữ liệu tách riêng
  const handleRefreshModels = async () => {
    setLoadingModels(true); // 1. Bật hiệu ứng khóa màn hình và loading
    try {
      const res = await modelService.getAll();
      setModels(res.data);
      //message.success("Đã cập nhật danh sách phân loại!"); // Thông báo nhỏ nếu muốn
    } catch (error) {
      console.error("Error loading models:", error);
      message.error("Không thể tải lại danh sách!");
    } finally {
      setLoadingModels(false); // 2. Tắt hiệu ứng, mở khóa màn hình
    }
  };

  // useEffect tự động gọi khi mở Modal
  useEffect(() => {
    if (isModalOpen) {
      handleRefreshModels();
    }
  }, [isModalOpen]);
  const downloadTemplate = () => {
    // 1. Tạo dữ liệu mẫu
    const templateData = [
      ["Serial Number (Vui lòng nhập từ dòng sau)"], // Header
    ];

    // 2. Tạo Workbook và Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // 3. Thiết lập độ rộng cột cho đẹp
    worksheet["!cols"] = [{ wch: 40 }];

    // 4. Xuất file
    XLSX.writeFile(workbook, "Template_Import_Serial_Vinatech.xlsx");
    message.info("Đang tải file mẫu...");
  };
  const handleImportExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const serials = json
        .slice(1)
        .map((row) => String(row[0] || "").trim())
        .filter((s) => s !== "" && s !== "undefined");

      if (serials.length > 0) {
        setExcelSerials(serials);
        message.success(`Đã nhận ${serials.length} Serial từ Excel.`);
      } else {
        message.error("File Excel không có dữ liệu ở cột A!");
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const handleExportInStorage = async () => {
    try {
      // Hiển thị loading nếu cần
      message.loading({ content: "Đang khởi tạo file...", key: "export" });

      const response = await axiosClient.get(
        "HardwareAssets/export-in-storage",
        {
          responseType: "blob", // BẮT BUỘC: Để nhận stream file từ server
        },
      );

      // Tạo URL từ dữ liệu nhị phân (Blob)
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Tạo một thẻ <a> ẩn để kích hoạt trình duyệt tải file
      const link = document.createElement("a");
      link.href = url;

      // Đặt tên file (nên khớp hoặc tương tự tên file từ server)
      const fileName = `Bao_Cao_Ton_Kho_${new Date().toLocaleDateString("vi-VN")}.xlsx`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      // Dọn dẹp bộ nhớ và xóa thẻ tạm
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: "Tải báo cáo thành công!", key: "export" });
    } catch (error) {
      console.error("Export error:", error);
      message.error({ content: "Không thể xuất file báo cáo!", key: "export" });
    }
  };
  const statusConfig: Record<
    string,
    { label: string; color: string; gradient: string }
  > = {
    "In Storage": {
      label: "LƯU KHO",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981, #059669)",
    },
    "In Use": {
      label: "ĐANG SỬ DỤNG",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    },
    Broken: {
      label: "HỎNG / LỖI",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    },
    Maintenance: {
      label: "BẢO TRÌ",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    //'Ready': { label: 'SẴN SÀNG', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
  };

  const [multiAssignOpen, setMultiAssignOpen] = useState(false);
  const downloadHandoverFile = async (handoverId: number) => {
    try {
      const response = await axiosClient.get(`/Handover/export/${handoverId}`, {
        responseType: "blob",
      });

      // 1. Trích xuất tên file từ header Content-Disposition
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `BienBanBanGiao_${handoverId}.docx`; // Tên mặc định dự phòng

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      // 2. Tạo Blob và tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Sử dụng tên file mà Backend gửi về
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      // 3. Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error("Lỗi khi tải file từ hệ thống.");
    }
  };

  const makeAssetDetailUrl = (asset: HardwareAsset) => {
    // Tạo object employee từ thông tin được gán trong asset
    const employee = asset.assignedTo
      ? {
          userId: asset.assignedToId || null,
          name: asset.assignedTo || null,
          department: asset.assignedDept || null,
        }
      : undefined;
    console.log('employee:', employee);
    return makeQrDetailUrl(asset, employee);
  };

  const handleOpenQR = (asset: HardwareAsset) => {
    setViewingAsset(asset);
    setQrValue(makeAssetDetailUrl(asset));
    setQrModalOpen(true);
  };

  const parseQrValue = (value: string) => {
    try {
      const url = new URL(value, window.location.href);
      const hash = url.hash || "";
      if (hash.startsWith("#/qr-detail")) {
        const queryStart = hash.indexOf("?");
        if (queryStart >= 0) {
          const params = new URLSearchParams(hash.slice(queryStart));
          return {
            assetId: params.get("assetId") || null,
            assetTag: params.get("assetTag") || null,
          };
        }
      }
    } catch {
      // Not a full URL, continue with plain text parsing
    }
    return null;
  };

  const findAssetFromQrValue = (value: string) => {
    const parsedUrl = parseQrValue(value);
    if (parsedUrl) {
      if (parsedUrl.assetId) {
        const idValue = Number(parsedUrl.assetId);
        if (!Number.isNaN(idValue)) {
          return data.find((item) => item.id === idValue) || null;
        }
      }
      if (parsedUrl.assetTag) {
        const normalizedTag = parsedUrl.assetTag.toLowerCase().trim();
        return (
          data.find(
            (item) => item.assetTag?.toLowerCase().trim() === normalizedTag,
          ) || null
        );
      }
    }

    const parsed = value
      .split("|")
      .map((str) => str.trim())
      .filter(Boolean);
    const [assetTag, serial] = parsed;

    const normalized = (str?: string) => str?.toLowerCase().trim() || "";
    return (
      data.find(
        (item) =>
          normalized(item.assetTag) === normalized(assetTag) ||
          normalized(item.serial) === normalized(serial) ||
          normalized(item.assetTag) === normalized(value) ||
          normalized(item.serial) === normalized(value),
      ) || null
    );
  };

  const stopQrScanner = () => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsScanning(false);
  };

  const handleQrDecoded = (value: string) => {
    const match = findAssetFromQrValue(value);
    setScannedText(value);
    setScannedAsset(match);
    setScanError(
      match ? null : "Không tìm thấy thiết bị tương ứng với QR này.",
    );
    stopQrScanner();
  };

  const handleScanSearch = () => {
    if (!scannedText) {
      setScanError("Vui lòng nhập hoặc quét nội dung QR.");
      return;
    }
    const match = findAssetFromQrValue(scannedText);
    setScannedAsset(match);
    setScanError(
      match ? null : "Không tìm thấy thiết bị tương ứng với QR này.",
    );
  };

  const startQrScanner = async () => {
    setScanError(null);
    setScannedAsset(null);
    setScannedText("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError(
        "Trình duyệt không hỗ trợ camera. Vui lòng dán nội dung QR.",
      );
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setScanError(
        "Không thể truy cập camera. Vui lòng kiểm tra quyền và thử lại.",
      );
      return;
    }

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    setIsScanning(true);

    const scanFrame = async () => {
      if (!videoRef.current) {
        return;
      }

      if (BarcodeDetectorClass) {
        try {
          const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleQrDecoded(rawValue);
              return;
            }
          }
        } catch (error) {
          // ignore failures during detection and fallback to jsQR
        }
      }

      const video = videoRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width > 0 && height > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, width, height);
          if (code?.data) {
            handleQrDecoded(code.data);
            return;
          }
        }
      }

      scanFrameRef.current = requestAnimationFrame(scanFrame);
    };

    scanFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const handlePrintQR = async () => {
    const canvas = document.getElementById("qr-gen") as HTMLCanvasElement;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // --- CẤU HÌNH KÍCH THƯỚC ---
    const padding = 25;
    const qrSize = canvas.width; // Giả sử là 200 hoặc 300
    const cardW = qrSize + padding * 2;
    const serialH = 40; // Khoảng trống cho mã Serial
    const brandH = 50; // Chiều cao thanh màu tím bên dưới
    const cardH = qrSize + padding + serialH + brandH;

    tempCanvas.width = cardW;
    tempCanvas.height = cardH;

    // 1. VẼ NỀN TRẮNG VÀ BO GÓC TOÀN BỘ CARD
    const radius = 15;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(cardW - radius, 0);
    ctx.quadraticCurveTo(cardW, 0, cardW, radius);
    ctx.lineTo(cardW, cardH - radius);
    ctx.quadraticCurveTo(cardW, cardH, cardW - radius, cardH);
    ctx.lineTo(radius, cardH);
    ctx.quadraticCurveTo(0, cardH, 0, cardH - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Vẽ viền nhạt cho card (tùy chọn)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. VẼ QR CODE
    ctx.drawImage(canvas, padding, padding, qrSize, qrSize);

    // 3. VẼ LOGO VINATECH VÀO GIỮA QR (Nếu bạn có logo URL)
    // Nếu logo đã có sẵn trong mã QR khi generate thì bỏ qua bước này

    try {
      const logo = new Image();
      // Thay đường dẫn logo thực tế của bạn vào đây
      logo.src = "/assets/logoB.png";

      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = () => reject(new Error("Could not load logo image"));
      });

      const logoSize = qrSize * 0.22; // Kích thước logo chiếm 22% QR
      const logoX = padding + (qrSize - logoSize) / 2;
      const logoY = padding + (qrSize - logoSize) / 2;

      // Vẽ một hình nền trắng nhỏ dưới logo để che bớt các pixel đen của QR
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(logoX - 3, logoY - 3, logoSize + 6, logoSize + 6, 4);
      ctx.fill();

      // Vẽ logo lên trên
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    } catch (err) {
      console.warn("Logo không tải được, đang in QR không có logo:", err);
    }

    // 4. VẼ DÒNG SERIAL (Nằm ngay dưới QR)
    ctx.fillStyle = "#4b5563"; // Màu xám đậm
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    const serialText = viewingAsset?.serial || "N/A";
    ctx.fillText(serialText, cardW / 2, padding + qrSize + 25);

    // 5. VẼ THANH BRAND MÀU TÍM Ở DƯỚI CÙNG
    const brandY = cardH - brandH;
    ctx.fillStyle = "#534AB7"; // Màu tím giống mẫu

    // Vẽ hình chữ nhật bo góc dưới cho thanh Brand
    ctx.beginPath();
    ctx.moveTo(0, brandY);
    ctx.lineTo(cardW, brandY);
    ctx.lineTo(cardW, cardH - radius);
    ctx.quadraticCurveTo(cardW, cardH, cardW - radius, cardH);
    ctx.lineTo(radius, cardH);
    ctx.quadraticCurveTo(0, cardH, 0, cardH - radius);
    ctx.lineTo(0, brandY);
    ctx.closePath();
    ctx.fill();

    // 6. VẼ CHỮ "VINATECH VINA" MÀU TRẮNG
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("VINATECH VINA", cardW / 2, brandY + brandH / 2 + 7);

    // 7. THỰC HIỆN TẢI VỀ
    const pngUrl = tempCanvas.toDataURL("image/png");
    const serialFilename =
      viewingAsset?.serial?.replace(/\s+/g, "_") || "asset";

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${serialFilename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  // Wrap loadData bằng useCallback
  const loadData = useCallback(
    async (page: number, search: string, status?: string, size?: number) => {
      setLoading(true);
      try {
        const response: any = await hardwareAssetService.getAll({
          pageNumber: page,
          pageSize: size || pagination.pageSize,
          searchTerm: search || undefined,
          status: status || undefined,
        });
        const result = response.data?.data || response.data;
        const items = result?.items || [];
        setData(items);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: result?.totalCount || 0,
        }));
        setStats({
          total: result?.total || result?.totalCount || 0,
          inUse:
            result?.statInUse ||
            items.filter((i: any) => i.status === "In Use").length,
          inStorage:
            result?.statInStorage ||
            items.filter((i: any) => i.status === "In Storage").length,
        });
      } catch (err) {
        message.error("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize],
  ); // ← chỉ dep pageSize
  const handleSearch = () => {
    setSearchText(searchInput);
    setStatusFilter(statusInput);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  useEffect(() => {
    loadData(1, searchText, statusFilter);
  }, [searchText, statusFilter]);
  useEffect(() => {
    return () => {
      stopQrScanner();
    };
  }, []);

  // Chèn đoạn này vào phía trên phần return của Component
  const filteredData = data;
  const liveStats = {
    total: stats.total,
    ready: stats.inStorage,
    inUse: stats.inUse,
    alert: filteredData.filter(
      (i) => i.status === "Broken" || i.status === "Maintenance",
    ).length,
  };

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 1. Hàm fetch dữ liệu dùng chung
  const fetchEmployeesData = async (
    searchTerm: string,
    pageNum: number,
    isAppend: boolean,
  ) => {
    if (empLoading && pageNum > 1) return; // ← dùng empLoading
    setEmpLoading(true);
    try {
      const data = await employeeService.getLookupPaged(searchTerm, pageNum);

      if (isAppend) {
        setEmployees((prev) => [...prev, ...data]);
      } else {
        setEmployees(data);
      }

      // Nếu trả về ít hơn 20 bản ghi tức là đã hết dữ liệu trong DB
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (error) {
      message.error("Lỗi khi tải danh sách nhân viên");
    } finally {
      setEmpLoading(false);
    }
  };

  // 2. Xử lý mở Modal
  const handleOpenAssign = (asset: any) => {
    setViewingAsset(asset);
    setAssignModalOpen(true);
    setEmpSearchText("");
    setEmployees([]);
    // Delay nhỏ để modal render trước, sau đó mới fetch data
    setTimeout(() => fetchEmployeesData("", 1, false), 100);
  };

  // 3. Xử lý Search (Debounce 500ms để tránh gọi API liên tục)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    //console.log("⌨️ Value changed:", value);
    setEmpSearchText(value); // Cập nhật state để Input hiển thị chữ
    debouncedSearch(value); // Gửi vào hàng chờ debounce
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((search: string) => {
        //console.log("🔥 Thực hiện search API với từ khóa:", search);
        fetchEmployeesData(search, 1, false);
      }, 500),
    [], // Quan trọng: Chỉ khởi tạo 1 lần
  );

  // Cleanup để tránh memory leak
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);
  // 4. Xử lý sự kiện Scroll trong danh sách
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Nếu cuộn cách đáy 10px thì load tiếp
    if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore && !loading) {
      fetchEmployeesData(empSearchText, page + 1, true);
    }
  };

  const onAssignSubmit = async (employee: any, locationName: string | null) => {
    if (!viewingAsset) return;

    if (!locationName) {
      message.warning("Vui lòng chọn Vị trí bàn giao!");
      return;
    }

    setSubmitting(true);
    setGlobalLoading(true);
    try {
      const response = await assignmentService.assign({
        assetId: viewingAsset.id!,
        employeeId: employee.employeeId,
        location: locationName, // Truyền về string thay vì ID
      });

      message.success(
        `Đã bàn giao cho: ${employee.fullName} tại ${locationName}`,
      );

      const handoverId = response?.handoverId;
      if (handoverId) {
        message.loading("Đang khởi tạo tệp biên bản...", 2.5);
        await downloadHandoverFile(handoverId);
        try {
          await generateQrPdf([viewingAsset], `QR_BienBan_${handoverId}.pdf`, {
            recipientName: employee.fullName,
            department: employee.department,
            code: employee.employeeId,
            handoverId,
          });
        } catch (err) {
          console.error("Lỗi khi tạo PDF QR:", err);
        }
      }

      setAssignModalOpen(false);
      setSelectedLocationName(null); // Reset state string
      loadData(pagination.current, searchText, statusFilter);
    } catch (err) {
      console.error("Assign error:", err);
      message.error("Thao tác thất bại.");
    } finally {
      setSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const onRevokeSubmit = async (record: any) => {
    try {
      const assignedToId = record.assignedToId || record.assignedTo || null;
      //console.log('Revoking asset:', record.id, 'Assigned to:', assignedToId);
      await assignmentService.revoke(
        record.id,
        null,
        assignedToId,
        "Thu hồi thiết bị về kho",
      );

      message.success(`Đã thu hồi thiết bị ${record.assetCode || ""} về kho`);
      loadData(pagination.current, searchText, statusFilter);
      return true;
    } catch (err) {
      message.error("Lỗi khi thực hiện thu hồi");
      return false;
    }
  };

  const handleQrRevoke = async (asset: HardwareAsset) => {
    const revoked = await onRevokeSubmit(asset);
    if (revoked) {
      stopQrScanner();
      setQrScanModalOpen(false);
    }
  };

  const onDeleteSubmit = async (assetId: number) => {
    try {
      await hardwareAssetService.delete(assetId);
      message.success("Đã xóa thiết bị");
      loadData(pagination.current, searchText, statusFilter);
    } catch (err) {
      message.error("Không thể xóa thiết bị đang được sử dụng");
    }
  };

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    setGlobalLoading(true);
    try {
      const basePayload = {
        ...values,
        purchaseDate: values.purchaseDate
          ? values.purchaseDate.format("YYYY-MM-DD")
          : null,
        purchasePrice: Number(values.purchasePrice || 0),
        warrantyMonths: Number(values.warrantyMonths || 0),
      };

      let finalPayload;

      if (selectedAsset?.id) {
        // TRƯỜNG HỢP CẬP NHẬT
        finalPayload = basePayload;
        await hardwareAssetService.update(selectedAsset.id, finalPayload);
        message.success("Cập nhật thành công");
      } else {
        // TRƯỜNG HỢP TẠO MỚI
        if (isBulk) {
          if (excelSerials.length === 0) {
            message.warning("Vui lòng tải file Excel Serial trước khi lưu!");
            setSubmitting(false);
            return;
          }
          finalPayload = {
            ...basePayload,
            serials: excelSerials, // Gửi mảng
            serial: null, // BE sẽ check null trường này
          };
        } else {
          // Nhập đơn lẻ - Đảm bảo values.serial có giá trị
          if (!values.serial) {
            message.warning("Vui lòng nhập số Serial!");
            setSubmitting(false);
            return;
          }
          finalPayload = {
            ...basePayload,
            serials: null,
            serial: values.serial, // Lấy từ Form
          };
        }
        //console.log(">> FINAL PAYLOAD GỬI BE:", finalPayload);
        const response = await hardwareAssetService.create(finalPayload);
        const count = Array.isArray(response.data) ? response.data.length : 1;
        message.success(`Đã đăng ký thành công ${count} thiết bị mới`);
      }

      setIsModalOpen(false);
      setExcelSerials([]);
      form.resetFields(); // Quan trọng để xóa dữ liệu cũ
      loadData(pagination.current, searchText, statusFilter);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Thao tác thất bại";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const openModal = (asset: HardwareAsset | null = null) => {
    setSelectedAsset(asset);
    if (asset) {
      const pDate = asset.purchaseDate ? dayjs(asset.purchaseDate) : null;
      const eDate = asset.warrantyExpiry ? dayjs(asset.warrantyExpiry) : null;

      // Tính toán lại số tháng nếu có đủ 2 ngày (đề phòng dữ liệu cũ)
      let wMonths = asset.warrantyMonths || 0;
      if (pDate && eDate && !asset.warrantyMonths) {
        wMonths = eDate.diff(pDate, "month");
      }

      form.setFieldsValue({
        ...asset,
        purchaseDate: pDate,
        warrantyExpiry: eDate,
        purchasePrice: Number(asset.purchasePrice || 0),
        warrantyMonths: wMonths,
        modelId: asset.modelId || undefined,
      });
    } else {
      form.resetFields();
      const defaultPurchaseDate = dayjs().startOf("day"); // Xóa giờ
      const defaultMonths = 12;
      form.setFieldsValue({
        status: "In Storage",
        purchasePrice: 0,
        warrantyMonths: defaultMonths,
        purchaseDate: defaultPurchaseDate,
        warrantyExpiry: defaultPurchaseDate.add(defaultMonths, "month"),
      });
    }
    setIsModalOpen(true);
  };
  const columns = useMemo(
    () => [
      {
        title: "THIẾT BỊ / HỆ THỐNG",
        key: "asset_info",
        width: 350,
        render: (record: HardwareAsset) => {
          // Logic chọn icon dựa trên tên hoặc loại thiết bị
          const getIcon = () => {
            const name = (record.modelName || "").toUpperCase();
            if (name.includes("LAPTOP") || name.includes("XÁCH TAY"))
              return <LaptopOutlined className="icon-3d laptop" />;
            if (name.includes("PC"))
              return <DesktopOutlined className="icon-3d desktop" />;
            return <TagOutlined className="icon-3d generic" />;
          };

          return (
            <div className="asset-info-cell-3d">
              <div className="icon-wrapper-3d">{getIcon()}</div>
              <div className="text-group">
                <Text strong className="name-3d">
                  {record.modelName || "N/A"}
                </Text>
                <br />
                <Tag color="blue" style={{ fontWeight: "bold" }}>
                  Serial: {record.serial}
                </Tag>
              </div>
            </div>
          );
        },
      },
      {
        title: "NGƯỜI SỬ DỤNG",
        key: "assignedTo",
        width: 200,
        render: (record: HardwareAsset) => {
          const hasUser = !!record.assignedTo;
          const canAssign =
            record.status === "In Storage" || record.status === "Ready";

          return (
            <div className="assignment-control-3d">
              {hasUser ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Space>
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      style={{ background: "#3b82f6" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <Text
                        strong
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {record.assignedToId} - {record.assignedTo}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {record.assignedDept}
                      </Text>
                    </div>
                  </Space>
                  <Popconfirm
                    title="Thu hồi thiết bị?"
                    onConfirm={() => onRevokeSubmit(record)}
                  >
                    <Button
                      danger
                      ghost
                      icon={<ImportOutlined />}
                      size="small"
                      className="btn-3d-revoke-cyan"
                      style={{ borderRadius: "8px" }}
                    >
                      Thu hồi
                    </Button>
                  </Popconfirm>
                </div>
              ) : canAssign ? (
                <Button
                  block
                  type="dashed"
                  icon={<UserAddOutlined />}
                  className="btn-3d-no-tilt"
                  onClick={() => handleOpenAssign(record)}
                >
                  Cấp phát
                </Button>
              ) : (
                <Tag
                  color="default"
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: "4px 0",
                    borderRadius: "8px",
                  }}
                >
                  Không khả dụng
                </Tag>
              )}
            </div>
          );
        },
      },
      {
        title: "GHI CHÚ",
        key: "note",
        width: 300,
        render: (record: HardwareAsset) => {
          // Strip HTML tags for display
          const stripHtml = (html: string) =>
            html.replace(/<[^>]*>/g, "").trim();
          const plainNote = record.note ? stripHtml(record.note) : "";
          const displayNote = plainNote || "Chưa có ghi chú";

          return (
            <Tooltip title={displayNote}>
              <Text
                style={{
                  fontSize: "13px",
                  color: plainNote ? "#475569" : "#94a3b8",
                  fontStyle: plainNote ? "normal" : "italic",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "180px",
                }}
              >
                {displayNote}
              </Text>
            </Tooltip>
          );
        },
      },
      {
        title: "THAO TÁC",
        key: "actions",
        align: "right" as const,
        width: 240,
        render: (record: HardwareAsset) => (
          <Space>
            <Tooltip title="Xem chi tiết">
              <Button
                className="btn-3d"
                style={{
                  color: "#10b981",
                  background: "rgba(16, 185, 129, 0.05)",
                }}
                icon={<EyeOutlined />}
                onClick={() => handleOpenDetail(record)}
              />
            </Tooltip>
            <Tooltip title="Ghi chú thiết bị">
              <Button
                className="btn-3d"
                style={{
                  color: "#f59e0b",
                  background: "rgba(245, 158, 11, 0.05)",
                }}
                icon={<FileTextOutlined />}
                onClick={() => handleOpenNote(record)}
              />
            </Tooltip>
            <Tooltip title="Mã định danh QR">
              <Button
                className="btn-3d"
                style={{ color: "#8b5cf6" }}
                icon={<QrcodeOutlined />}
                onClick={() => handleOpenQR(record)}
              />
            </Tooltip>
            <Button
              className="btn-3d"
              style={{ color: "#3b82f6" }}
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
            <Popconfirm
              title="Xóa thiết bị?"
              onConfirm={() => onDeleteSubmit(record.id!)}
            >
              <Button className="btn-3d" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [
      onRevokeSubmit,
      handleOpenAssign,
      handleOpenDetail,
      handleOpenNote,
      handleOpenQR,
      openModal,
      onDeleteSubmit,
    ],
  );

  return (
    <div className="glass-page-container">
      <div className="page-fade-in">
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner">
            <div className="banner-content">
              <div className="banner-badge">
                <QrcodeOutlined /> VINATECH ASSET HUB
              </div>
              <Title level={1} className="banner-title">
                Equipment Hub
              </Title>
              <Text className="banner-subtitle">
                Quản lý vòng đời thiết bị thông minh
              </Text>
              <Space style={{ marginTop: 20 }}>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExportInStorage}
                  className="btn-glass-primary"
                >
                  Xuất báo cáo tồn kho
                </Button>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                className="btn-submit-3d"
                style={{ width: "220px", padding: "0 30px" }}
              >
                Đăng ký thiết bị
              </Button>
              <Button
                type="default"
                size="large"
                icon={<CameraOutlined />}
                onClick={() => {
                  setQrScanModalOpen(true);
                  setTimeout(() => startQrScanner(), 100);
                }}
                className="btn-submit-3d"
                style={{ width: "auto", padding: "0 30px" }}
              >
                Quét QR
              </Button>
            </div>
          </div>
          <div className="bento-card stat-card">
            <Statistic
              title="ĐANG DÙNG"
              value={liveStats.inUse}
              prefix={<RiseOutlined />}
            />
            <div
              className="stat-progress"
              style={{ background: "#3b82f6" }}
            ></div>
          </div>
          <div className="bento-card stat-card">
            <Statistic
              title="SẴN SÀNG"
              value={liveStats.ready}
              prefix={<CheckCircleOutlined />}
            />
            <div
              className="stat-progress"
              style={{ background: "#10b981" }}
            ></div>
          </div>
          <div className="bento-card stat-card">
            <Statistic
              title="Tổng số thiết bị"
              value={liveStats.total}
              prefix={<ThunderboltOutlined />}
            />
            <div
              className="stat-progress"
              style={{ background: "#fe1f5e" }}
            ></div>
          </div>
        </div>

        <div className="table-perspective-container">
          <Card className="glass-table-card-3d" variant="borderless">
            <div className="table-header-3d">
              <div className="controls-group-3d">
                {/* Ô Search */}
                <div
                  className="search-engine-3d"
                  style={{ flex: 1, minWidth: "300px" }}
                >
                  <SearchOutlined style={{ color: "#94a3b8" }} />
                  <input
                    placeholder="Tìm kiếm thiết bị, serial, model..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                {/* ComboBox Trạng thái */}
                <Select
                  className="filter-select-3d"
                  placeholder="Trạng thái thiết bị"
                  allowClear
                  value={statusInput}
                  onChange={(value) => {
                    setStatusInput(value);
                  }}
                  options={[
                    { value: "In Storage", label: "📦 LƯU KHO" },
                    { value: "In Use", label: "👤 ĐANG SỬ DỤNG" },
                    { value: "Maintenance", label: "🔧 ĐANG BẢO TRÌ" },
                    { value: "Broken", label: "❌ HỎNG / LỖI" },
                  ]}
                />

                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  className="btn-submit-3d"
                  onClick={handleSearch}
                  style={{ minWidth: "130px" }}
                >
                  LỌC KẾT QUẢ
                </Button>
              </div>

              <Button
                type="primary"
                icon={<ReconciliationOutlined />}
                onClick={() => setMultiAssignOpen(true)}
                className="btn-submit-3d"
              >
                Bàn giao hàng loạt
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={data}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                //  pageSizeOptions: ['5', '10', '20', '50'], // Thêm các tùy chọn này
                showQuickJumper: false,
                showTotal: (total) => (
                  <Text strong style={{ color: "#64748b" }}>
                    Tổng cộng {total} bản ghi
                  </Text>
                ),
              }}
              onChange={(tablePagination) => {
                const newPage = tablePagination.current || 1;
                const newPageSize = tablePagination.pageSize || 10;

                // 1. Cập nhật state để đồng bộ UI
                setPagination((prev) => ({
                  ...prev,
                  current: newPage,
                  pageSize: newPageSize,
                }));

                // 2. Gọi API với các giá trị mới nhất
                // Lưu ý: Nếu đổi pageSize, thường người ta sẽ quay về trang 1
                const targetPage =
                  newPageSize !== pagination.pageSize ? 1 : newPage;
                loadData(targetPage, searchText, statusFilter, newPageSize);
              }}
              loading={loading}
              rowClassName="glass-row-3d"
              rowKey="id"
              scroll={{ x: 1000 }}
            />
          </Card>
        </div>
      </div>

      {/* MODAL: ADD/EDIT (Đã thêm hiệu ứng icon orbit) */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>

          {/* Cấu trúc cho Icon bay 3D */}
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                {selectedAsset ? <EditOutlined /> : <PlusOutlined />}
              </div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>VINATECH VINA SYSTEM</span>
              <Title level={2}>
                {selectedAsset ? "CẬP NHẬT THÔNG TIN" : "ĐĂNG KÝ THIẾT BỊ MỚI"}
              </Title>
              {isEditingInUse && (
                <Tag
                  color="warning"
                  style={{ marginBottom: 15, padding: "4px 12px" }}
                >
                  ⚠️ Thiết bị đang được sử dụng. Vui lòng Thu hồi trước khi
                  chỉnh sửa thông tin kỹ thuật.
                </Tag>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              disabled={!!isEditingInUse}
              initialValues={{
                status: "In Storage",
                warrantyMonths: 0,
                purchasePrice: 0,
              }}
              onValuesChange={(changedValues, allValues) => {
                const { purchaseDate, warrantyMonths } = allValues;

                if (
                  purchaseDate &&
                  (changedValues.purchaseDate ||
                    changedValues.warrantyMonths !== undefined)
                ) {
                  // Luôn đưa về đầu ngày để không dính giờ phút
                  const baseDate = dayjs(purchaseDate).startOf("day");
                  const months = Number(warrantyMonths || 0);
                  const expiryDate = baseDate.add(months, "month");

                  form.setFieldsValue({
                    warrantyExpiry: expiryDate,
                    purchaseDate: baseDate,
                  });
                }
              }}
            >
              <div className="form-section-3d">
                <Row gutter={16}>
                  {/* Chế độ chọn: Chỉ hiện khi tạo mới */}
                  {!selectedAsset && (
                    <Col span={24}>
                      <div
                        className="mode-switcher"
                        style={{ marginBottom: 20 }}
                      >
                        <Button
                          type={!isBulk ? "primary" : "text"}
                          onClick={() => {
                            setIsBulk(false);
                            setExcelSerials([]);
                          }}
                          icon={<PlusOutlined />}
                        >
                          Nhập đơn lẻ
                        </Button>
                        <Button
                          type={isBulk ? "primary" : "text"}
                          onClick={() => setIsBulk(true)}
                          icon={<FileExcelOutlined />}
                        >
                          Nhập hàng loạt
                        </Button>
                      </div>
                    </Col>
                  )}

                  {/* Phần nhập Serial / Upload */}
                  {!isBulk || selectedAsset ? (
                    // CHẾ ĐỘ ĐƠN LẺ
                    <Col span={12}>
                      <Form.Item
                        name="serial"
                        label="Số Serial"
                        rules={[{ required: true }]}
                      >
                        <Input className="input-3d" placeholder="Nhập Serial" />
                      </Form.Item>
                    </Col>
                  ) : (
                    // CHẾ ĐỘ HÀNG LOẠT
                    <>
                      {/* Toggle button để chuyển giữa Excel và Text input */}
                      <Col span={24}>
                        <div
                          style={{
                            marginBottom: 12,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Button
                            type={
                              bulkInputMode === "excel" ? "primary" : "default"
                            }
                            size="small"
                            icon={<FileExcelOutlined />}
                            onClick={() => {
                              setBulkInputMode("excel");
                              setExcelSerials([]);
                            }}
                          >
                            Upload Excel
                          </Button>
                          <Button
                            type={
                              bulkInputMode === "text" ? "primary" : "default"
                            }
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setBulkInputMode("text");
                              setExcelSerials([]);
                            }}
                          >
                            Nhập thủ công
                          </Button>
                        </div>
                      </Col>

                      {bulkInputMode === "excel" ? (
                        <>
                          <Col span={5}>
                            <Form.Item label="1. Tải mẫu Serial">
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={downloadTemplate}
                                style={{
                                  width: "100%",
                                  height: "42px",
                                  background: "#f8fafc",
                                  border: "1px dashed #cbd5e1",
                                  color: "#475569",
                                }}
                              >
                                File mẫu
                              </Button>
                            </Form.Item>
                          </Col>

                          <Col span={7}>
                            <Form.Item label="2. Upload file Serial" required>
                              <Upload
                                beforeUpload={handleImportExcel}
                                showUploadList={false}
                                accept=".xlsx, .xls"
                              >
                                <Button
                                  icon={<FileExcelOutlined />}
                                  className={
                                    excelSerials.length > 0
                                      ? "btn-excel-active"
                                      : ""
                                  }
                                  style={{ width: "100%", height: "42px" }}
                                  type="dashed"
                                >
                                  {excelSerials.length > 0
                                    ? "Đã chọn file"
                                    : "Chọn file Excel"}
                                </Button>
                              </Upload>
                            </Form.Item>
                          </Col>

                          <Col span={4}>
                            <Form.Item label="Số lượng">
                              <Input
                                className="input-3d"
                                value={excelSerials.length}
                                readOnly
                                style={{
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  color: "#1890ff",
                                  background: "#f1f5f9",
                                }}
                              />
                            </Form.Item>
                          </Col>
                        </>
                      ) : (
                        <>
                          <Col span={16}>
                            <Form.Item
                              label="Nhập danh sách Serial (mỗi dòng 1 serial)"
                              required
                            >
                              <Input.TextArea
                                placeholder="Nhập serial, mỗi dòng một serial&#10;Ví dụ:&#10;SN001&#10;SN002&#10;SN003"
                                rows={8}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  const serials = text
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter((s) => s !== "");
                                  setExcelSerials(serials);
                                }}
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "13px",
                                }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={4}>
                            <Form.Item label="Số lượng">
                              <Input
                                className="input-3d"
                                value={excelSerials.length}
                                readOnly
                                style={{
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  color: "#1890ff",
                                  background: "#f1f5f9",
                                }}
                              />
                            </Form.Item>
                          </Col>
                        </>
                      )}
                    </>
                  )}

                  {/* Định danh thiết bị luôn nằm cuối hàng 1 */}
                  <Col span={12}>
                    <Form.Item
                      name="modelId"
                      label="Phân loại thiết bị"
                      rules={[{ required: true }]}
                    >
                      <Select
                        className="select-3d"
                        showSearch
                        placeholder="Chọn Model"
                        optionFilterProp="children"
                        // Tùy biến thanh menu đổ xuống kết hợp khóa màn hình loading
                        dropdownRender={(menu) => (
                          <Spin spinning={loadingModels} tip="Đang tải...">
                            {menu}
                            <Divider style={{ margin: "8px 0" }} />
                            <div
                              style={{
                                padding: "0 8px 4px",
                                display: "flex",
                                justifyContent: "flex-end",
                              }}
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<ReloadOutlined spin={loadingModels} />} // Icon tự xoay khi đang load
                                onClick={handleRefreshModels}
                                disabled={loadingModels} // Khóa luôn nút bấm khi đang chạy
                                style={{ fontSize: 12, color: "#475569" }}
                              >
                                Tải lại danh sách
                              </Button>
                            </div>
                          </Spin>
                        )}
                      >
                        {models.map((m) => (
                          <Option key={m.id} value={m.id} label={m.modelName}>
                            {m.modelName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Preview danh sách Serial từ Excel */}
                {isBulk && excelSerials.length > 0 && !selectedAsset && (
                  <div
                    style={{
                      marginBottom: 20,
                      padding: "10px 15px",
                      background:
                        "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#0369a1",
                        marginBottom: "5px",
                        fontWeight: 600,
                      }}
                    >
                      Serial đã nhận:
                    </div>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                    >
                      {excelSerials.slice(0, 5).map((s, idx) => (
                        <Tag
                          color="blue"
                          key={idx}
                          style={{ borderRadius: "4px", border: "none" }}
                        >
                          {s}
                        </Tag>
                      ))}
                      {excelSerials.length > 5 && (
                        <Tag color="default">
                          +{excelSerials.length - 5} nữa...
                        </Tag>
                      )}
                    </div>
                  </div>
                )}

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="purchaseDate" label="Ngày mua">
                      <DatePicker
                        className="input-3d"
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="warrantyMonths" label="Tháng bảo hành">
                      <InputNumber
                        className="input-3d"
                        style={{ width: "100%" }}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.warrantyMonths !==
                        currentValues.warrantyMonths ||
                      prevValues.purchaseDate !== currentValues.purchaseDate ||
                      prevValues.warrantyExpiry !== currentValues.warrantyExpiry
                    }
                  >
                    {({ getFieldValue }) => {
                      const months = getFieldValue("warrantyMonths");

                      // Chỉ hiển thị Col chứa Ngày hết hạn khi months lớn hơn 0
                      if (!months || months <= 0) {
                        return null;
                      }

                      const expiry = getFieldValue("warrantyExpiry");
                      const displayValue = expiry
                        ? dayjs(expiry).startOf("day").format("DD/MM/YYYY")
                        : "N/A";

                      return (
                        <Col span={8}>
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <label
                              style={{
                                marginBottom: 8,
                                color: "#64748b",
                                fontSize: "14px",
                              }}
                            >
                              Ngày hết hạn bảo hành
                            </label>
                            <Input
                              className="input-3d"
                              style={{
                                width: "100%",
                                background: "rgba(241, 245, 249, 0.5)",
                                cursor: "not-allowed",
                                color: "#1e293b",
                                fontWeight: 500,
                              }}
                              readOnly
                              value={displayValue}
                            />
                          </div>
                        </Col>
                      );
                    }}
                  </Form.Item>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="status" label="Trạng thái hệ thống">
                      <Select
                        className="select-3d"
                        dropdownClassName="select-3d-dropdown"
                        // Disable khi:
                        // 1. Đang thêm mới (!selectedAsset)
                        // 2. HOẶC thiết bị đang được sử dụng (In Use)
                        disabled={!selectedAsset || assetStatus === "In Use"}
                      >
                        <Option value="In Storage">📦 LƯU KHO</Option>
                        <Option value="Broken">❌ HỎNG / LỖI</Option>
                        <Option value="Maintenance">🔧 ĐANG BẢO TRÌ</Option>

                        {/* Hiển thị option Đang sử dụng nhưng Select đã bị khóa ở trên */}
                        {assetStatus === "In Use" && (
                          <Option value="In Use">👤 ĐANG SỬ DỤNG</Option>
                        )}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Form>
            <div
              className="modal-actions-3d"
              style={{
                marginTop: 20,
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
              }}
            >
              <Button
                className="btn-cancel-3d"
                onClick={() => setIsModalOpen(false)}
              >
                {isEditingInUse ? "ĐÓNG" : "HỦY BỎ"}
              </Button>
              {globalLoading && (
                <div className="global-loading-overlay">
                  <Spin size="large" tip="Đang lưu dữ liệu thiết bị..." />
                </div>
              )}
              {!isEditingInUse && (
                <Button
                  type="primary"
                  loading={submitting}
                  className="btn-submit-3d"
                  onClick={() => form.submit()} // <--- QUAN TRỌNG: Kích hoạt onFinish của Form
                >
                  LƯU HỆ THỐNG
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: ASSIGNMENT (Đã fix 3D và Layout) */}
      <Modal
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
        width={1200}
        className="modal-3d-supreme"
        destroyOnHidden
      >
        {/* Cấu trúc cho Icon bay 3D */}
        <div className="modal-floating-icon-container">
          <div className="icon-orbit">
            <div className="particle p1"></div>
            <div className="particle p2"></div>
            <div className="main-icon">
              {selectedAsset ? <EditOutlined /> : <PlusOutlined />}
            </div>
          </div>
        </div>
        <div className="modal-body-3d">
          <Row gutter={32}>
            <Col span={10} className="asset-info-sidebar">
              <div className="asset-card-3d">
                <div className="asset-card-glow"></div>
                <Text type="secondary" className="asset-label-mini">
                  THIẾT BỊ ĐANG CHỌN
                </Text>

                <div className="asset-image-placeholder">
                  <DesktopOutlined />
                </div>

                <Title level={4} className="asset-model-name">
                  {viewingAsset?.modelName}
                </Title>

                <div className="asset-tag-container">
                  <span className="asset-tag-badge">
                    {viewingAsset?.assetTag}
                  </span>
                </div>

                <div className="asset-detail-specs">
                  <div className="spec-item">
                    <Text type="secondary">Số hiệu:</Text>
                    <Text strong>{viewingAsset?.serial || "N/A"}</Text>
                  </div>

                  {/* THÊM TRƯỜNG THÔNG SỐ KỸ THUẬT TẠI ĐÂY */}
                  <div
                    className="spec-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 4,
                    }}
                  >
                    <Text type="secondary">Thông số kỹ thuật:</Text>
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "8px",
                        borderRadius: "6px",
                        width: "100%",
                        border: "1px inset rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Text style={{ fontSize: "13px", color: "#0872f4" }}>
                        {viewingAsset?.specs || "Chưa cập nhật thông số"}
                      </Text>
                    </div>
                  </div>

                  <div className="spec-item">
                    <Text type="secondary">Trạng thái:</Text>
                    <Tag color="green" className="status-tag-3d">
                      Sẵn sàng
                    </Tag>
                  </div>
                </div>
              </div>
            </Col>

            <Col span={14}>
              <Title level={5} className="input-label-3d">
                VỊ TRÍ BÀN GIAO
              </Title>
              <Select
                showSearch
                placeholder="--- Vị trí bàn giao ---"
                className="select-3d"
                style={{ width: "100%", marginBottom: 20 }}
                onChange={(val) => setSelectedLocationName(val)} // val bây giờ là string
                value={selectedLocationName}
              >
                {locations.map((loc: Location) => (
                  <Option key={loc.id} value={loc.locationName}>
                    {" "}
                    {/* Gán value là Name */}
                    {loc.locationName}
                  </Option>
                ))}
              </Select>

              <Title level={5} className="input-label-3d">
                NHÂN VIÊN TIẾP NHẬN
              </Title>
              <Input
                className="input-3d"
                prefix={<SearchOutlined />}
                placeholder="Nhập tên hoặc ID nhân viên..."
                value={empSearchText}
                onChange={handleSearchChange}
                allowClear
                // Ép buộc Input luôn nằm trên và nhận tương tác
                style={{
                  pointerEvents: "auto",
                  position: "relative",
                  zIndex: 10,
                }}
              />

              {/* Danh sách nhân viên có scroll */}
              <div
                style={{ maxHeight: "350px", overflowY: "auto", marginTop: 15 }}
                onScroll={handleListScroll}
                className="custom-scrollbar"
              >
                <List
                  dataSource={employees}
                  renderItem={(emp) => (
                    <List.Item
                      className="glass-row-3d"
                      onClick={() => onAssignSubmit(emp, selectedLocationName)}
                      style={{
                        cursor: globalLoading ? "not-allowed" : "pointer",
                        opacity: globalLoading ? 0.6 : 1,
                      }}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={emp.fullName}
                        description={`${emp.employeeId} | ${emp.department}`}
                      />
                      <div className="assign-action-3d">
                        <Text
                          type="secondary"
                          style={{ fontSize: "11px", marginRight: 10 }}
                        >
                          BÀN GIAO
                        </Text>
                        <ArrowRightOutlined
                          style={{ color: "#3b82f6", marginRight: 50 }}
                          spin={globalLoading} // Mũi tên tự động xoay tròn khi đang load
                        />
                      </div>
                    </List.Item>
                  )}
                />

                {/* Hiệu ứng loading khi cuộn thêm */}
                {loading && (
                  <div style={{ textAlign: "center", padding: "10px" }}>
                    {empLoading && <Spin size="small" />}
                  </div>
                )}

                {!hasMore && employees.length > 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "12px",
                      marginTop: "10px",
                    }}
                  >
                    — Đã hiển thị tất cả —
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>
        {globalLoading && (
          <div className="global-loading-overlay">
            <Spin
              size="large"
              tip="Đang tiến hành bàn giao, vui lòng không đóng trình duyệt..."
            />
          </div>
        )}
      </Modal>
      {/* MODAL: QR SCAN & DETAIL */}
      <Modal
        open={qrScanModalOpen}
        onCancel={() => {
          setQrScanModalOpen(false);
          stopQrScanner();
        }}
        footer={null}
        width={1120}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>

          {/* Cấu trúc cho Icon bay 3D */}
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                {selectedAsset ? <EditOutlined /> : <PlusOutlined />}
              </div>
            </div>
          </div>

          <div className="modal-body-3d" style={{ padding: "20px 30px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Quét QR để xem chi tiết
                </Title>
              </div>
            </div>

            <Row gutter={24}>
              <Col span={15}>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 20,
                    padding: 18,
                    minHeight: 420,
                    position: "relative",
                  }}
                >
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 18,
                      objectFit: "cover",
                      background: "#111",
                    }}
                    muted
                    playsInline
                  />
                  {!isScanning && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      Camera chưa hoạt động
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
                  <Button
                    type="primary"
                    icon={<CameraOutlined />}
                    onClick={startQrScanner}
                    className="btn-submit-3d"
                    disabled={isScanning}
                  >
                    {isScanning ? "Đang hoạt động..." : "Bắt đầu quét"}
                  </Button>
                  {/* {isScanning && (
                    <Button danger onClick={stopQrScanner}>Dừng Scanner</Button>
                  )} */}
                </div>
              </Col>

              <Col span={9}>
                <QrDetailView
                  asset={scannedAsset}
                  scannedText={scannedText}
                  scanError={scanError}
                  onRetry={handleScanSearch}
                  onRevoke={handleQrRevoke}
                  // --- THÊM DÒNG NÀY ---
                  onAssign={(asset) => {
                    // 1. Đóng modal quét QR (tùy chọn, thường là đóng để mở modal tiếp theo)
                    setQrScanModalOpen(false);
                    stopQrScanner();

                    // 2. Gọi hàm mở modal Checkout từ trang chính của bạn
                    handleOpenAssign(asset);
                  }}
                />
              </Col>
            </Row>

            <div
              className="modal-actions-3d"
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                className="btn-cancel-3d"
                onClick={() => {
                  setQrScanModalOpen(false);
                  stopQrScanner();
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: QR CODE VIEW */}
      <Modal
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={null}
        width={400}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>

          {/* Cấu trúc cho Icon bay 3D */}
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                {selectedAsset ? <EditOutlined /> : <PlusOutlined />}
              </div>
            </div>
          </div>

          <div
            className="modal-body-3d"
            style={{ textAlign: "center", padding: "30px 20px" }}
          >
            <Title level={4} style={{ marginBottom: 5 }}>
              QR ASSET TAG
            </Title>
            <Text type="secondary">{viewingAsset?.modelName}</Text>

            <div>
              <QRCodeCanvas
                id="qr-gen"
                value={qrValue}
                size={200}
                level={"H"}
                includeMargin={true}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <Tag
                color="blue"
                style={{
                  fontSize: "11px",
                  padding: "4px 12px",
                  borderRadius: "8px",
                }}
              >
                {viewingAsset?.serial}
              </Tag>
            </div>
            <div style={{ marginTop: "20px" }}>
              <Tag
                color="purple"
                style={{
                  fontSize: "14px",
                  padding: "4px 12px",
                  borderRadius: "8px",
                }}
              >
                {viewingAsset?.assignedTo ?? "Chưa gán nhân sự"}
              </Tag>
            </div>
            <div
              style={{
                marginTop: 12,
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                URL chi tiết:
              </Text>
              <div style={{ marginTop: 6 }}>
                <Text copyable style={{ fontSize: 12, color: "#1f2937" }}>
                  {qrValue}
                </Text>
              </div>
            </div>

            <div
              className="modal-actions-3d"
              style={{ marginTop: 30, display: "flex", gap: 12 }}
            >
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={handlePrintQR}
                className="btn-submit-3d"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                }}
              >
                TẢI MÃ QR
              </Button>
              <Button
                className="btn-cancel-3d"
                onClick={() => setQrModalOpen(false)}
              >
                ĐÓNG
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <AssignMultipleModal
        open={multiAssignOpen}
        onCancel={() => setMultiAssignOpen(false)}
        onSuccess={() => {
          setMultiAssignOpen(false);
          loadData(pagination.current, searchText, statusFilter);
        }}
      />
      <AssetNoteModal
        visible={isNoteModalOpen}
        asset={selectedAsset}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={updateNoteApi}
      />

      {/* MODAL: CHI TIẾT THIẾT BỊ */}
      <Modal
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={700}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                <EyeOutlined />
              </div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>VINATECH VINA SYSTEM</span>
              <Title level={3}>CHI TIẾT THIẾT BỊ</Title>
            </div>

            {detailAsset && (
              <>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: "#f8fafc", borderRadius: 12 }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Phân loại
                      </Text>
                      <div
                        style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}
                      >
                        {detailAsset.modelName || "N/A"}
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: "#f8fafc", borderRadius: 12 }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Tag
                      </Text>
                      <div
                        style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}
                      >
                        {detailAsset.assetTag || "N/A"}
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: "#f8fafc", borderRadius: 12 }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Serial Number
                      </Text>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          marginTop: 4,
                          color: "#f02e1d",
                        }}
                      >
                        {detailAsset.serial || "N/A"}
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: "#f8fafc", borderRadius: 12 }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Vị trí
                      </Text>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          marginTop: 4,
                          color: "#0891b2",
                        }}
                      >
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        {detailAsset.location || "N/A"}
                      </div>
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                  <Card
                    size="small"
                    bordered={false}
                    style={{ background: "#f8fafc", borderRadius: 12 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Trạng thái
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          {(() => {
                            const cfg = statusConfig[detailAsset.status] || {
                              label: detailAsset.status?.toUpperCase(),
                              color: "#64748b",
                            };
                            return (
                              <Tag
                                color={cfg.color}
                                style={{
                                  borderRadius: 8,
                                  fontWeight: 700,
                                  fontSize: 12,
                                  textTransform: "uppercase",
                                }}
                              >
                                {cfg.label}
                              </Tag>
                            );
                          })()}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Người sử dụng
                        </Text>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            marginTop: 4,
                          }}
                        >
                          {detailAsset.assignedTo
                            ? `${detailAsset.assignedToId} - ${detailAsset.assignedTo}`
                            : "Chưa gán"}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div style={{ marginTop: 16 }}>
                  <Card
                    size="small"
                    bordered={false}
                    style={{ background: "#f8fafc", borderRadius: 12 }}
                  >
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Cấu hình
                    </Text>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 13,
                        marginTop: 4,
                        color: "#334155",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {detailAsset.specs || "Chưa cập nhật thông số"}
                    </div>
                  </Card>
                </div>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: "#f8fafc", borderRadius: 12 }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Ngày mua
                      </Text>
                      <div
                        style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}
                      >
                        <CalendarOutlined
                          style={{ marginRight: 4, color: "#94a3b8" }}
                        />
                        {detailAsset.purchaseDate
                          ? dayjs(detailAsset.purchaseDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: "#f8fafc", borderRadius: 12 }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Bảo hành đến
                      </Text>
                      <div
                        style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}
                      >
                        <SafetyCertificateOutlined
                          style={{ marginRight: 4, color: "#94a3b8" }}
                        />
                        {detailAsset.warrantyExpiry
                          ? dayjs(detailAsset.warrantyExpiry).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </div>
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                  <Card
                    size="small"
                    bordered={false}
                    style={{ background: "#f8fafc", borderRadius: 12 }}
                  >
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Ghi chú
                    </Text>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 13,
                        marginTop: 4,
                        color: "#334155",
                      }}
                    >
                      {detailAsset.note
                        ? parse(detailAsset.note)
                        : "Chưa có ghi chú"}
                    </div>
                  </Card>
                </div>
              </>
            )}

            <div
              className="modal-actions-3d"
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                className="btn-cancel-3d"
                onClick={() => setIsDetailModalOpen(false)}
              >
                ĐÓNG
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HardwareAssetList;
