import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Bell,
  Globe,
  Moon,
  Sun,
  Save,
  Camera,
  Key,
  LogOut,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import API_URL from "../../conf/api";

export default function Settings() {
  const {
    darkMode,
    language,
    applyTheme,
    applyLanguage,
    changeTheme,
    changeLanguage,
    handleDirectorLogout,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    branch: "",
    avatar: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    debtAlerts: true,
    studentRegistration: true,
    paymentAlerts: true,
    teacherAttendance: true,
    dailyReport: true,
    weeklyReport: true,
  });

  const [errors, setErrors] = useState({});

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "security", label: "Xavfsizlik", icon: Lock },
    { id: "notifications", label: "Bildirishnomalar", icon: Bell },
    { id: "preferences", label: "Sozlamalar", icon: Globe },
  ];

  useEffect(() => {
    fetch(`${API_URL}/director-panel/settings`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((res) => {
        const data = res?.data;

        if (!data) return;

        setProfileData({
          fullName: data.profile?.fullName || "",
          email: data.profile?.email || "",
          phone: data.profile?.phone || "",
          address: data.profile?.address || "",
          branch: data.profile?.branch || "Bosh ofis",
          avatar: data.profile?.avatar || null,
        });

        setNotificationSettings({
          emailNotifications: data.notifications?.emailNotifications ?? true,
          pushNotifications: data.notifications?.pushNotifications ?? true,
          debtAlerts: data.notifications?.debtAlerts ?? true,
          studentRegistration: data.notifications?.studentRegistration ?? true,
          paymentAlerts: data.notifications?.paymentAlerts ?? true,
          teacherAttendance: data.notifications?.teacherAttendance ?? true,
          dailyReport: data.notifications?.dailyReport ?? true,
          weeklyReport: data.notifications?.weeklyReport ?? true,
        });

        if (data.preferences?.language) {
          applyLanguage(data.preferences.language);
        }

        if (data.preferences?.theme) {
          applyTheme(data.preferences.theme === "dark");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Joriy parolni kiriting";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "Yangi parolni kiriting";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Parol kamida 6 belgidan iborat bo'lishi kerak";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Parolni tasdiqlang";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Parollar mos kelmadi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/director-panel/settings/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Xatolik yuz berdi");
      }

      setMessage({
        type: "success",
        text: data?.message || "Profil muvaffaqiyatli yangilandi",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/director-panel/settings/password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Xatolik yuz berdi");
      }

      setMessage({
        type: "success",
        text: data?.message || "Parol muvaffaqiyatli o'zgartirildi",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setErrors({});
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/director-panel/settings/notifications`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notificationSettings),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Xatolik yuz berdi");
      }

      setMessage({
        type: "success",
        text: data?.message || "Sozlamalar saqlandi",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 dark:text-white">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Sozlamalar
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Profil, xavfsizlik va tizim sozlamalarini boshqaring
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-4 rounded-xl p-4 text-sm sm:text-base ${message.type === "success"
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 overflow-x-auto border-b dark:border-gray-700">
        <div className="flex min-w-max gap-2 pb-2 sm:gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3 py-2 text-sm font-medium transition-all sm:px-4 sm:text-base ${activeTab === tab.id
                  ? "border-b-2 border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800 sm:p-6">
        {activeTab === "profile" && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-700/30 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-3xl">
                  {profileData.fullName?.charAt(0)?.toUpperCase() || "D"}
                </div>

                <button
                  type="button"
                  className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-700"
                >
                  <Camera size={16} />
                </button>
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-lg font-semibold sm:text-xl">
                  {profileData.fullName || "Direktor"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Direktor
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 sm:text-sm">
                  {profileData.branch || "Bosh ofis"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
              <InputField
                label="To'liq ism"
                type="text"
                value={profileData.fullName}
                onChange={(e) =>
                  setProfileData({ ...profileData, fullName: e.target.value })
                }
              />

              <InputField
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
              />

              <InputField
                label="Telefon"
                type="text"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
              />

              <InputField
                label="Manzil"
                type="text"
                value={profileData.address}
                onChange={(e) =>
                  setProfileData({ ...profileData, address: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
              >
                <Save size={18} />
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "security" && (
          <form onSubmit={handlePasswordChange} className="mx-auto max-w-xl space-y-5">
            <InputField
              label="Joriy parol"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              error={errors.currentPassword}
            />

            <InputField
              label="Yangi parol"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              error={errors.newPassword}
            />

            <InputField
              label="Yangi parolni tasdiqlang"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              error={errors.confirmPassword}
            />

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
              >
                <Key size={18} />
                {loading ? "Yangilanmoqda..." : "Parolni yangilash"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <NotificationToggle
                label="Yangi o'quvchilar"
                description="Yangi ro'yxatdan o'tganlar haqida"
                checked={notificationSettings.studentRegistration}
                onChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    studentRegistration: checked,
                  })
                }
              />

              <NotificationToggle
                label="To'lovlar"
                description="Yangi to'lovlar haqida"
                checked={notificationSettings.paymentAlerts}
                onChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    paymentAlerts: checked,
                  })
                }
              />

              <NotificationToggle
                label="O'qituvchilar davomati"
                description="O'qituvchilar kelmaganida"
                checked={notificationSettings.teacherAttendance}
                onChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    teacherAttendance: checked,
                  })
                }
              />

              <NotificationToggle
                label="Kunlik hisobot"
                description="Har kuni yakuniy hisobot"
                checked={notificationSettings.dailyReport}
                onChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    dailyReport: checked,
                  })
                }
              />

              <NotificationToggle
                label="Haftalik hisobot"
                description="Har hafta yakuniy hisobot"
                checked={notificationSettings.weeklyReport}
                onChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    weeklyReport: checked,
                  })
                }
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleNotificationUpdate}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
              >
                <Save size={18} />
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-base font-semibold sm:text-lg">Ko'rinish</h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => changeTheme(false)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors sm:text-base ${!darkMode
                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                  <Sun size={18} />
                  Kunduzgi rejim
                </button>

                <button
                  type="button"
                  onClick={() => changeTheme(true)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors sm:text-base ${darkMode
                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                  <Moon size={18} />
                  Tungi rejim
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold sm:text-lg">Til</h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => changeLanguage("uz")}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors sm:text-base ${language === "uz"
                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                  <Globe size={18} />
                  O'zbekcha
                </button>

                <button
                  type="button"
                  onClick={() => changeLanguage("en")}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors sm:text-base ${language === "en"
                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                  <Globe size={18} />
                  English
                </button>
              </div>
            </div>

            <div className="border-t pt-6 dark:border-gray-700">
              <button
                type="button"
                onClick={handleDirectorLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-white transition hover:bg-red-600 sm:w-auto"
              >
                <LogOut size={18} />
                Tizimdan chiqish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, type, value, onChange, error }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-800 sm:text-base ${error ? "border-red-500" : "border-gray-300"
          }`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm sm:text-base">{label}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {description}
        </p>
      </div>

      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
      </label>
    </div>
  );
}