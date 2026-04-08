"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { api, type FunContent } from "@/lib/api";

interface FunEngineModalProps {
  open: boolean;
  onClose: () => void;
  energyLevel?: string;
  userId: string;
  sessionActive?: boolean;
  onStatsRefresh?: () => void;
  onBreakStart?: () => void;
  onBreakEnd?: () => void;
}

type Mode = "menu" | "memes" | "video" | "read" | "meditation" | "rest";

export function FunEngineModal({ open, onClose, energyLevel, userId, sessionActive = false, onStatsRefresh, onBreakStart, onBreakEnd }: FunEngineModalProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [loading, setLoading] = useState(false);
  const [memes, setMemes] = useState<FunContent[]>([]);
  const [selectedMeme, setSelectedMeme] = useState<FunContent | null>(null);
  const [currentVideo, setCurrentVideo] = useState<FunContent | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [currentLongread, setCurrentLongread] = useState<FunContent | null>(null);
  const [longreadEnded, setLongreadEnded] = useState(false);
  const [meditationPhase, setMeditationPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [meditationComplete, setMeditationComplete] = useState(false);
  const [meditationTime, setMeditationTime] = useState(0);
  const breakStartedRef = useRef<boolean>(false);
  const t = useTranslations("funEngine");

  const loadMemes = async () => {
    setLoading(true);
    try {
      const uniqueMemes: FunContent[] = [];
      const seenUrls = new Set<string>();
      
      while (uniqueMemes.length < 6) {
        const meme = await api.getFunContent(energyLevel).catch(() => null);
        if (meme && meme.type === "meme" && meme.url && !seenUrls.has(meme.url)) {
          seenUrls.add(meme.url);
          uniqueMemes.push(meme);
        }
        
        if (seenUrls.size > 20) break;
      }
      
      setMemes(uniqueMemes);
    } catch (error) {
      console.error("Failed to load memes:", error);
      setMemes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNextVideo = async () => {
    setLoading(true);
    try {
      const video = await api.getRandomVideo(energyLevel);
      setCurrentVideo(video);
      setVideoEnded(false);
    } catch (error) {
      console.error("Failed to load video:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextLongread = async () => {
    setLoading(true);
    try {
      const longread = await api.getRandomLongread(energyLevel);
      setCurrentLongread(longread);
      setLongreadEnded(false);
    } catch (error) {
      console.error("Failed to load longread:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      breakStartedRef.current = false;
      if (onBreakStart) {
        onBreakStart();
        breakStartedRef.current = true;
      }
    }
  }, [open]);

  useEffect(() => {
    if (mode === "memes" && memes.length === 0) {
      loadMemes();
    } else if (mode === "video" && !currentVideo) {
      loadNextVideo();
    } else if (mode === "read" && !currentLongread) {
      loadNextLongread();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "meditation" && !meditationComplete) {
      const totalDuration = 105;
      const cycleTime = 12;
      
      const interval = setInterval(() => {
        setMeditationTime(prev => {
          const newTime = prev + 1;
          if (newTime >= totalDuration) {
            setMeditationComplete(true);
            clearInterval(interval);
            return totalDuration;
          }
          
          const cyclePosition = newTime % cycleTime;
          if (cyclePosition < 4) {
            setMeditationPhase("inhale");
          } else if (cyclePosition < 6) {
            setMeditationPhase("hold");
          } else {
            setMeditationPhase("exhale");
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [mode, meditationComplete]);

  const handleModeSelect = (newMode: Mode) => {
    setMode(newMode);
    setSelectedMeme(null);
    setVideoEnded(false);
    setLongreadEnded(false);
    setMeditationComplete(false);
    setMeditationTime(0);
  };

  const handleClose = async () => {
    if (breakStartedRef.current) {
      breakStartedRef.current = false;
      try {
        if (onBreakEnd) await onBreakEnd();
        if (onStatsRefresh) onStatsRefresh();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to end break:", error);
        }
      }
    }
    
    setMode("menu");
    setMemes([]);
    setSelectedMeme(null);
    setCurrentVideo(null);
    setVideoEnded(false);
    setCurrentLongread(null);
    setLongreadEnded(false);
    setMeditationComplete(false);
    setMeditationTime(0);
    onClose();
  };

  if (!open) return null;

  const renderMenu = () => (
    <div className="space-y-3">
      <button
        onClick={() => handleModeSelect("memes")}
        className="w-full p-4 rounded-lg border-2 border-border hover:border-purple-start/50 transition-colors text-left font-medium"
      >
        {t("menu.memes")}
      </button>
      <button
        onClick={() => handleModeSelect("video")}
        className="w-full p-4 rounded-lg border-2 border-border hover:border-purple-start/50 transition-colors text-left font-medium"
      >
        {t("menu.video")}
      </button>
      <button
        onClick={() => handleModeSelect("read")}
        className="w-full p-4 rounded-lg border-2 border-border hover:border-purple-start/50 transition-colors text-left font-medium"
      >
        {t("menu.read")}
      </button>
      <button
        onClick={() => handleModeSelect("meditation")}
        className="w-full p-4 rounded-lg border-2 border-border hover:border-purple-start/50 transition-colors text-left font-medium"
      >
        {t("menu.meditation")}
      </button>
      <button
        onClick={() => handleModeSelect("rest")}
        className="w-full p-4 rounded-lg border-2 border-border hover:border-purple-start/50 transition-colors text-left font-medium"
      >
        {t("menu.rest")}
      </button>
    </div>
  );

  const renderMemes = () => {
    if (loading) {
      return <div className="text-center py-12"><p className="text-muted">{t("loading")}</p></div>;
    }

    if (selectedMeme) {
      return (
        <div>
          <h4 className="font-bold mb-3">{selectedMeme.title}</h4>
          <img src={selectedMeme.url} alt={selectedMeme.title} className="w-full rounded-xl" />
          <button
            onClick={() => setSelectedMeme(null)}
            className="mt-4 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-border/50 transition-colors"
          >
            {t("back")}
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {memes.map((meme, idx) => (
          <div
            key={idx}
            className="aspect-square rounded-lg border border-border hover:border-purple-start/50 transition-colors cursor-pointer overflow-hidden"
            onClick={() => setSelectedMeme(meme)}
          >
            <img src={meme.url} alt={meme.title} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  };

  const renderVideo = () => {
    if (loading || !currentVideo) {
      return <div className="text-center py-12"><p className="text-muted">{t("loading")}</p></div>;
    }

    if (videoEnded) {
      return (
        <div className="text-center py-12">
          <p className="text-lg font-semibold mb-6">{t("video.oneMore")}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadNextVideo}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t("video.yes")}
            </button>
            <button
              onClick={() => setMode("menu")}
              className="px-6 py-3 rounded-lg border border-border font-semibold hover:bg-border/50 transition-colors"
            >
              {t("video.no")}
            </button>
          </div>
          <p className="text-sm text-muted mt-6">{t("video.backToWork")}</p>
        </div>
      );
    }

    return (
      <div>
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
          <a
            href={currentVideo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
            onClick={() => {
              setTimeout(() => setVideoEnded(true), (currentVideo.duration_seconds || 120) * 1000);
            }}
          >
            {t("openYoutube")}
          </a>
        </div>
      </div>
    );
  };

  const renderRead = () => {
    if (loading || !currentLongread) {
      return <div className="text-center py-12"><p className="text-muted">{t("loading")}</p></div>;
    }

    if (longreadEnded) {
      return (
        <div className="text-center py-12">
          <p className="text-lg font-semibold mb-6">{t("read.oneMore")}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadNextLongread}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t("read.yes")}
            </button>
            <button
              onClick={() => setMode("menu")}
              className="px-6 py-3 rounded-lg border border-border font-semibold hover:bg-border/50 transition-colors"
            >
              {t("read.no")}
            </button>
          </div>
          <p className="text-sm text-muted mt-6">{t("read.backToWork")}</p>
        </div>
      );
    }

    return (
      <div>
        <h4 className="font-bold text-xl mb-2">{currentLongread.title}</h4>
        <p className="text-xs text-muted mb-4">
          {currentLongread.category} • ~{Math.ceil((currentLongread.estimated_read_time_sec || 0) / 60)} {t("minRead")}
        </p>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentLongread.body}</p>
        </div>
        {currentLongread.learn_more_url && (
          <div className="mt-4">
            <a
              href={currentLongread.learn_more_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-500 hover:underline"
            >
              {t("learnMore")}
            </a>
          </div>
        )}
        <button
          onClick={() => setLongreadEnded(true)}
          className="mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {t("read.oneMore")}
        </button>
      </div>
    );
  };

  const renderMeditation = () => {
    if (meditationComplete) {
      return (
        <div className="text-center py-12">
          <p className="text-lg font-semibold mb-6">{t("meditation.complete")}</p>
        </div>
      );
    }

    const cyclePosition = meditationTime % 12;
    let scale = 1;
    if (meditationPhase === "inhale") {
      scale = 1 + (cyclePosition / 4) * 0.5;
    } else if (meditationPhase === "hold") {
      scale = 1.5;
    } else {
      scale = 1.5 - ((cyclePosition - 6) / 6) * 0.5;
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-start to-purple-end transition-transform duration-1000 ease-in-out mb-8"
          style={{ transform: `scale(${scale})` }}
        />
        <p className="text-2xl font-semibold mb-4">
          {meditationPhase === "inhale" && t("meditation.inhale")}
          {meditationPhase === "hold" && t("meditation.hold")}
          {meditationPhase === "exhale" && t("meditation.exhale")}
        </p>
        <p className="text-sm text-muted">{Math.floor((105 - meditationTime) / 60)}:{String((105 - meditationTime) % 60).padStart(2, '0')}</p>
      </div>
    );
  };

  const renderRest = () => (
    <div className="text-center py-12">
      <p className="text-lg font-semibold mb-6">{t("rest.message")}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-lg">{t("title")}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === "menu" && renderMenu()}
          {mode === "memes" && renderMemes()}
          {mode === "video" && renderVideo()}
          {mode === "read" && renderRead()}
          {mode === "meditation" && renderMeditation()}
          {mode === "rest" && renderRest()}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-center">
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t("continueWork")}
          </button>
        </div>
      </div>
    </div>
  );
}
