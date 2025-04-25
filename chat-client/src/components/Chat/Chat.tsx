import React, { useEffect, useState } from "react";
import api from "../../api";
import "./MessageList.css";

const Chat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await api.get("/messages");
      setMessages(response.data);
    };

    fetchMessages();
  }, []);

  const sendMessage = async () => {
    if (input.trim()) {
      await api.post("/messages", { message: input });
      setInput("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Suxch Chat App</h1>
      </div>
      <div className="message-list">
        {messages.map((msg, index) => (
          <div key={index} className="message-item">{msg}</div>
        ))}
      </div>
      <div className="chat-footer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
