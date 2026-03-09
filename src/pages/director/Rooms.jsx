import React, { useEffect, useState } from "react";
import {
  DoorOpen,
  Users,
  MapPin,
  Search,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import API_URL from "../../conf/api";

export default function RoomsOccupancy() {
  const { t } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [branchStats, setBranchStats] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm) params.append("search", searchTerm);
    if (filterBranch !== "all") params.append("branchId", filterBranch);
    if (selectedDate) params.append("date", selectedDate);

    fetch(`${API_URL}/director-panel/rooms/occupancy?${params.toString()}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((res) => {
        setRooms(res?.data?.rooms || []);
        setBranches(res?.data?.branches || []);
        setSummary(res?.data?.summary || null);
        setBranchStats(res?.data?.branchStats || []);
      })
      .catch((err) => console.error(err));
  }, [searchTerm, filterBranch, selectedDate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "occupied":
        return "text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "available":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "occupied":
        return "Band";
      case "available":
        return "Bo'sh";
      default:
        return status;
    }
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 90) return "text-green-500";
    if (rate >= 70) return "text-yellow-500";
    if (rate > 0) return "text-blue-500";
    return "text-gray-500";
  };

  return (
    <div className="space-y-6 dark:text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Xonalar bandligi
        </h1>

        <div className="flex items-center gap-3 dark:text-white">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border dark:text-white rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Jami xonalar</p>
          <p className="text-2xl font-bold">{summary?.totalRooms ?? 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Band</p>
          <p className="text-2xl font-bold text-green-500">
            {summary?.occupiedRooms ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Bo'sh</p>
          <p className="text-2xl font-bold text-blue-500">
            {summary?.availableRooms ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">O'rtacha bandlik</p>
          <p className="text-2xl font-bold text-purple-500">
            {summary?.avgOccupancy ?? 0}%
          </p>
        </div>
      </div>

      {/* Branch Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {branchStats.map((stat) => (
          <div
            key={stat.branch}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="font-semibold mb-2">{stat.branch}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Jami:</span>
                <span className="font-medium">{stat.totalRooms}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-green-500">Band:</span>
                <span>{stat.occupiedRooms}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-blue-500">Bo'sh:</span>
                <span>{stat.availableRooms}</span>
              </div>

              <div className="mt-2 pt-2 border-t dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span>Bandlik:</span>
                  <span
                    className={`font-bold ${getOccupancyColor(
                      stat.avgOccupancy
                    )}`}
                  >
                    {stat.avgOccupancy}%
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${stat.avgOccupancy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Xona qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Barcha filiallar</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold">Xona {room.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={10} />
                    {room.branch}
                  </p>
                </div>
              </div>

              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  room.status
                )}`}
              >
                {getStatusText(room.status)}
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-sm">
                <Users size={14} className="text-gray-400" />
                <span>Sig'im: {room.capacity} o'rin</span>
              </div>
            </div>

            {room.status === "occupied" && room.currentGroup && (
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl dark:border-green-800 border">
                <p className="font-medium text-sm">{room.currentGroup}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {room.teacher} • {room.time}
                </p>
              </div>
            )}

            {room.nextClass && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl dark:border-blue-800 border">
                <p className="text-xs text-gray-500">Keyingi dars:</p>
                <p className="text-sm">{room.nextClass}</p>
              </div>
            )}

            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Bandlik</span>
                <span
                  className={`font-medium ${getOccupancyColor(
                    room.occupancyRate
                  )}`}
                >
                  {room.occupancyRate}%
                </span>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${room.occupancyRate >= 90
                    ? "bg-green-500"
                    : room.occupancyRate >= 70
                      ? "bg-yellow-500"
                      : room.occupancyRate > 0
                        ? "bg-blue-500"
                        : "bg-gray-400"
                    }`}
                  style={{ width: `${room.occupancyRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}