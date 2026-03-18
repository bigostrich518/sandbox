"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface MockModeContextType {
  isMockMode: boolean;
  setIsMockMode: (val: boolean) => void;
}

const MockModeContext = createContext<MockModeContextType>({
  isMockMode: false,
  setIsMockMode: () => {},
});

export const MockModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMockMode, setIsMockModeState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("llm-seo-mock-mode");
    if (saved) {
      setIsMockModeState(JSON.parse(saved));
    }
  }, []);

  const setIsMockMode = (val: boolean) => {
    setIsMockModeState(val);
    localStorage.setItem("llm-seo-mock-mode", JSON.stringify(val));
  };

  return (
    <MockModeContext.Provider value={{ isMockMode, setIsMockMode }}>
      {children}
    </MockModeContext.Provider>
  );
};

export const useMockMode = () => useContext(MockModeContext);
