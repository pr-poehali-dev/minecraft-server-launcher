import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/ui/icon";

function Starfield() {
  const stars = useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    dur: (Math.random() * 4 + 2).toFixed(1),
    delay: -(Math.random() * 5).toFixed(1),
    minOp: (Math.random() * 0.15 + 0.05).toFixed(2),
    maxOp: (Math.random() * 0.6 + 0.3).toFixed(2),
  })), []);
  return (
    <div id="starfield">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          "--dur": `${s.dur}s`, "--delay": `${s.delay}s`,
          "--min-op": s.minOp, "--max-op": s.maxOp,
        } as React.CSSProperties} />
      ))}
      {/* Nebula blobs */}
      <div className="nebula" style={{ width: 500, height: 400, background: "radial-gradient(ellipse, #5b21b6, transparent 70%)", top: "5%", left: "10%", animationDelay: "0s" }} />
      <div className="nebula" style={{ width: 400, height: 350, background: "radial-gradient(ellipse, #312e81, transparent 70%)", top: "40%", right: "5%", animationDelay: "-8s" }} />
      <div className="nebula" style={{ width: 300, height: 300, background: "radial-gradient(ellipse, #4c1d95, transparent 70%)", bottom: "10%", left: "30%", animationDelay: "-14s" }} />
    </div>
  );
}

type Tab = "server" | "plugins" | "console";
type ServerStatus = "stopped" | "starting" | "running" | "stopping";

const PLUGINS_LIST = [
  { id: 1, name: "EssentialsX", version: "2.21.0", enabled: true, description: "Основные команды и утилиты" },
  { id: 2, name: "WorldEdit", version: "7.3.1", enabled: true, description: "Редактор мира" },
  { id: 3, name: "Vault", version: "1.7.3", enabled: false, description: "Экономика и права" },
  { id: 4, name: "LuckPerms", version: "5.4.130", enabled: true, description: "Система прав игроков" },
  { id: 5, name: "Citizens", version: "2.0.33", enabled: false, description: "NPC и квесты" },
];

const FAKE_LOGS = [
  "[09:41:02] [Server thread/INFO]: Starting minecraft server version 1.20.4",
  "[09:41:03] [Server thread/INFO]: Loading properties",
  "[09:41:03] [Server thread/INFO]: Default game type: SURVIVAL",
  "[09:41:04] [Server thread/INFO]: Generating keypair",
  "[09:41:05] [Server thread/INFO]: Starting Minecraft server on *:25565",
  "[09:41:06] [Server thread/INFO]: Preparing level \"world\"",
  "[09:41:08] [Server thread/INFO]: Done (3.142s)! For help, type \"help\"",
  "[09:42:15] [Server thread/INFO]: Player Steve joined the game",
  "[09:43:01] [Server thread/INFO]: Player Alex joined the game",
];

const statusColors: Record<ServerStatus, string> = {
  stopped: "text-red-400",
  starting: "text-yellow-400",
  running: "text-green-400",
  stopping: "text-yellow-400",
};

const statusLabels: Record<ServerStatus, string> = {
  stopped: "Остановлен",
  starting: "Запускается...",
  running: "Работает",
  stopping: "Останавливается...",
};

const statusDotColors: Record<ServerStatus, string> = {
  stopped: "bg-red-400",
  starting: "bg-yellow-400",
  running: "bg-green-400 pulse-green",
  stopping: "bg-yellow-400",
};

