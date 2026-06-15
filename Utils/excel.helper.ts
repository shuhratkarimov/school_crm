import ExcelJS from "exceljs";
import { Response } from "express";

/**
 * Bitta ustun ta'rifi.
 * header - Excel'da ko'rinadigan sarlavha
 * key    - row obyektidagi kalit
 * width  - ustun kengligi (ixtiyoriy)
 */
export interface SheetColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Bitta varaq (sheet) ta'rifi.
 */
export interface SheetSpec {
  name: string;
  columns: SheetColumn[];
  rows: Record<string, any>[];
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Berilgan varaqlardan XLSX workbook yasab, uni response'ga (download fayl) yozadi.
 * Mavjud kodga aralashmaydi — faqat yangi export endpointlar uchun ishlatiladi.
 */
export async function sendWorkbook(
  res: Response,
  sheets: SheetSpec[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "School CRM";
  workbook.created = new Date();

  for (const spec of sheets) {
    // Excel varaq nomi maksimal 31 belgidan iborat va ba'zi belgilarni qabul qilmaydi
    const safeSheetName =
      (spec.name || "Sheet").replace(/[\\/?*\[\]:]/g, " ").substring(0, 31) ||
      "Sheet";

    const ws = workbook.addWorksheet(safeSheetName);

    ws.columns = spec.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
    }));

    // Sarlavha (header) qatorini bezash
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 24;

    for (const row of spec.rows) {
      ws.addRow(row);
    }

    // Filtr va sarlavhani muzlatib qo'yish (qulay ko'rinish uchun)
    if (spec.columns.length > 0) {
      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: spec.columns.length },
      };
    }
    ws.views = [{ state: "frozen", ySplit: 1 }];
  }

  const safeName = (filename || "export.xlsx").replace(/[^\w.\-]/g, "_");

  res.setHeader("Content-Type", XLSX_MIME);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeName}"`
  );

  await workbook.xlsx.write(res);
  res.end();
}
