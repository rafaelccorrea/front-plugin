import React, { createContext, useContext, useEffect, useState } from "react";

interface NotificationPreferences {
  soundEnabled: boolean;
  animationEnabled: boolean;
  toastEnabled: boolean;
}

interface NotificationPreferencesContextType {
  preferences: NotificationPreferences;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  toggleSound: () => void;
  toggleAnimation: () => void;
  toggleToast: () => void;
}

const NotificationPreferencesContext = createContext<
  NotificationPreferencesContextType | undefined
>(undefined);

const STORAGE_KEY = "notification-preferences";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  animationEnabled: true,
  toastEnabled: true,
};

/**
 * Provider para gerenciar preferências de notificação do usuário
 * Persiste as preferências no localStorage
 */
export function NotificationPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_PREFERENCES
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar preferências do localStorage ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
        });
      }
    } catch (error) {
      console.warn("Erro ao carregar preferências de notificação:", error);
    }
    setIsLoaded(true);
  }, []);

  // Salvar preferências no localStorage quando mudarem
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.warn("Erro ao salvar preferências de notificação:", error);
      }
    }
  }, [preferences, isLoaded]);

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences,
    }));
  };

  const toggleSound = () => {
    updatePreferences({ soundEnabled: !preferences.soundEnabled });
  };

  const toggleAnimation = () => {
    updatePreferences({ animationEnabled: !preferences.animationEnabled });
  };

  const toggleToast = () => {
    updatePreferences({ toastEnabled: !preferences.toastEnabled });
  };

  const value: NotificationPreferencesContextType = {
    preferences,
    updatePreferences,
    toggleSound,
    toggleAnimation,
    toggleToast,
  };

  return (
    <NotificationPreferencesContext.Provider value={value}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

/**
 * Hook para usar preferências de notificação
 */
export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext);
  if (!context) {
    throw new Error(
      "useNotificationPreferences deve ser usado dentro de NotificationPreferencesProvider"
    );
  }
  return context;
}