export default function Index() {
  const [tab, setTab] = useState<Tab>("server");
  const [status, setStatus] = useState<ServerStatus>("stopped");
  const [logs, setLogs] = useState<string[]>([]);
  const [consoleInput, setConsoleInput] = useState("");
  const [uptime, setUptime] = useState(0);
  const [plugins, setPlugins] = useState(PLUGINS_LIST);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxPlayers = "20";
  const port = "25565";
  const memory = "2048";

  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [tps, setTps] = useState(0);
  const [players, setPlayers] = useState(0);
  const [uiHidden, setUiHidden] = useState(false);

  const consoleRef = useRef<HTMLDivElement>(null);
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metricsRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (status === "running") {
      uptimeRef.current = setInterval(() => setUptime(u => u + 1), 1000);
      metricsRef.current = setInterval(() => {
        setCpuUsage(Math.round(15 + Math.random() * 25));
        setRamUsage(Math.round(1200 + Math.random() * 400));
        // RAM из фиксированного лимита
        setTps(Math.round((19.5 + Math.random() * 0.5) * 10) / 10);
        setPlayers(Math.floor(Math.random() * 3) + 1);
      }, 2000);
    } else {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
      if (metricsRef.current) clearInterval(metricsRef.current);
      if (status === "stopped") {
        setUptime(0);
        setCpuUsage(0);
        setRamUsage(0);
        setTps(0);
        setPlayers(0);
      }
    }
    return () => {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
      if (metricsRef.current) clearInterval(metricsRef.current);
    };
  }, [status]);

  const handleStart = () => {
    if (status !== "stopped") return;
    setStatus("starting");
    setLogs([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < FAKE_LOGS.length - 2) {
        setLogs(prev => [...prev, FAKE_LOGS[i]]);
        i++;
      } else {
        clearInterval(interval);
        setLogs(prev => [...prev, FAKE_LOGS[i], FAKE_LOGS[i + 1]]);
        setStatus("running");
      }
    }, 350);
  };

  const handleStop = () => {
    if (status !== "running") return;
    setStatus("stopping");
    setLogs(prev => [
      ...prev,
      "[Server thread/INFO]: Stopping the server",
      "[Server thread/INFO]: Saving players",
      "[Server thread/INFO]: Saving worlds",
    ]);
    setTimeout(() => {
      setLogs(prev => [...prev, "[Server thread/INFO]: Server stopped"]);
      setStatus("stopped");
      setPlayers(0);
    }, 1800);
  };

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim() || status !== "running") return;
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [
      ...prev,
      `[${time}] [Server thread/INFO]: /${consoleInput}`,
      `[${time}] [Server thread/INFO]: Unknown command. Type "help" for help.`,
    ]);
    setConsoleInput("");
  };

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const togglePlugin = (id: number) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: "server", icon: "Server", label: "Сервер" },
    { id: "plugins", icon: "Puzzle", label: "Плагины" },
    { id: "console", icon: "Terminal", label: "Консоль" },
  ];

  return (
    <div className="min-h-screen text-[#e0e0e0] flex flex-col relative" style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#07020f" }}>
      <Starfield />

      {/* Toggle UI button */}
      <button
        onClick={() => setUiHidden(h => !h)}
        className="fixed bottom-5 left-5 z-50 w-8 h-8 flex items-center justify-center rounded-full transition-all"
        style={{
          background: "rgba(15,5,28,0.7)",
          border: "1px solid rgba(167,100,255,0.3)",
          boxShadow: "0 0 12px rgba(167,100,255,0.2)",
          backdropFilter: "blur(4px)",
          opacity: uiHidden ? 0.4 : 0.7,
        }}
        title={uiHidden ? "Показать интерфейс" : "Скрыть интерфейс"}
      >
        <Icon name={uiHidden ? "Plus" : "X"} size={14} className="text-purple-300" />
      </button>

      {/* Header */}
      <header className={`cosmic-header px-6 py-3 flex items-center justify-between relative z-10 transition-all duration-300 ${uiHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#c084fc" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="50" y1="50" x2="50" y2="16"/><polyline points="44,22 50,16 56,22"/>
              <line x1="50" y1="50" x2="50" y2="84"/><polyline points="44,78 50,84 56,78"/>
              <line x1="50" y1="50" x2="16" y2="50"/><polyline points="22,44 16,50 22,56"/>
              <line x1="50" y1="50" x2="84" y2="50"/><polyline points="78,44 84,50 78,56"/>
              <line x1="50" y1="50" x2="26" y2="26"/><polyline points="26,34 26,26 34,26"/>
              <line x1="50" y1="50" x2="74" y2="26"/><polyline points="66,26 74,26 74,34"/>
              <line x1="50" y1="50" x2="26" y2="74"/><polyline points="26,66 26,74 34,74"/>
              <line x1="50" y1="50" x2="74" y2="74"/><polyline points="66,74 74,74 74,66"/>
            </g>
            <circle cx="50" cy="50" r="5" fill="#c084fc"/>
          </svg>
          <span className="font-semibold text-sm tracking-widest uppercase text-white" style={{ fontFamily: "'IBM Plex Mono', monospace", textShadow: "0 0 12px rgba(192,132,252,0.6)" }}>
            Chaos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDotColors[status]}`} />
          <span className={`text-xs font-mono ${statusColors[status]}`}>{statusLabels[status]}</span>
        </div>
      </header>

      <div className={`flex flex-1 overflow-hidden relative z-10 transition-all duration-300 ${uiHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        {/* Sidebar */}
        <nav className="cosmic-sidebar w-48 flex flex-col pt-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-all text-left border-l-2
                ${tab === item.id
                  ? "text-purple-300 cosmic-nav-active"
                  : "text-[#665] hover:text-[#bbb] hover:bg-[rgba(120,60,200,0.07)] border-transparent"
                }`}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6 animate-fade-in">

          {/* ===== СЕРВЕР ===== */}
          {tab === "server" && (
            <div className="max-w-2xl space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-[#555] mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                // управление сервером
              </h2>

              {/* Выбор файла сервера */}
              <div className="cosmic-panel rounded p-5">
                <div className="text-[10px] uppercase tracking-widest text-purple-400/50 mb-3 font-mono">// файл запуска</div>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jar,.bat,.sh,.exe"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file.name);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded text-sm text-purple-300 hover:text-white transition-all"
                    style={{ background: "rgba(120,60,200,0.12)", border: "1px solid rgba(167,100,255,0.25)", boxShadow: "0 0 10px rgba(167,100,255,0.1)" }}
                  >
                    <Icon name="FolderOpen" size={14} />
                    Выбрать файл
                  </button>
                  <span className="text-sm font-mono text-[#665] truncate max-w-xs">
                    {selectedFile ?? "файл не выбран"}
                  </span>
                  {selectedFile && (
                    <button onClick={() => setSelectedFile(null)} className="text-[#554] hover:text-red-400 transition-colors ml-auto">
                      <Icon name="X" size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="cosmic-panel rounded p-5">
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={handleStart}
                    disabled={status !== "stopped"}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded text-sm font-medium transition-all
                      ${status === "stopped"
                        ? "bg-green-500 hover:bg-green-400 text-black cursor-pointer btn-glow-green"
                        : "text-[#444] cursor-not-allowed"
                      }`}
                    style={status !== "stopped" ? { background: "rgba(30,20,40,0.6)", border: "1px solid rgba(80,80,80,0.2)" } : {}}
                  >
                    <Icon name="Play" size={14} />
                    Запустить
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={status !== "running"}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded text-sm font-medium transition-all
                      ${status === "running"
                        ? "bg-red-500 hover:bg-red-400 text-white cursor-pointer btn-glow-red"
                        : "text-[#444] cursor-not-allowed"
                      }`}
                    style={status !== "running" ? { background: "rgba(30,20,40,0.6)", border: "1px solid rgba(80,80,80,0.2)" } : {}}
                  >
                    <Icon name="Square" size={14} />
                    Остановить
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "АПТАЙМ", value: formatUptime(uptime) },
                    { label: "ИГРОКИ", value: `${players} / ${maxPlayers}` },
                    { label: "ПОРТ", value: `:${port}` },
                  ].map(item => (
                    <div key={item.label} className="stat-card rounded p-3">
                      <div className="text-[10px] text-purple-400/40 uppercase tracking-widest mb-1 font-mono">{item.label}</div>
                      <div className="text-white font-mono text-sm">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cosmic-panel rounded p-5">
                <div className="text-[10px] uppercase tracking-widest text-purple-400/50 mb-4 font-mono">// производительность</div>
                <div className="space-y-3">
                  {[
                    { label: "CPU", value: cpuUsage, max: 100, unit: "%", color: cpuUsage > 70 ? "#f87171" : "#4ade80" },
                    { label: "RAM", value: ramUsage, max: parseInt(memory), unit: " MB", color: ramUsage / parseInt(memory) > 0.8 ? "#f87171" : "#60a5fa" },
                    { label: "TPS", value: tps, max: 20, unit: "", color: tps < 15 ? "#fbbf24" : "#4ade80" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#555] font-mono">{item.label}</span>
                        <span className="font-mono" style={{ color: item.color }}>
                          {item.value}{item.unit}
                        </span>
                      </div>
                      <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== ПЛАГИНЫ ===== */}
          {tab === "plugins" && (
            <div className="max-w-xl space-y-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs uppercase tracking-widest text-[#555] font-mono">
                  // плагины ({plugins.filter(p => p.enabled).length}/{plugins.length})
                </h2>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-purple-300 hover:text-white transition-all" style={{ background: "rgba(120,60,200,0.1)", border: "1px solid rgba(167,100,255,0.2)", boxShadow: "0 0 8px rgba(167,100,255,0.08)" }}>
                  <Icon name="Plus" size={12} />
                  Добавить плагин
                </button>
              </div>

              <div className="space-y-2">
                {plugins.map((plugin, i) => (
                  <div
                    key={plugin.id}
                    className="cosmic-panel rounded p-4 flex items-center justify-between group"
                    style={{ animation: `fade-in 0.3s ease-out ${i * 50}ms both` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${plugin.enabled ? "bg-green-400" : "bg-[#333]"}`} />
                      <div>
                        <div className="text-sm text-white font-medium">{plugin.name}</div>
                        <div className="text-[11px] text-[#555] font-mono mt-0.5">{plugin.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#444] font-mono">v{plugin.version}</span>
                      <button
                        onClick={() => togglePlugin(plugin.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          plugin.enabled ? "bg-green-500" : "bg-[#333]"
                        }`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                          plugin.enabled ? "left-5" : "left-0.5"
                        }`} />
                      </button>
                      <button className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-all">
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== КОНСОЛЬ ===== */}
          {tab === "console" && (
            <div className="flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
              <h2 className="text-xs uppercase tracking-widest text-[#555] mb-4 font-mono">// консоль сервера</h2>

              <div
                ref={consoleRef}
                className="flex-1 rounded p-4 overflow-y-auto scrollbar-thin mb-3"
                style={{ fontFamily: "'IBM Plex Mono', monospace", background: "rgba(4, 1, 10, 0.9)", border: "1px solid rgba(120,60,200,0.2)", boxShadow: "0 0 20px rgba(80,20,160,0.08), inset 0 0 30px rgba(0,0,0,0.4)" }}
              >
                {logs.length === 0 ? (
                  <div className="text-[#333] text-xs">Сервер не запущен. Логи появятся здесь...</div>
                ) : (
                  logs.map((log, i) => {
                    const isError = log.includes("ERROR") || log.includes("WARN");
                    const isSuccess = log.includes("Done") || log.includes("joined");
                    const timeMatch = log.match(/\[(\d{2}:\d{2}:\d{2})\]/);
                    const timeStr = timeMatch ? timeMatch[0] : "";
                    const rest = timeStr ? log.slice(timeStr.length) : log;
                    return (
                      <div
                        key={i}
                        className={`text-xs leading-5 ${
                          isError ? "text-red-400" : isSuccess ? "text-green-400" : "text-[#666]"
                        }`}
                      >
                        <span className="text-[#3a3a3a]">{timeStr}</span>
                        <span>{rest}</span>
                      </div>
                    );
                  })
                )}
                {status === "running" && (
                  <span className="text-green-500 text-xs cursor-blink">▋</span>
                )}
              </div>

              <form onSubmit={handleConsoleSubmit} className="flex gap-2">
                <div className="flex-1 flex items-center rounded px-3 py-2 gap-2 focus-within:border-purple-500 transition-colors" style={{ background: "rgba(4,1,10,0.9)", border: "1px solid rgba(120,60,200,0.2)" }}>
                  <span className="text-green-500 text-xs font-mono">&gt;</span>
                  <input
                    value={consoleInput}
                    onChange={e => setConsoleInput(e.target.value)}
                    disabled={status !== "running"}
                    placeholder={status === "running" ? "Введите команду..." : "Сервер не запущен"}
                    className="flex-1 bg-transparent text-sm font-mono text-white placeholder:text-[#333]
                      focus:outline-none disabled:cursor-not-allowed"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status !== "running"}
                  className="px-4 py-2 rounded text-sm text-purple-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed font-mono"
                  style={{ background: "rgba(120,60,200,0.12)", border: "1px solid rgba(167,100,255,0.2)", boxShadow: "0 0 8px rgba(167,100,255,0.08)" }}
                >
                  ↵
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}