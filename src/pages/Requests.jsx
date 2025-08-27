"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/styles.css";
import LottieLoading from "../components/Loading";

function Requests() {
  const [todayRequests, setTodayRequests] = useState([]);
  const [pastRequests, setPastRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const openReplyModal = (telegramUserId, requestId) => {
    setCurrentUserId(telegramUserId);
    setCurrentRequestId(requestId);
    setReplyMessage("");
    setIsModalOpen(true);
  };

  function formatTime(isoDate) {
    const date = new Date(isoDate);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function formatDateTime(isoDate) {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const todayResponse = await fetch(`${import.meta.env.VITE_API_URL}/get_appeals`);
      let todayData = [];
      if (todayResponse.ok) {
        todayData = await todayResponse.json();
      } else if (todayResponse.status === 404) {
        toast.info("Bugun hech qanday murojaat kelib tushmagan", { position: "top-right", autoClose: 3000 } )

      } else {
        throw new Error("Bugungi murojaatlarni olishda xatolik");
      }
  
      const allResponse = await fetch(`${import.meta.env.VITE_API_URL}/get_last_ten_day_appeals`);
      let allData = [];
      if (allResponse.ok) {
        allData = await allResponse.json();
      } else if (allResponse.status === 404) {
        toast.info("Oxirgi 10 kunda murojaat yo'q", { position: "top-right", autoClose: 2000 } )
      } else {
        throw new Error("Oxirgi 10 kunlik murojaatlarni olishda xatolik");
      }
  
      setTodayRequests(Array.isArray(todayData) ? todayData : []);
      const today = new Date().toDateString();
      const pastData = Array.isArray(allData)
        ? allData.filter(
            (request) => new Date(request.created_at).toDateString() !== today
          )
        : [];
      setPastRequests(pastData);
    } catch (err) {
      console.error("API xatosi:", err);
      setTodayRequests([]);
      setPastRequests([]);
      setError("Ma‘lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) return alert("Xabar bo‘sh bo‘lmasligi kerak");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/send_telegram_message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId,
          requestId: currentRequestId,
          message: replyMessage,
        }),
      });

      if (response.ok) {
        setSuccess("Xabar yuborildi");
        toast.success("O'quvchiga to'lov qilishi lozimligi haqida xabar yuborildi!", { position: "top-right", autoClose: 3000 });
        setIsModalOpen(false);
        fetchRequests(); // Ma'lumotlarni yangilash
      } else {
        alert("Xabar yuborishda xatolik bo‘ldi");
      }
    } catch (err) {
      toast.error("Server bilan bog‘lanib bo‘lmadi", { position: "top-right", autoClose: 3000 });
      console.error(err);
    }
  };

  const deleteRequest = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/delete_appeal/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Murojaatni o'chirishda muammo yuzaga keldi!");
      
      // Mahalliy yangilash
      setTodayRequests((prev) => prev.filter((req) => req.id !== id));
      setPastRequests((prev) => prev.filter((req) => req.id !== id));
      
      toast.success("Murojaat muvaffaqiyatli o'chirib tashlandi!", { position: "top-right", autoClose: 3000 });
    } catch (err) {
      setError("Murojaatni o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!");
      toast.error("Murojaatni o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!", { position: "top-right", autoClose: 3000 });
      console.error(err);
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Diqqat! Ushbu murojaatga tegishli barcha ma'lumotlar o'chiriladi! O'chirishga ishonchingiz komilmi?</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            style={{
              padding: "15px 22px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => {
              deleteRequest(id);
              toast.dismiss();
            }}
          >
            O'chirish
          </button>
          <button
            style={{
              padding: "8px 16px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => toast.dismiss()}
          >
            Bekor qilish
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  const filterRequests = (requests) => {
    if (!Array.isArray(requests)) {
      return [];
    }
  
    let filtered = [...requests];
  
    // Sana bo‘yicha filtrlash
    if (selectedDate) {
      filtered = filtered.filter((request) => {
        const requestDate = new Date(request.created_at).toISOString().split("T")[0];
        return requestDate === selectedDate;
      });
    }
  
    // Javob holati bo‘yicha filtrlash
    if (filterStatus === "answered") {
      filtered = filtered.filter((request) => request.answer);
    } else if (filterStatus === "unanswered") {
      filtered = filtered.filter((request) => !request.answer);
    }
  
    return filtered;
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return <LottieLoading />
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <MessageSquare size={24} color="#104292"/>
        <h1 className="text-2xl font-bold">Murojaatlar</h1>
      </div>
      <ToastContainer/>
      {/* Filtrlash paneli */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid blue", marginLeft: "20px", marginTop: "20px" }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", cursor: "pointer", border: "1px solid blue", marginTop: "20px" }}
        >
          <option value="all">Barcha murojaatlar</option>
          <option value="answered">Javob berilganlar</option>
          <option value="unanswered">Javob berilmaganlar</option>
        </select>
      </div>

      {/* Today's Requests */}
      <div className="card">
        <h3 style={{ marginBottom: "20px", fontWeight: "bold" }}>
          Bugungi murojaatlar ({filterRequests(todayRequests).length ? `${filterRequests(todayRequests).length} ta` : 0})
        </h3>

        {filterRequests(todayRequests).length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            Bugun murojaatlar yo‘q
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>№</th>
                <th>F.I.Sh.</th>
                <th>Telefon</th>
                <th>Xabar</th>
                <th>Kelgan vaqti</th>
                <th>Javob</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filterRequests(todayRequests).map((request, index) => (
                <tr
                  key={request?.id}
                  className={request?.answer ? "answered-row" : "unanswered-row"}
                >
                  <td>{index + 1}</td>
                  <td>{`${request?.student?.first_name} ${request?.student?.last_name}`}</td>
                  <td>{request?.student?.phone_number}</td>
                  <td style={{ maxWidth: "300px" }}>{request?.message}</td>
                  <td style={{ maxWidth: "300px" }}>{request?.created_at ? `${formatTime(request?.created_at)} da` : "-"}</td>
                  <td style={{ maxWidth: "300px" }}>{request?.answer ? request.answer : "-"}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => openReplyModal(request?.telegram_user_id, request?.id)}
                      style={{ marginRight: "6px", padding: "4px 8px" }}
                    >
                      {!request.answer ? "Javob yozish" : "Qayta yozish"}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteRequest(request?.id, true)}
                      style={{ padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Past Requests */}
      <div className="card">
        <h3 style={{ marginBottom: "20px", fontWeight: "bold" }}>
          Kecha va undan oldingi barcha murojaatlar ({filterRequests(pastRequests).length !== 0 ? `${filterRequests(pastRequests).length} ta` : 0})
        </h3>

        {filterRequests(pastRequests).length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            Kecha va undan oldin murojaat qilinmagan...
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>№</th>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Xabar</th>
                <th>Sana</th>
                <th>Javob</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filterRequests(pastRequests).map((request, index) => (
                <tr
                  key={request?.id}
                  className={request?.answer ? "answered-row" : "unanswered-row"}
                >
                  <td>{index + 1}</td>
                  <td>{`${request?.student?.first_name} ${request?.student?.last_name}`}</td>
                  <td>{request?.student?.phone_number}</td>
                  <td style={{ maxWidth: "300px" }}>{request?.message}</td>
                  <td style={{ maxWidth: "300px" }}>{request?.created_at ? `${formatDateTime(request?.created_at)}` : "-"}</td>
                  <td style={{ maxWidth: "300px" }}>{request?.answer ? request?.answer : "-"}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => openReplyModal(request?.telegram_user_id, request?.id)}
                      style={{ marginRight: "6px", padding: "4px 8px" }}
                    >
                      {!request.answer ? "Javob yozish" : "Qayta yozish"}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => showDeleteToast(request?.id)}
                      style={{ padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Telegramga javob yozish</h3>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows="5"
              style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
              placeholder="Xabaringizni kiriting..."
            ></textarea>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Bekor qilish
              </button>
              <button className="btn btn-primary" onClick={sendReply}>
                Yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Requests;