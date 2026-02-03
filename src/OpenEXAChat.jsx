import React, { useEffect, useRef, useState } from "react";
/* eslint-disable-next-line no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Plus, Trash2, PencilLine, Settings, Check, X, Sparkles, Wifi, History, Save, RefreshCcw } from "lucide-react";

import CandlestickChart from "./CandlestickChart";
import StockShower from "./components/StockShower";

// UTIL
const LS_KEY = "openexa-chat-sessions-v2";
const LS_SETTINGS = "openexa-chat-settings-v2";

// Migration helper for localStorage schema changes
function migrateSessionsData(data) {
  if (!data || typeof data !== "object") return null;
  // Ensure required fields exist
  if (!data.order) data.order = [];
  if (!data.byId) data.byId = {};
  // Validate and clean up messages
  Object.values(data.byId).forEach(session => {
    if (!Array.isArray(session.messages)) session.messages = [];
  });
  return data;
}

function uid() { return Math.random().toString(36).slice(2) + Date.now(); }

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      // Run migration if needed (for sessions data)
      return key.includes("sessions") ? migrateSessionsData(parsed) : parsed;
    } catch (e) {
      console.warn("Failed to load localStorage:", key, e);
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to save localStorage:", key, e);
    }
  }, [key, value]);
  return [value, setValue];
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Componenets
function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs backdrop-blur-md bg-white/10 border border-white/10 shadow-sm">
      {children}
    </span>
  );
}

function GhostButton({ className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/10 active:scale-[0.98] transition ${className}`}
      {...props}
    />
  );
}

function PrettyInput({ value, onChange, onKeyDown, placeholder }) {
  return (
    <textarea
      rows={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full resize-none rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-violet-400/60 text-sm"
    />
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce [animation-delay:-.2s]" />
      <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" />
      <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce [animation-delay:.2s]" />
    </span>
  );
}

// Main Application for Demo
export default function OpenEXAChat() {
  const [sessions, setSessions] = useLocalStorage(LS_KEY, {
    order: [],
    byId: {}, // id -> { id, name, chatId, messages: [{who, text, ts}], created }
    activeId: null,
  });

  const [settings, setSettings] = useLocalStorage(LS_SETTINGS, {
    webhookUrl: "",
    pollInterval: 5000,
    chartWidth: 900,
    chartHeight: 320,   
    candleWidth: 10
  });

  // Ensure at least one session exists
  useEffect(() => {
    if (!sessions.activeId) {
      const id = uid();
      const first = { id, name: "Session 1", chatId: id, messages: [], created: Date.now() };
      setSessions(() => ({ order: [id], byId: { [id]: first }, activeId: id }));
    }
  }, []); // eslint-disable-line

  const active = sessions.byId[sessions.activeId] || null;

  function createSession() {
    const id = uid();
    const next = { id, name: `Session ${sessions.order.length + 1}` , chatId: id, messages: [], created: Date.now() };
    setSessions(s => ({ order: [id, ...s.order], byId: { ...s.byId, [id]: next }, activeId: id }));
  }

  function deleteSession(id) {
    setSessions(s => {
      const order = s.order.filter(x => x !== id);
      const byId = { ...s.byId }; delete byId[id];
      const activeId = s.activeId === id ? order[0] || null : s.activeId;
      return { order, byId, activeId };
    });
  }

  function renameSession(id, name) {
    setSessions(s => ({ ...s, byId: { ...s.byId, [id]: { ...s.byId[id], name } } }));
  }

  function setActive(id) { setSessions(s => ({ ...s, activeId: id })); }

  // Chat state
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState([]); // array of strings
  const [chartOptions, setChartOptions] = useState(null);
  const [candlestickText, setCandlestickText] = useState(""); // Store candlestick data text
  const [stocksOpen, setStocksOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [active?.messages?.length, busy]);

  // Clear chart when session changes
  useEffect(() => {
    setChartOptions(null);
  }, [active?.id]);

  //stuff arnav added
  useEffect(() => {
    const fetchData = async () => {
      let retries = 0;
      const maxRetries = 3;
      
      const attemptFetch = async () => {
        try {
          const respo = await fetch("https://n8n-358659050159.us-west1.run.app", { cache: "no-store" });
          const data = await respo.json();
          
          // Update status with the new data
          if (data.Body) {
            setStatus(data.Body);
          }
          
          // Safe data access with validation
          if (!data?.Candlestick) return;
          
          const allCandles = data.Candlestick?.allCandles?.[0];
          if (!allCandles || typeof allCandles !== "object") return;
          
          const candles = allCandles.candles || allCandles;
          if (!candles || typeof candles !== "object") return;
          
          const meta = (allCandles.candles && allCandles.candles["Meta Data"]) || allCandles["Meta Data"] || allCandles.meta || data.Candlestick?.meta || {};
          const symbol = meta["2. Symbol"] || data.Candlestick?.symbol || null;
          
          const timeSeries = candles["Time Series (15min)"] || candles["timeSeries"] || candles["Time Series"] || candles;
          
          // Validate timeSeries is an object with entries
          if (!timeSeries || typeof timeSeries !== "object") return;
          const timeSeriesEntries = Object.entries(timeSeries);
          if (timeSeriesEntries.length === 0) return;
          
          let text = "";
          let count = 0;
          for (const [timestamp, candle] of timeSeriesEntries) {
            if (count >= 30) break; // Truncate at 30 entries
            if (!candle || typeof candle !== "object") continue;
            
            try {
              const open = parseFloat(candle["1. open"]) || NaN;
              const high = parseFloat(candle["2. high"]) || NaN;
              const low = parseFloat(candle["3. low"]) || NaN;
              const close = parseFloat(candle["4. close"]) || NaN;
              const volume = parseInt(candle["5. volume"], 10) || 0;
              text += `Timestamp: ${timestamp}, Open: ${open}, High: ${high}, Low: ${low}, Close: ${close}, Volume: ${volume}\n`;
              count++;
            } catch (e) {
              console.warn("Error parsing candle data:", e);
              continue;
            }
          }

          // Store the text for the right panel
          setCandlestickText(text);

          const dataPoints = timeSeriesEntries
            .map(([timestamp, candle]) => {
              try {
                if (!candle || typeof candle !== "object") return null;
                const d = new Date(timestamp);
                // if timestamp isn't parseable, skip
                if (isNaN(d.getTime())) return null;
                
                const open = parseFloat(candle["1. open"]);
                const high = parseFloat(candle["2. high"]);
                const low = parseFloat(candle["3. low"]);
                const close = parseFloat(candle["4. close"]);
                
                // Skip if any values are NaN
                if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return null;
                
                return {
                  x: d,
                  y: [open, high, low, close]
                };
              } catch (e) {
                console.warn("Error mapping candle point:", e);
                return null;
              }
            })
            .filter(Boolean);

          dataPoints.sort((a, b) => a.x - b.x);

          const upColor = "#16a34a"; // green for bullish
          const downColor = "#ef4444"; // red for bearish

          const dataPointsWithColor = dataPoints.map((dp) => {
            // dp.y = [open, high, low, close]
            const open = Number(dp.y?.[0]);
            const close = Number(dp.y?.[3]);
            const color =
              !Number.isNaN(open) && !Number.isNaN(close) && close >= open
                ? upColor
                : downColor;
            return { ...dp, color };
          });

          const options = {
            theme: "dark2",
            animationEnabled: true,
            exportEnabled: true,
            title: { text: symbol ? `${symbol} Candlesticks` : "Candlesticks" },
            axisX: { valueFormatString: "MMM DD HH:mm" },
            axisY: { prefix: "$" },
            data: [
              {
                type: "candlestick",
                name: "Price",
                yValueFormatString: "$###0.00",
                xValueFormatString: "MMM DD HH:mm",
                risingColor: upColor, // series-level fallback
                fallingColor: downColor, // series-level fallback
                increasingColor: upColor,
                decreasingColor: downColor,
                upColor: upColor,
                downColor: downColor,
                dataPoints: dataPointsWithColor,
              },
            ],
          };

          // Update chart (will render via <CandlestickChart />)
          setChartOptions(options);
        } catch (error) {
          if (retries < maxRetries) {
            retries++;
            console.warn(`Fetch error, retrying (${retries}/${maxRetries}):`, error.message);
            return await attemptFetch();
          } else {
            console.error("Error fetching data after 3 retries:", error);
            console.error("Error details:", error.message);
            setStatus("Error fetching data");
          }
        }
      };
      
      attemptFetch();
    };
    
    const interval = setInterval(fetchData, settings.pollInterval || 5000);
    return () => clearInterval(interval);
  }, [settings.pollInterval]);
  
  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    if (!active?.id) {
      alert("No active session. Please refresh the page.");
      return;
    }
    if (!settings.webhookUrl) {
      alert("Please set your n8n Webhook URL (top-right settings).");
      return;
    }

    // optimistic user message
    const youMsg = { who: "you", text, ts: Date.now() };
    const activeId = active.id;
    setSessions(s => {
      const sess = s.byId[activeId];
      if (!sess) return s;
      return {
        ...s,
        byId: {
          ...s.byId,
          [activeId]: { ...sess, messages: [...(sess.messages || []), youMsg] }
        }
      };
    });

    // show thinking state
    setInput("");
    setBusy(true);
    setProgress([]);

    try {
      const res = await fetch(settings.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: active.chatId, chatInput: text })
      });
      const data = await res.json();

      // chips in header
      const statusText = data.status || "";
      const progressArr = Array.isArray(data.progress) ? data.progress : [];
      setStatus(statusText);
      setProgress(progressArr);

      // prefer authoritative server history ONLY if non-empty and for the same session
      const serverHistoryRaw = Array.isArray(data.history) ? data.history.slice() : [];
      const serverHistory = serverHistoryRaw.length ? serverHistoryRaw : null;
      const botText = data.text || data.response || "";
      const sameSession = Boolean(
        (data.sessionId && data.sessionId === active.chatId) ||
        (data.chatId && data.chatId === active.chatId) ||
        (!data.sessionId && !data.chatId) // allow when server doesn't echo ids
      );

      if (sameSession && serverHistory && serverHistory.length > 0) {
        setSessions(s => {
          const activeIdNow = s.activeId;
          if (!activeIdNow) return s;
          const cur = s.byId[activeIdNow] || { id: activeIdNow, name: `Session`, chatId: activeIdNow, messages: [], created: Date.now() };

          // Normalize server messages
          const serverMsgs = serverHistory.map(h => ({
            who: h.who === "you" ? "you" : "bot",
            text: h.text,
            ts: h.ts || Date.now(),
          }));

          // Find local candles in the current state's messages
          const curMsgs = cur.messages || [];
          const localCandles = curMsgs.filter(m => m?.meta?.local);

          const merged = serverMsgs.slice();
          const newCandles = [];
          for (const lc of localCandles) {
            if (!merged.some(m => String(m.text) === String(lc.text))) newCandles.push(lc);
          }
          if (newCandles.length) {
            if (merged.length > 0) {
              // insert before the last server message
              const insertIndex = Math.max(0, merged.length - 1);
              merged.splice(insertIndex, 0, ...newCandles);
            } else {
              // no server messages — just add the candles
              merged.push(...newCandles);
            }
          }

          return { ...s, byId: { ...s.byId, [activeIdNow]: { ...cur, messages: merged } } };
        });
      } else if (botText && sameSession) {
        const botMsg = { who: "bot", text: botText, ts: Date.now() };
        setSessions(s => {
          const activeIdNow = s.activeId;
          if (!activeIdNow) return s;
          const sess = s.byId[activeIdNow];
          if (!sess) return s;
          return {
            ...s,
            byId: {
              ...s.byId,
              [activeIdNow]: {
                ...sess,
                messages: [...(sess.messages || []), botMsg]
              }
            }
          };
        });
      } // else: keep optimistic user message only

    } catch (e) {
      setSessions(s => {
        const activeIdNow = s.activeId;
        if (!activeIdNow) return s;
        const sess = s.byId[activeIdNow];
        if (!sess) return s;
        return {
          ...s,
          byId: {
            ...s.byId,
            [activeIdNow]: {
              ...sess,
              messages: [...(sess.messages || []), { who: "bot", text: `Network error: ${e?.message || e}`, ts: Date.now() }]
            }
          }
        };
      });
    } finally {
      setBusy(false);
      //setTimeout(() => { setStatus(""); setProgress([]); }, 3000);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // simple prompt rename
  function renameSessionPrompt(id, currentName) {
    const next = window.prompt("Rename session", currentName);
    if (next && next.trim()) renameSession(id, next.trim());
  }

  // UI
  return (
    <div className="min-h-screen text-white bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-black">
      {/* top neon ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-indigo-400 to-sky-400" />

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-72 flex-col border-r border-white/10 p-4 gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-white/80">Sessions</h2>
            <GhostButton onClick={createSession} className="text-white/80"><Plus size={18}/>New</GhostButton>
          </div>

          <div className="space-y-2 overflow-auto">
            {sessions.order.map(id => {
              const s = sessions.byId[id];
              const activeMe = id === sessions.activeId;
              return (
                <div key={id} className={`group flex items-center gap-2 rounded-2xl px-3 py-3 border ${activeMe ? "border-white/20 bg-white/5" : "border-white/10 hover:bg-white/5"}`}>
                  <button onClick={() => setActive(id)} className="flex-1 text-left">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs text-white/60">{s.messages.length} msg • {timeAgo(s.created)}</div>
                  </button>
                  <GhostButton onClick={() => renameSessionPrompt(id, s.name)} className="opacity-0 group-hover:opacity-100"><PencilLine size={16}/></GhostButton>
                  <GhostButton onClick={() => deleteSession(id)} className="opacity-0 group-hover:opacity-100"><Trash2 size={16}/></GhostButton>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-white/60 flex items-center gap-2"><Wifi size={14}/> Connected</div>
            <SettingsButton settings={settings} setSettings={setSettings}/>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Header for mobile */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-white/10">
            <div className="text-sm font-medium">{active?.name || "Session"}</div>
            <div className="flex items-center gap-2">
              <GhostButton onClick={createSession}><Plus size={18}/></GhostButton>
              <SettingsButton settings={settings} setSettings={setSettings}/>
            </div>
          </div>

          {/* Status chips and StockShower */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5 overflow-x-auto">
            <Chip><Sparkles size={14} className="mr-1"/> OpenEXA</Chip>
            {status && <Chip>{status}</Chip>}
            <AnimatePresence>
              {busy && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <Chip><Loader2 size={14} className="mr-1 animate-spin"/> Thinking</Chip>
                </motion.span>
              )}
            </AnimatePresence>
            {progress.map((p, i) => (
              <Chip key={i}>{p}</Chip>
            ))}
            <div className="ml-auto flex-shrink-0">
              <GhostButton onClick={() => setStocksOpen(true)}>
                <History size={18}/> Stocks
              </GhostButton>
            </div>
          </div>

          {/* Messages - fixed height */}
          <div ref={listRef} className="h-170 overflow-auto p-4 space-y-3 flex-shrink-0">
            {!active?.messages?.length && (
              <div className="h-full grid place-items-center text-center text-white/70">
                <div>
                  <div className="text-2xl font-semibold mb-2">Welcome Back!</div>
                  <p className="text-sm">Say <span className="font-semibold">hi</span> to begin. Choose Relval or Tickers.</p>
                </div>
              </div>
            )}

            {active?.messages?.map((m, i) => (
              <div key={i} className={`max-w-[85%] md:max-w-[70%] ${m.who === "you" ? "ml-auto" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 backdrop-blur-md border shadow-sm ${m.who === "you" ? "bg-indigo-500/20 border-indigo-300/20" : "bg-white/5 border-white/10"}`}>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">{m.text}</div>
                </div>
              </div>
            ))}

            {/* live typing visual */}
            {busy && (
              <div className="max-w-[70%]">
                <div className="rounded-2xl px-4 py-3 backdrop-blur-md border shadow-sm bg-white/5 border-white/10 inline-flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin"/>
                  <TypingDots/>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-white/10 bg-gradient-to-t from-black/30 to-transparent">
            <div className="flex items-end gap-2">
              <PrettyInput
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={busy ? "Thinking..." : "Type a message (say \"hi\" to begin)"}
              />
              <button
                onClick={sendMessage}
                disabled={busy || !input.trim()}
                className="rounded-2xl px-4 py-3 bg-gradient-to-r from-fuchsia-500 to-sky-400 disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition flex items-center gap-2"
              >
                <Send size={18}/> Send
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* StockShower Popup */}
      <AnimatePresence>
        {stocksOpen && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setStocksOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.95 }}
              className="w-[95vw] max-w-6xl max-h-[90vh] overflow-auto rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="stocks-title"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="stocks-title" className="text-lg font-semibold">Stock Data</h3>
                <button
                  onClick={() => setStocksOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10"
                  aria-label="Close stocks"
                >
                  <X size={20}/>
                </button>
              </div>
              <StockShower />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsButton({ settings, setSettings }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(settings.webhookUrl || "");
  const [chartWidth, setChartWidth] = useState(settings.chartWidth ?? 900);
  const [chartHeight, setChartHeight] = useState(settings.chartHeight ?? 320);
  const [candleWidth, setCandleWidth] = useState(settings.candleWidth ?? 10);

  useEffect(() => {
      setUrl(settings.webhookUrl || "");
      setChartWidth(settings.chartWidth ?? 900);
      setChartHeight(settings.chartHeight ?? 320);
      setCandleWidth(settings.candleWidth ?? 10);
    }, [open, settings]); // refresh when opening

  function save() {
    setSettings(s => ({ ...s, webhookUrl: url.trim(), 
      chartWidth: Number(chartWidth) || 0,
      chartHeight: Number(chartHeight) || 0,
      candleWidth: Number(candleWidth) || 0 }));
    setOpen(false);
  }

  return (
    <>
      <GhostButton onClick={() => setOpen(true)}><Settings size={18}/> Settings</GhostButton>
      <AnimatePresence>
        {open && (
          <motion.div 
            className="fixed inset-0 z-50 grid place-items-center bg-black/60"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="w-[92vw] max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-md p-5 space-y-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 id="settings-title" className="text-lg font-semibold">Chat Settings</h3>
                <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/10" aria-label="Close settings"><X/></button>
              </div>

              <label htmlFor="webhook-url" className="text-sm text-white/70">n8n Webhook URL</label>
              <input
                id="webhook-url"
                autoFocus
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter") save();
                }}
                placeholder="https://your-n8n/webhook/your-workflow"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/60"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-white/70">Chart width (px, 0 = full)</label>
                  <input type="number" value={chartWidth} onChange={e => setChartWidth(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/60" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Chart height (px)</label>
                  <input type="number" value={chartHeight} onChange={e => setChartHeight(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/60" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Poll interval (ms, min 1000)</label>
                  <input type="number" value={settings.pollInterval ?? 5000} onChange={e => setSettings(s => ({ ...s, pollInterval: Math.max(1000, Number(e.target.value) || 5000) }))} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/60" />
                  <p className="text-xs text-white/60 mt-1">Default: 5000ms. Lower = more frequent updates.</p>
                </div>
                <div>
                  <label className="text-sm text-white/70">Candlestick width (px)</label>
                  <input type="number" value={candleWidth} onChange={e => setCandleWidth(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/60" />
                  <p className="text-xs text-white/60 mt-1">Smaller values make candles thinner (try 4–12).</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <GhostButton onClick={() => setOpen(false)}><X size={16}/> Cancel</GhostButton>
                <button onClick={save} className="rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-sky-400 flex items-center gap-2"><Check size={16}/> Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
