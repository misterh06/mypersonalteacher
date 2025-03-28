"use client";

import React from "react";
import * as FaIcons from "react-icons/fa";

export default function IconsPage() {
  // Filtrer pour ne garder que les composants fonctionnels (les icônes)
  const icons = Object.entries(FaIcons).filter(
    ([, Icon]) => typeof Icon === "function"
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Tous les icônes FA</h1>
      <div className="grid grid-cols-4 gap-6">
        {icons.map(([name, Icon]) => (
          <div key={name} className="flex flex-col items-center">
            <Icon className="text-4xl" />
            <span className="text-sm mt-2">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
