import { jsPDF } from 'jspdf/dist/jspdf.es.min.js';
import QRCode from 'qrcode';
import { makeQrDetailUrl } from '../utils/qrUtils';
import { robotoNormalBase64 } from './fonts';

async function loadImageAsDataUrl(candidatePaths: string[]): Promise<{
  dataUrl: string;
  format: string;
} | null> {
  for (const p of candidatePaths) {
    try {
      const res = await fetch(p);
      if (!res.ok) continue;

      const blob = await res.blob();
      const mimeType = blob.type || 'image/png';
      const format = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'JPEG' : 'PNG';

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
      });

      if (!dataUrl.startsWith('data:image')) continue;
      return { dataUrl, format };
    } catch {
      // ignore and try next
    }
  }
  return null;
}

function decodeHtmlEntities(input?: string) {
  if (!input) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = input;
  return txt.value;
}

export async function generateQrPdf(
  assets: any[],
  fileName = 'QRCodes.pdf',
  header?: {
    recipientName?: string;
    department?: string;
    code?: string | number;
    handoverId?: number;
  }
) {
  if (!assets || assets.length === 0) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  let useCustomFont = false;
  try {
    if (robotoNormalBase64 && robotoNormalBase64.length > 100) {
      doc.addFileToVFS('Roboto-Regular.ttf', robotoNormalBase64);
      doc.addFont('Roboto-Regular.ttf', 'RobotoCustom', 'normal');
      doc.setFont('RobotoCustom', 'normal');
      useCustomFont = true;
    }
  } catch {
    useCustomFont = false;
  }

  const setFont = (style: 'normal') => {
    if (useCustomFont) doc.setFont('RobotoCustom', style);
    else doc.setFont('helvetica', style);
  };

  const safeText = (text: string) => {
    if (useCustomFont) return text;
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  };

  const margin = 40;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let currentY = margin;

  const logoResult = await loadImageAsDataUrl(['/logo.png', '/assets/logo.png', '/logoB.png']);

  // --- Header ---
  if (header) {
    if (logoResult) doc.addImage(logoResult.dataUrl, logoResult.format, margin, currentY - 10, 100, 50);
    const textX = logoResult ? margin + 110 : margin;

    setFont('normal');
    doc.setFontSize(13);
    doc.text(safeText(decodeHtmlEntities(header.recipientName) || ''), textX, currentY + 10);

    doc.setFontSize(10);
    doc.text(safeText(`Mã nhân viên: ${header.code ?? 'N/A'}`), textX, currentY + 28);
    doc.text(safeText(`Phòng ban: ${decodeHtmlEntities(header.department) || 'N/A'}`), textX, currentY + 44);

    doc.setDrawColor(200);
    doc.line(margin, currentY + 60, pageW - margin, currentY + 60);
    currentY += 76;
  }

  // --- Layout ---
  const qrBoxSize = 95;
  const qrImgSize = 75;
  const brandH = 22;
  const cardW = 240;
  const cardH = qrBoxSize + brandH;

  const cols = 2;
  const colGap = 25;
  const rowGap = 20;
  const startX = (pageW - (cols * cardW + (cols - 1) * colGap)) / 2;
  let col = 0;

  for (const asset of assets) {
    if (currentY + cardH > pageH - margin) {
      doc.addPage();
      currentY = margin;
      col = 0;
    }

    const cardX = startX + col * (cardW + colGap);
    const cardY = currentY;

    // 1) QR box
    doc.setDrawColor(180, 180, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, qrBoxSize, qrBoxSize, 6, 6, 'FD');

    // 2) QR Content - SỬA: Sử dụng qrValue đã có từ asset, không tạo lại
    try {
      // 🟢 QUAN TRỌNG: Sử dụng qrValue đã được tạo từ bên ngoài
      let qrContent = asset.qrValue;
      
      // Nếu không có qrValue, mới tạo mới (fallback)
      if (!qrContent) {
        console.warn('Asset missing qrValue, creating fallback:', asset);
        
        // Tạo employee từ header nếu có (cho Handover)
        const employee = header ? {
          userId: header.code?.toString() || null,
          name: header.recipientName || null,
          department: header.department || null,
        } : undefined;
        
        qrContent = makeQrDetailUrl(
          {
            id: asset?.id ?? null,
            assetTag: asset?.assetTag ?? '',
            serial: asset?.serial ?? null,
            specs: asset?.specs ?? null,
          },
          employee
        );
      }
      
      console.log('Generating QR with content length:', qrContent.length);
      console.log('QR Content preview:', qrContent.substring(0, 200));
      
      const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1, width: 200 });
      doc.addImage(qrDataUrl, 'PNG', cardX + (qrBoxSize - qrImgSize) / 2, cardY + 5, qrImgSize, qrImgSize);
    } catch (error) {
      console.error('Error generating QR for asset:', asset, error);
      // Fallback: tạo QR với thông tin cơ bản
      try {
        const fallbackContent = makeQrDetailUrl({
          id: asset?.id ?? null,
          assetTag: asset?.assetTag ?? '',
          serial: asset?.serial ?? null,
          specs: asset?.specs ?? null,
        });
        const qrDataUrl = await QRCode.toDataURL(fallbackContent, { margin: 1, width: 200 });
        doc.addImage(qrDataUrl, 'PNG', cardX + (qrBoxSize - qrImgSize) / 2, cardY + 5, qrImgSize, qrImgSize);
      } catch {
        // ignore
      }
    }

    // 3) Serial text
    const serialText = safeText(asset.serial || asset.assetTag || 'N/A');
    setFont('normal');
    doc.setFontSize(6);
    doc.setTextColor(70);
    const serialTW = doc.getTextWidth(serialText);
    doc.text(serialText, cardX + (qrBoxSize - serialTW) / 2, cardY + qrBoxSize - 7);

    // 4) Model name
    const modelX = cardX + qrBoxSize + 15;
    const modelY = cardY + 15;
    const maxTextW = cardW - qrBoxSize - 20;

    setFont('normal');
    doc.setFontSize(7);
    doc.setTextColor(0);
    const modelName = decodeHtmlEntities(asset.modelName || asset.assetName || 'N/A');
    const splitModel = doc.splitTextToSize(safeText(modelName), maxTextW);
    doc.text(splitModel, modelX, modelY);

    // 5) Brand bar
    const brandY = cardY + qrBoxSize;
    doc.setFillColor(83, 74, 183);
    doc.roundedRect(cardX, brandY, qrBoxSize, brandH, 5, 5, 'F');
    doc.rect(cardX, brandY, qrBoxSize, brandH / 2, 'F');

    doc.setTextColor(255);
    setFont('normal');
    doc.setFontSize(8);
    const brandText = 'VINATECH VINA';
    const brandTW = doc.getTextWidth(brandText);
    doc.text(brandText, cardX + (qrBoxSize - brandTW) / 2, brandY + brandH / 2 + 3);

    doc.setTextColor(0);

    col++;
    if (col >= cols) {
      col = 0;
      currentY += cardH + rowGap;
    }
  }

  try {
    doc.save(fileName);
  } catch (saveError) {
    console.error('Lỗi khi lưu PDF:', saveError);
  }
}

export default generateQrPdf;