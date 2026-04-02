import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

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
    <div className="min-h-screen bg-[#111111] text-[#e0e0e0] flex flex-col" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-[#222] bg-[#0e0e0e] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⛏</span>
          <span className="font-semibold text-sm tracking-widest uppercase text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Chaos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDotColors[status]}`} />
          <span className={`text-xs font-mono ${statusColors[status]}`}>{statusLabels[status]}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-48 border-r border-[#222] bg-[#0e0e0e] flex flex-col pt-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-all text-left
                ${tab === item.id
                  ? "text-white bg-[#1a1a1a] border-l-2 border-green-400"
                  : "text-[#666] hover:text-[#aaa] hover:bg-[#151515] border-l-2 border-transparent"
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
              <div className="bg-[#161616] border border-[#222] rounded p-5">
                <div className="text-[10px] uppercase tracking-widest text-[#444] mb-3 font-mono">// файл запуска</div>
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
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2a2a2a] rounded text-sm text-[#aaa] hover:text-white transition-colors"
                  >
                    <Icon name="FolderOpen" size={14} />
                    Выбрать файл
                  </button>
                  <span className="text-sm font-mono text-[#555] truncate max-w-xs">
                    {selectedFile ?? "файл не выбран"}
                  </span>
                  {selectedFile && (
                    <button onClick={() => setSelectedFile(null)} className="text-[#444] hover:text-red-400 transition-colors ml-auto">
                      <Icon name="X" size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#161616] border border-[#222] rounded p-5">
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={handleStart}
                    disabled={status !== "stopped"}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded text-sm font-medium transition-all
                      ${status === "stopped"
                        ? "bg-green-500 hover:bg-green-400 text-black cursor-pointer"
                        : "bg-[#1e1e1e] text-[#444] cursor-not-allowed"
                      }`}
                  >
                    <Icon name="Play" size={14} />
                    Запустить
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={status !== "running"}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded text-sm font-medium transition-all
                      ${status === "running"
                        ? "bg-red-500 hover:bg-red-400 text-white cursor-pointer"
                        : "bg-[#1e1e1e] text-[#444] cursor-not-allowed"
                      }`}
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
                    <div key={item.label} className="bg-[#111] border border-[#1e1e1e] rounded p-3">
                      <div className="text-[10px] text-[#444] uppercase tracking-widest mb-1 font-mono">{item.label}</div>
                      <div className="text-white font-mono text-sm">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#161616] border border-[#222] rounded p-5">
                <div className="text-[10px] uppercase tracking-widest text-[#444] mb-4 font-mono">// производительность</div>
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
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2a2a2a] rounded text-xs text-[#aaa] transition-colors">
                  <Icon name="Plus" size={12} />
                  Добавить плагин
                </button>
              </div>

              <div className="space-y-2">
                {plugins.map((plugin, i) => (
                  <div
                    key={plugin.id}
                    className="bg-[#161616] border border-[#222] rounded p-4 flex items-center justify-between group"
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
                className="flex-1 bg-[#0c0c0c] border border-[#1e1e1e] rounded p-4 overflow-y-auto scrollbar-thin mb-3"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
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
                <div className="flex-1 flex items-center bg-[#0c0c0c] border border-[#1e1e1e] rounded px-3 py-2 gap-2 focus-within:border-green-600 transition-colors">
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
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded text-sm text-[#666]
                    hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-mono"
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