"use client";

import React, { useState, useRef } from "react";

export default function UploadZone() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileType(file.type);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Erreur lors de l'upload du fichier");
        const data = await response.json();
        setFileUrl(data.url);
      } catch (error) {
        console.error("Erreur lors de l'envoi du fichier", error);
      }
    }
  };

  const renderPreview = () => {
    if (!fileUrl) return null;
    if (fileType?.includes("image")) {
      return <img src={fileUrl} alt="Aperçu du document" className="max-w-full h-auto" />;
    } else if (fileType === "application/pdf") {
      return (
        <iframe src={fileUrl} title="Aperçu du PDF" className="w-full h-96" />
      );
    } else {
      return <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Voir le document</a>;
    }
  };

  return (
    <div className="bg-white/80 p-4 rounded shadow-lg mt-4">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Zone d'upload</h2>
      <div className="mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Choisir un document
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
      {fileUrl && (
        <div>
          <p className="mb-2 font-bold">Aperçu :</p>
          {renderPreview()}
        </div>
      )}
    </div>
  );
}
