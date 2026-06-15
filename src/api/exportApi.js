import { API_URL } from "../conf/api";

/**
 * Backend export endpointidan XLSX faylni (blob) yuklab olib,
 * brauzerda saqlash oynasini ishga tushiradi.
 *
 * @param {string} path   - endpoint yo'li, masalan "/export/students"
 * @param {object} params - query parametrlar (branch_id, group_id, month ...)
 * @param {string} fallbackName - server fayl nomi bermasa ishlatiladigan nom
 */
export async function downloadExport(path, params = {}, fallbackName = "export.xlsx") {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const qs = query.toString();
  const url = `${API_URL}${path}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    let message = "Faylni yuklab olishda xatolik yuz berdi";
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // javob JSON bo'lmasligi mumkin — standart xabarni qoldiramiz
    }
    throw new Error(message);
  }

  const blob = await res.blob();

  // Fayl nomini Content-Disposition'dan olishga harakat qilamiz
  let filename = fallbackName;
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  if (match && match[1]) filename = match[1];

  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

/**
 * Export sahifasidagi filtrlar uchun filiallar va guruhlar ro'yxatini oladi.
 */
export async function getExportFilters() {
  const res = await fetch(`${API_URL}/export/filters`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Filtrlarni olishda xatolik yuz berdi");
  }

  return res.json();
}
