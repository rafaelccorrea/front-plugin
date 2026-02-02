import { useEffect, useRef } from "react";
import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";

/**
 * Hook para gerenciar som de notificação
 * Cria um som usando Web Audio API
 * Respeita as preferências do usuário
 */
export function useNotificationSound() {
  const { preferences } = useNotificationPreferences();
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);

  // Inicializar AudioContext (fica suspended até primeiro gesto do usuário)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Resumir após primeiro gesto do usuário (exigência do navegador para autoplay)
      const resume = () => {
        if (ctx.state === "suspended") ctx.resume();
      };
      const events = ["click", "touchstart", "keydown"] as const;
      const onGesture = () => {
        resume();
        events.forEach((e) => document.removeEventListener(e, onGesture));
      };
      events.forEach((e) => document.addEventListener(e, onGesture, { once: true, passive: true }));
    } catch (error) {
      console.warn("Web Audio API não disponível:", error);
    }
  }, []);

  /**
   * Reproduzir som de notificação usando Web Audio API
   * Cria uma sequência de tons para um som agradável
   * Respeita a preferência do usuário de desabilitar som
   */
  const playSound = () => {
    // Não reproduzir som se desabilitado nas preferências
    if (!preferences.soundEnabled) return;
    if (!audioContextRef.current || isPlayingRef.current) return;

    const audioContext = audioContextRef.current;
    // Só tocar se o contexto já foi liberado por um gesto do usuário (evita aviso do navegador)
    if (audioContext.state === "suspended") return;

    try {
      isPlayingRef.current = true;
      const now = audioContext.currentTime;

      // Criar oscilador para tom 1 (mais alto)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);

      // Configurar tom 1
      osc1.frequency.value = 800; // Hz
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc1.start(now);
      osc1.stop(now + 0.1);

      // Criar oscilador para tom 2 (mais baixo)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);

      // Configurar tom 2
      osc2.frequency.value = 1200; // Hz
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc2.start(now + 0.1);
      osc2.stop(now + 0.25);

      // Resetar flag após som terminar
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 300);
    } catch (error) {
      console.warn("Erro ao reproduzir som:", error);
      isPlayingRef.current = false;
    }
  };

  return { playSound };
}
