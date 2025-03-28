"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUserData } from "../../../hooks/useUserData";
import { useUser } from "../../../context/UserContext";
import ReactMarkdown from "react-markdown";
import { storeOrIncrementScore } from "../../../lib/storeOrIncrementScore";
import { db } from "../../../lib/firebaseConfig";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBox() {
  const { userClass, loading: userDataLoading } = useUserData();
  const { userId } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const chatboxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          mode: "cours_anglais",
          conversationHistory: messages
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n"),
          userClass: userClass,
          userId: userId,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      // Exemple de logique de scoring
      if (/1 point/i.test(data.response) && userId) {
        await storeOrIncrementScore(db, userId, "chat", 1);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, je n'ai pas pu traiter votre demande.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  // Fonction pour gérer le changement de fichier et son upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok)
          throw new Error("Erreur lors de l'upload du fichier");
        const data = await response.json();

        // Création d'un message contenant le lien du document partagé
        const fileMessage: Message = {
          role: "user",
          content: `Document partagé: [${file.name}](${data.url})`,
        };
        setMessages((prevMessages) => [...prevMessages, fileMessage]);
      } catch (error) {
        console.error("Erreur lors de l'envoi du fichier", error);
      }
    }
  };

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-white/80 p-4 rounded shadow-lg mt-4">
      <h2 className="text-xl font-bold mb-4 text-blue-600">
        Chattez avec votre professeur d'anglais
      </h2>
      <div
        ref={chatboxRef}
        className="h-96 overflow-y-auto mb-4 p-2 border rounded"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded ${
              message.role === "user"
                ? "bg-blue-100 text-blue-800 text-right"
                : "bg-gray-100 text-gray-800 text-left"
            }`}
          >
            {message.role === "assistant" ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Posez votre question..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Envoyer
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ml-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Partager un document
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
