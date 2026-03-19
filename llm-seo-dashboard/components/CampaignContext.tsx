"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Campaign {
    id: number;
    name: string;
    url: string;
}

interface CampaignContextType {
    campaigns: Campaign[];
    selectedCampaignId: number | null;
    setSelectedCampaignId: (id: number | null) => void;
    refreshCampaigns: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType>({
    campaigns: [],
    selectedCampaignId: null,
    setSelectedCampaignId: () => { },
    refreshCampaigns: async () => { },
});

export const CampaignProvider = ({ children }: { children: React.ReactNode }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignIdState] = useState<number | null>(null);

    const refreshCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns");
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setCampaigns(data);
            } else {
                console.error("API error fetching campaigns:", data.error || "Unknown error");
                setCampaigns([]);
            }

            // Auto-select the first campaign if none is selected
            if (Array.isArray(data) && data.length > 0) {
                const saved = localStorage.getItem("llm-seo-campaign-id");
                if (saved && data.find((c: Campaign) => c.id === parseInt(saved))) {
                    setSelectedCampaignIdState(parseInt(saved));
                } else if (!selectedCampaignId) {
                    setSelectedCampaignIdState(data[0].id);
                    localStorage.setItem("llm-seo-campaign-id", data[0].id.toString());
                }
            }
        } catch (e) {
            console.error("Failed to fetch campaigns");
        }
    };

    useEffect(() => {
        refreshCampaigns();
    }, []);

    const setSelectedCampaignId = (id: number | null) => {
        setSelectedCampaignIdState(id);
        if (id) {
            localStorage.setItem("llm-seo-campaign-id", id.toString());
        } else {
            localStorage.removeItem("llm-seo-campaign-id");
        }
    };

    return (
        <CampaignContext.Provider value={{ campaigns, selectedCampaignId, setSelectedCampaignId, refreshCampaigns }}>
            {children}
        </CampaignContext.Provider>
    );
};

export const useCampaign = () => useContext(CampaignContext);