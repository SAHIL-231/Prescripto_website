import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import jsPDF from "jspdf";

const MyAppointments = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState("");
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);
  const [pdfReceipts, setPdfReceipts] = useState({});

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return `${dateArray[0]} ${months[Number(dateArray[1])]} ${dateArray[2]}`;
  };

  const getUserAppointments = async () => {
    if (!token) {
      toast.error("You must be logged in to view your appointments.");
      navigate("/login"); // Redirect to login if no token
      return;
    }

    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppointments(data.appointments.reverse());
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error(error.message || "Failed to fetch appointments.");
      }
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to cancel appointment.");
    }
  };

  const generatePdfReceipt = (receiptData) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(" Appointment Receipt", 20, 20);

    // Line separator
    doc.setDrawColor(180);
    doc.line(20, 25, 190, 25);

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);

    // Appointment Info
    let y = 40;
    const lineSpacing = 10;

    const fields = [
      { label: "Appointment ID", value: receiptData.appointmentId },
      { label: "Patient Name", value: receiptData.patientName },
      { label: "Doctor Name", value: receiptData.doctorName },
      { label: "Date", value: receiptData.appointmentDate },
      { label: "Time", value: receiptData.appointmentTime },
    ];

    fields.forEach(({ label, value }) => {
      doc.setFont(undefined, "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont(undefined, "normal");
      doc.text(`${value}`, 70, y);
      y += lineSpacing;
    });

    // Footer with logo
    y += 10;
    doc.setDrawColor(220);
    doc.line(20, y, 190, y);

    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Thank you for booking your appointment with us!", 20, y);

    // Add Prescripto logo at the bottom (assuming logo is inside 'public/assets' folder)
    const logoBase64 =
      "data:image/png;base64,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"; // Replace with actual base64 image string
    doc.addImage(logoBase64, "PNG", 20, y + 20, 40, 15); // Adjust position and size

    return doc.output("blob");
  };

  const downloadReceipt = (appointmentId) => {
    const pdfBlob = pdfReceipts[appointmentId];
    if (pdfBlob) {
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `appointment-receipt-${appointmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      toast.error("Receipt not available.");
    }
  };

  const simulatePayment = async (appointment) => {
    setLoadingPaymentId(appointment._id);

    setTimeout(() => {
      const receiptData = {
        appointmentId: appointment._id,
        patientName: appointment.userData.name,
        doctorName: appointment.docData.name,
        appointmentDate: slotDateFormat(appointment.slotDate),
        appointmentTime: appointment.slotTime,
      };

      const pdf = generatePdfReceipt(receiptData);

      setPdfReceipts((prev) => ({
        ...prev,
        [appointment._id]: pdf,
      }));

      toast.success("Appointment booked successfully (Simulated)");

      const url = window.URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `appointment-receipt-${appointment._id}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointment._id ? { ...a, payment: true } : a
        )
      );

      setLoadingPaymentId(null);
    }, 2000);
  };

  useEffect(() => {
    getUserAppointments();
  }, []);

  return (
    <div>
      <p className="pb-3 mt-12 text-lg font-medium text-gray-600 border-b">
        My appointments
      </p>

      {appointments.map((item) => (
        <div
          key={item._id}
          className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b"
        >
          <div>
            <img
              className="w-36 bg-[#EAEFFF]"
              src={item.docData.image}
              alt=""
            />
          </div>

          <div className="flex-1 text-sm text-[#5E5E5E]">
            <p className="text-[#262626] text-base font-semibold">
              {item.docData.name}
            </p>
            <p>{item.docData.speciality}</p>
            <p className="text-[#464646] font-medium mt-1">Address:</p>
            <p>{item.docData.address.line1}</p>
            <p>{item.docData.address.line2}</p>
            <p className="mt-1">
              <span className="text-sm text-[#3C3C3C] font-medium">
                Date & Time:
              </span>{" "}
              {slotDateFormat(item.slotDate)} | {item.slotTime}
            </p>
          </div>

          <div className="flex flex-col gap-2 justify-end text-sm text-center">
            {!item.cancelled &&
              !item.payment &&
              !item.isCompleted &&
              payment !== item._id && (
                <button
                  onClick={() => setPayment(item._id)}
                  className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Pay Online
                </button>
              )}

            {!item.cancelled &&
              !item.payment &&
              !item.isCompleted &&
              payment === item._id && (
                <button
                  onClick={() => simulatePayment(item)}
                  className="relative text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  {loadingPaymentId === item._id ? (
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  ) : (
                    <img
                      className="max-w-20 max-h-5"
                      src={assets.razorpay_logo}
                      alt="Razorpay"
                    />
                  )}
                </button>
              )}

            {!item.cancelled && item.payment && (
              <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                Paid
              </button>
            )}

            {item.isCompleted && (
              <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                Completed
              </button>
            )}

            {!item.cancelled && !item.isCompleted && (
              <button
                onClick={() => cancelAppointment(item._id)}
                className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                Cancel appointment
              </button>
            )}

            {item.cancelled && !item.isCompleted && (
              <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                Appointment cancelled
              </button>
            )}

            {pdfReceipts[item._id] && (
              <button
                onClick={() => downloadReceipt(item._id)}
                className="text-blue-600 underline mt-2"
              >
                Download Receipt
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyAppointments;
