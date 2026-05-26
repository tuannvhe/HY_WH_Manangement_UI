import React, { useState, useRef, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import axioClient from "../axiosClient";
import "../CSS/Chatbot.css";

interface Message {
  text: string;
  isUser: boolean;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Xin chào! Tôi là trợ lý kho Vinatech. Bạn cần kiểm tra gì?",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false); // Theo dõi trạng thái kết nối

  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const MAX_RETRIES = 5;
  let retryCount = 0;
  useEffect(() => {
    // 1. Lấy baseURL từ axios (ví dụ: https://localhost:7001/api)
    const axiosBase = axioClient.defaults.baseURL || "";

    // 2. Chuyển thành đối tượng URL để xử lý cho chuẩn
    const urlObj = new URL(axiosBase);

    // 3. Lấy Origin (Protocol + Host + Port) và cộng với /chatHub
    // Ví dụ: https://localhost:7001/chatHub
    const hubUrl = `${urlObj.origin}/chatHub`;

    //console.log("Mục tiêu kết nối SignalR:", hubUrl); // Kiểm tra log này trong Console

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl) // KHÔNG dùng skipNegotiation khi đang debug lỗi 404
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, []);

  // 2. Start Connection và đăng ký lắng nghe
  useEffect(() => {
    if (!connection) return;

    const startSocket = async () => {
      try {
        await connection.start();
        //console.log("SignalR Connected. ID:", connection.connectionId);
        setIsSocketConnected(true);

        // Lắng nghe Chunk (Streaming)
        connection.on("ReceiveChunk", (chunk: string) => {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && !lastMsg.isUser) {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                text: lastMsg.text + chunk,
              };
              return newMessages;
            } else {
              return [...prev, { text: chunk, isUser: false }];
            }
          });
        });

        // Lắng nghe toàn bộ Message (Nếu dùng SendAsync thông thường)
        connection.on("ReceiveMessage", (msg: string) => {
          setMessages((prev) => [...prev, { text: msg, isUser: false }]);
          setLoading(false);
        });

        connection.on("EndMessage", () => setLoading(false));
      } catch (err) {
        setIsSocketConnected(false);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(startSocket, 5000 * retryCount); // backoff tăng dần
        }
      }
    };

    startSocket();

    connection.onreconnecting(() => setIsSocketConnected(false));
    connection.onreconnected(() => setIsSocketConnected(true));

    return () => {
      connection.off("ReceiveChunk");
      connection.off("ReceiveMessage");
      connection.off("EndMessage");
    };
  }, [connection]);

  // Tự động cuộn
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async () => {
    // Kiểm tra điều kiện: Phải có connectionId mới cho gửi
    if (
      !input.trim() ||
      loading ||
      !isSocketConnected ||
      !connection?.connectionId
    ) {
      //console.error("Socket chưa sẵn sàng.");
      return;
    }

    const userMsg = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Gửi request tới API Backend
      await axioClient.post(
        "AiAssistant/ask",
        {
          message: currentInput,
          connectionId: connection.connectionId,
        },
        { signal: controller.signal },
      );
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setMessages((prev) => [
          ...prev,
          { text: "Hệ thống gặp sự cố, vui lòng thử lại.", isUser: false },
        ]);
        setLoading(false);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="vnt-chatbot-wrapper">
      {isOpen && (
        <div className="vnt-chat-box">
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className={`status-dot ${isSocketConnected ? "online" : "offline"} ${loading ? "typing" : ""}`}
              ></div>
              <span>Trợ lý kho VINATech VINA</span>
            </div>
            <span className="close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </span>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.isUser ? "user" : "bot"}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="msg bot loading-text">
                <span>...</span>
              </div>
            )}
          </div>

          <div className="chat-footer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                isSocketConnected ? "Nhập nội dung..." : "Đang kết nối lại..."
              }
              disabled={!isSocketConnected || loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !isSocketConnected || loading}
            >
              {loading ? "..." : "Gửi"}
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="vnt-chat-trigger" onClick={() => setIsOpen(true)}>
          Trợ lý ảo {!isSocketConnected && " (Đang kết nối...)"}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
