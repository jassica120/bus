"use client";
import { useState, useEffect } from "react";

// TDX 授權資訊
const TDX_CLIENT_ID = "B11200032-6052b372-92ac-4515";
const TDX_CLIENT_SECRET = "13f1016d-c025-4b85-a570-40a09f37dab0";

// 取得 TDX access_token
async function getTDXToken() {
  const res = await fetch("https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${TDX_CLIENT_ID}&client_secret=${TDX_CLIENT_SECRET}`,
  });
  const data = await res.json();
  return data.access_token;
}
// 藍綠色主題
const mainColor = "bg-gradient-to-br from-cyan-500 to-teal-400";
const accentColor = "text-cyan-700";
const borderColor = "border-cyan-400";

const MENU = [
  { key: "route", label: "公車路線查詢" },
  { key: "eta", label: "公車預估到站時間" },
  { key: "stop", label: "公車站點資訊" },
  { key: "favorite", label: "最愛列表" },
  { key: "plan", label: "計畫搭乘" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("route");
  // 計畫搭乘列表
  const [plannedRoutes, setPlannedRoutes] = useState([]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlannedRoutes(JSON.parse(localStorage.getItem("plannedRoutes") || "[]"));
    }
  }, [menuOpen]);
  // 計畫搭乘路線的停靠站
  const [planStops, setPlanStops] = useState({});
  // 每個路線已鎖定的停靠站
  const [lockedStops, setLockedStops] = useState({});
  // 每個路線目前下拉選擇的站名
  const [selectedStops, setSelectedStops] = useState({});
  useEffect(() => {
    async function fetchStopsForPlans() {
      const stopsObj = {};
      for (const route of plannedRoutes) {
        try {
          const token = await getTDXToken();
          const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/StopOfRoute/City/YunlinCounty/${encodeURIComponent(route)}?$format=JSON`;
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          stopsObj[route] = Array.isArray(data) && data[0]?.Stops
            ? data[0].Stops.map((s) => s.StopName?.Zh_tw || "無資料")
            : [];
        } catch {
          stopsObj[route] = [];
        }
      }
      setPlanStops(stopsObj);
    }
    if (plannedRoutes.length > 0) fetchStopsForPlans();
  }, [plannedRoutes]);

  // 內容1：公車路線查詢
  const [routeNo, setRouteNo] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeList, setRouteList] = useState([]);

  // 內容2：預估到站時間
  const [etaData, setEtaData] = useState([]);
  const [etaLoading, setEtaLoading] = useState(false);
  const [etaRoute, setEtaRoute] = useState("");
  const [etaRouteList, setEtaRouteList] = useState([]);
  // 通知：等待公車即將到達
  useEffect(() => {
    Object.entries(lockedStops).forEach(([route, stop]) => {
      const eta = etaData.find(
        item =>
          item.RouteName?.Zh_tw === route &&
          item.StopName?.Zh_tw === stop &&
          typeof item.EstimateTime === "number"
      );
      if (eta && eta.EstimateTime >= 0 && eta.EstimateTime < 60) {
        alert("您等待公車即將到達");
      }
    });
  }, [lockedStops, etaData]);

  // 最愛列表
  const [favRoutes, setFavRoutes] = useState([]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setFavRoutes(JSON.parse(localStorage.getItem("favRoutes") || "[]"));
    }
  }, [menuOpen, routeNo]);

  // 內容4：站點資訊
  const [stopData, setStopData] = useState([]);
  const [stopLoading, setStopLoading] = useState(false);

  // 取得雲林所有公車路線
  const fetchRouteList = async () => {
    try {
      const token = await getTDXToken();
      const res = await fetch(
        "https://tdx.transportdata.tw/api/basic/v2/Bus/Route/City/YunlinCounty?$format=JSON",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setRouteList(Array.isArray(data) ? data : []);
    } catch {
      setRouteList([]);
    }
  };

  // 查詢公車路線即時資訊（用 RouteName 查詢）
  const fetchRouteInfo = async (routeNo) => {
    setRouteLoading(true);
    setRouteInfo(null);
    try {
      const token = await getTDXToken();
      const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/StopOfRoute/City/YunlinCounty/${encodeURIComponent(routeNo)}?$format=JSON`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRouteInfo(Array.isArray(data) ? data : []);
    } catch {
      setRouteInfo([]);
    }
    setRouteLoading(false);
  };

  // 預估到站時間（雲林縣）
  const fetchEta = async () => {
    setEtaLoading(true);
    try {
      const token = await getTDXToken();
      const res = await fetch(
        "https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/YunlinCounty?%24top=1000&%24format=JSON",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setEtaData(Array.isArray(data) ? data : []);
      // 取得所有路線名稱
      const routeSet = new Set();
      (Array.isArray(data) ? data : []).forEach((item) => {
        if (item.RouteName?.Zh_tw) routeSet.add(item.RouteName.Zh_tw);
      });
      setEtaRouteList(Array.from(routeSet));
    } catch {
      setEtaData([]);
      setEtaRouteList([]);
    }
    setEtaLoading(false);
  };

  // 站點資訊（雲林縣）
  // Debug: 印出 etaData 與 etaRouteList
  useEffect(() => {
    if (etaData.length > 0) {
      console.log("etaData", etaData);
    }
  }, [etaData]);
  useEffect(() => {
    if (etaRouteList.length > 0) {
      console.log("etaRouteList", etaRouteList);
    }
  }, [etaRouteList]);
  const fetchStop = async () => {
    setStopLoading(true);
    try {
      const token = await getTDXToken();
      const res = await fetch(
        "https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/City/YunlinCounty?%24top=30&%24format=JSON",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setStopData(Array.isArray(data) ? data : []);
    } catch {
      setStopData([]);
    }
    setStopLoading(false);
  };

  // 切換內容時自動載入資料
  useEffect(() => {
    if (active === "route") fetchRouteList();
    if (active === "stop") fetchStop();
    // eta 移除，改由下方全域定時刷新
  }, [active]);

  // 預估到站時間全域定時刷新
  useEffect(() => {
    fetchEta(); // 初次載入
    const interval = setInterval(fetchEta, 15000); // 每 15 秒自動刷新
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen ${mainColor} text-white`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shadow-md">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">雲林斗六公車路線</h1>
          <p className="text-sm mt-1 text-cyan-100">
            雲林斗六公車路線查詢系統，提供即時公車到站資訊、路線查詢、時刻表等功能，方便民眾出行。
          </p>
        </div>
        {/* 漢堡選單 */}
        <button
          className="sm:hidden flex flex-col gap-1.5 w-10 h-10 justify-center items-center"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="開啟選單"
        >
          <span className="block w-7 h-1 bg-white rounded"></span>
          <span className="block w-7 h-1 bg-white rounded"></span>
          <span className="block w-7 h-1 bg-white rounded"></span>
        </button>
        <nav className="hidden sm:flex gap-4 ml-8">
          {MENU.map((item) => (
            <button
              key={item.key}
              className={`px-4 py-2 rounded ${active === item.key ? "bg-white text-cyan-700 font-bold" : "hover:bg-cyan-600/60"} transition`}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      {/* 漢堡展開選單 */}
      {menuOpen && (
        <div>
          <nav className="flex flex-col gap-2 px-6 py-4 sm:hidden bg-cyan-700/90">
            {MENU.map((item) => (
              <button
                key={item.key}
                className={`px-4 py-2 rounded ${active === item.key ? "bg-white text-cyan-700 font-bold" : "hover:bg-cyan-600/60"} transition`}
                onClick={() => {
                  setActive(item.key);
                  setMenuOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="bg-white/90 text-cyan-900 rounded mt-4 p-3">
            <div className="font-bold mb-2">最愛列表</div>
            <ul>
              {favRoutes.length > 0 ? (
                favRoutes.map((fav, idx) => (
                  <li key={fav + idx} className="flex items-center justify-between">
                    <span className="font-bold text-cyan-700">{fav}</span>
                    <span className="flex gap-2">
                      <button
                        className="text-xs px-2 py-0.5 rounded border border-cyan-400 bg-white text-cyan-700 hover:bg-cyan-100"
                        onClick={() => {
                          setActive("route");
                          setRouteNo(fav);
                          fetchRouteInfo(fav);
                          setMenuOpen(false);
                        }}
                      >
                        查詢路線
                      </button>
                      <button
                        className="text-xs px-2 py-0.5 rounded border border-cyan-400 bg-white text-cyan-700 hover:bg-cyan-100"
                        onClick={() => {
                          setActive("eta");
                          setEtaRoute(fav);
                          setMenuOpen(false);
                        }}
                      >
                        預估到站
                      </button>
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-400">尚無最愛路線</li>
              )}
            </ul>
          </div>
          <div className="bg-white/90 text-cyan-900 rounded mt-4 p-3">
            <div className="font-bold mb-2">計畫搭乘列表</div>
            <table className="w-full text-sm bg-cyan-50/80 rounded shadow mb-2">
              <thead>
                <tr className="bg-cyan-200 text-cyan-900">
                  <th className="px-2 py-1">路線</th>
                  <th className="px-2 py-1">選項</th>
                  <th className="px-2 py-1 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {plannedRoutes.length > 0 ? (
                  plannedRoutes.map((plan, idx) => (
                    <tr key={plan + idx} className="border-b border-cyan-100">
                      <td className="px-2 py-1 font-bold text-cyan-700">{plan}</td>
                      <td className="px-2 py-1">
                        {lockedStops[plan] ? (
                          <span className="flex items-center gap-2 w-full">
                            <span className="font-bold text-cyan-700">{lockedStops[plan]}</span>
                            <span className="flex-1"></span>
                            <button
                              className="ml-auto text-xs px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                const newLocked = { ...lockedStops };
                                delete newLocked[plan];
                                setLockedStops(newLocked);
                              }}
                            >
                              取消
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <select
                              className="border px-2 py-1 rounded text-cyan-900 border-cyan-400"
                              value={selectedStops[plan] || ""}
                              onChange={e => setSelectedStops({ ...selectedStops, [plan]: e.target.value })}
                            >
                              <option value="">請選擇</option>
                              {(planStops[plan] || []).map((stop, i) => (
                                <option key={stop + i} value={stop}>{stop}</option>
                              ))}
                            </select>
                            <button
                              className="text-xs px-2 py-0.5 rounded border border-cyan-400 bg-white text-cyan-700 hover:bg-cyan-100"
                              disabled={!selectedStops[plan]}
                              onClick={() => {
                                setLockedStops({ ...lockedStops, [plan]: selectedStops[plan] });
                              }}
                            >
                              確定
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right w-24">
                        <button
                          className="text-red-500 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-0.5"
                          style={{ float: "right" }}
                          onClick={() => {
                            const newPlans = plannedRoutes.filter((r) => r !== plan);
                            setPlannedRoutes(newPlans);
                            localStorage.setItem("plannedRoutes", JSON.stringify(newPlans));
                          }}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-gray-400 px-2 py-1" colSpan={2}>
                      尚無計畫搭乘路線
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <main className="max-w-2xl mx-auto mt-8 p-6 rounded-lg bg-white/80 text-cyan-900 shadow-lg">
        {active === "favorite" && (
          <section>
            <h2 className={`text-xl font-bold mb-4 ${accentColor}`}>最愛列表</h2>
            <table className="w-full text-sm bg-cyan-50/80 rounded shadow mb-4">
              <thead>
                <tr className="bg-cyan-200 text-cyan-900">
                  <th className="px-2 py-1">路線</th>
                  <th className="px-2 py-1 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {favRoutes.length > 0 ? (
                  favRoutes.map((fav, idx) => (
                    <tr key={fav + idx} className="border-b border-cyan-100">
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-700">{fav}</span>
                          <span className="flex gap-2">
                            <button
                              className="text-xs px-2 py-0.5 rounded border border-cyan-400 bg-white text-cyan-700 hover:bg-cyan-100"
                              onClick={() => {
                                setActive("route");
                                setRouteNo(fav);
                                fetchRouteInfo(fav);
                                setMenuOpen(false);
                              }}
                            >
                              查詢路線
                            </button>
                            <button
                              className="text-xs px-2 py-0.5 rounded border border-cyan-400 bg-white text-cyan-700 hover:bg-cyan-100"
                              onClick={() => {
                                setActive("eta");
                                setEtaRoute(fav);
                                setMenuOpen(false);
                              }}
                            >
                              預估到站
                            </button>
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right w-24">
                        <button
                          className="text-red-500 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-0.5"
                          style={{ float: "right" }}
                          onClick={() => {
                            const newFavs = favRoutes.filter((r) => r !== fav);
                            setFavRoutes(newFavs);
                            localStorage.setItem("favRoutes", JSON.stringify(newFavs));
                          }}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-gray-400 px-2 py-1" colSpan={2}>
                      尚無最愛路線
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
        {active === "route" && (
          <section>
            <h2 className={`text-xl font-bold mb-4 ${accentColor}`}>公車路線查詢</h2>
            <div className="flex gap-2 mb-4">
              <select
                className="border px-3 py-2 rounded w-48 text-cyan-900 border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                value={routeNo}
                onChange={(e) => setRouteNo(e.target.value)}
              >
                <option value="">選擇公車路線</option>
                {routeList.map((route) => (
                  <option key={route.RouteName.Zh_tw} value={route.RouteName.Zh_tw}>
                    {route.RouteName.Zh_tw}
                  </option>
                ))}
              </select>
              <button
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
                onClick={() => fetchRouteInfo(routeNo)}
                disabled={routeLoading || !routeNo}
              >
                查詢
              </button>
              <button
                className="bg-white text-cyan-700 border border-cyan-400 px-4 py-2 rounded hover:bg-cyan-100"
                onClick={() => {
                  if (routeNo) {
                    const favs = JSON.parse(localStorage.getItem("favRoutes") || "[]");
                    if (!favs.includes(routeNo)) {
                      favs.push(routeNo);
                      localStorage.setItem("favRoutes", JSON.stringify(favs));
                      alert("已加入最愛！");
                    } else {
                      alert("此路線已在最愛！");
                    }
                  }
                }}
                disabled={!routeNo}
              >
                存入最愛
              </button>
              <button
                className="bg-white text-cyan-700 border border-cyan-400 px-4 py-2 rounded hover:bg-cyan-100"
                onClick={() => {
                  if (routeNo) {
                    const plans = JSON.parse(localStorage.getItem("plannedRoutes") || "[]");
                    if (!plans.includes(routeNo)) {
                      plans.push(routeNo);
                      localStorage.setItem("plannedRoutes", JSON.stringify(plans));
                      setPlannedRoutes(plans);
                      alert("已加入計畫！");
                    } else {
                      alert("此路線已在計畫！");
                    }
                  }
                }}
                disabled={!routeNo}
              >
                存入計畫
              </button>
            </div>
            {routeLoading && <div>載入中...</div>}
            {routeInfo && (
              <div className="mt-2">
                {routeInfo.length === 0 ? (
                  <div>查無資料</div>
                ) : (
                  <div>
                    <div className="mb-2 font-bold">
                      路線：{routeNo || "無資料"}
                    </div>
                    <div className="mb-1">經過站：</div>
                    <ul className="space-y-1 list-disc list-inside">
                      {routeInfo[0]?.Stops?.map((stop, idx) => (
                        <li key={idx}>{stop.StopName?.Zh_tw || "無資料"}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {active === "eta" && (
          <section>
            <h2 className={`text-xl font-bold mb-4 ${accentColor}`}>公車預估到站時間</h2>
            <div className="flex gap-2 mb-4">
              <select
                className="border px-3 py-2 rounded w-48 text-cyan-900 border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                value={etaRoute}
                onChange={(e) => setEtaRoute(e.target.value)}
              >
                <option value="">選擇公車路線</option>
                {etaRouteList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
                onClick={fetchEta}
                disabled={etaLoading}
              >
                重新整理
              </button>
              <button
                className="bg-white text-cyan-700 border border-cyan-400 px-4 py-2 rounded hover:bg-cyan-100"
                onClick={() => {
                  if (etaRoute) {
                    const favs = JSON.parse(localStorage.getItem("favRoutes") || "[]");
                    if (!favs.includes(etaRoute)) {
                      favs.push(etaRoute);
                      localStorage.setItem("favRoutes", JSON.stringify(favs));
                      alert("已加入最愛！");
                    } else {
                      alert("此路線已在最愛！");
                    }
                  }
                }}
                disabled={!etaRoute}
              >
                存入最愛
              </button>
              <button
                className="bg-white text-cyan-700 border border-cyan-400 px-4 py-2 rounded hover:bg-cyan-100"
                onClick={() => {
                  if (etaRoute) {
                    const plans = JSON.parse(localStorage.getItem("plannedRoutes") || "[]");
                    if (!plans.includes(etaRoute)) {
                      plans.push(etaRoute);
                      localStorage.setItem("plannedRoutes", JSON.stringify(plans));
                      setPlannedRoutes(plans);
                      alert("已加入計畫！");
                    } else {
                      alert("此路線已在計畫！");
                    }
                  }
                }}
                disabled={!etaRoute}
              >
                存入計畫
              </button>
            </div>
            {etaLoading && <div>載入中...</div>}
            {/* 主表格：只顯示 PlateNumb !== -1 */}
            {/* 依車牌分組顯示，每個車牌一個表格 */}
            {etaRoute &&
              Object.entries(
                etaData
                  .filter(
                    (item) =>
                      item.RouteName?.Zh_tw === etaRoute &&
                      item.PlateNumb !== "-1" &&
                      item.PlateNumb !== -1
                  )
                  .reduce((acc, cur) => {
                    const key = cur.PlateNumb || "無資料";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(cur);
                    return acc;
                  }, {})
              ).map(([plate, stops]) => (
                <div key={plate} className="mb-6">
                  <div className="font-bold text-cyan-700 mb-1">車牌：{plate}</div>
                  <table className="w-full text-sm bg-cyan-50/80 rounded shadow">
                    <thead>
                      <tr className="bg-cyan-200 text-cyan-900">
                        <th className="px-2 py-1">站點</th>
                        <th className="px-2 py-1">預估到站</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stops
                        .slice()
                        .sort((a, b) => {
                          const getTime = (x) =>
                            typeof x.EstimateTime === "number" && x.EstimateTime > 0
                              ? x.EstimateTime
                              : Number.MAX_SAFE_INTEGER;
                          return getTime(a) - getTime(b);
                        })
                        .map((item, idx) => (
                          <tr key={idx} className="border-b border-cyan-100">
                            <td className="px-2 py-1">{item.StopName?.Zh_tw || "無資料"}</td>
                            <td className="px-2 py-1">
                              {typeof item.EstimateTime === "number" && item.EstimateTime > 0
                                ? (() => {
                                    const h = Math.floor(item.EstimateTime / 3600);
                                    const m = Math.floor((item.EstimateTime % 3600) / 60);
                                    return (h > 0 ? `${h}小時` : "") + (m > 0 ? `${m}分` : (h === 0 && m === 0 ? "1分內" : ""));
                                  })()
                                : item.EstimateTime === 0
                                ? "進站中"
                                : item.EstimateTime === -1
                                ? "末班車已過"
                                : "無資料"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ))}
            {etaRoute &&
              etaData.filter(
                (item) =>
                  item.RouteName?.Zh_tw === etaRoute &&
                  item.PlateNumb !== "-1" &&
                  item.PlateNumb !== -1
              ).length === 0 &&
              !etaLoading &&
              (
                etaData.filter(
                  (item) =>
                    item.RouteName?.Zh_tw === etaRoute &&
                    item.PlateNumb !== "-1" &&
                    item.PlateNumb !== -1
                ).every((item) => item.EstimateTime === -1) &&
                etaData.filter(
                  (item) =>
                    item.RouteName?.Zh_tw === etaRoute &&
                    item.PlateNumb !== "-1" &&
                    item.PlateNumb !== -1
                ).length > 0
                  ? <div className="text-red-600 font-bold mt-2">本日末班車已離開</div>
                  : <div>查無資料(今日末班車已過)</div>
              )
            }
          </section>
        )}

        {active === "stop" && (
          <section>
            <h2 className={`text-xl font-bold mb-4 ${accentColor}`}>公車站點資訊</h2>
            <button
              className="mb-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
              onClick={fetchStop}
              disabled={stopLoading}
            >
              重新整理
            </button>
            {stopLoading && <div>載入中...</div>}
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {stopData.map((item, idx) => (
                <li key={idx} className="border-l-4 pl-2 border-cyan-400 bg-cyan-50/80 rounded">
                  <div>站點名稱：{item.StopName?.Zh_tw || "無資料"}</div>
                  <div>站點ID：{item.StopUID || "無資料"}</div>
                  {item.StopPosition?.PositionLat && item.StopPosition?.PositionLon && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${item.StopPosition.PositionLat},${item.StopPosition.PositionLon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-700 underline ml-2"
                    >
                      Google地圖
                    </a>
                  )}
                </li>
              ))}
            </ul>
            {stopData.length === 0 && !stopLoading && <div>查無資料</div>}
          </section>
        )}
        {active === "plan" && (
          <section className="max-w-2xl mx-auto mt-8 p-6 rounded-lg bg-white/80 text-cyan-900 shadow-lg">
            <h2 className={`text-xl font-bold mb-4 ${accentColor}`}>計畫搭乘列表</h2>
            <table className="w-full text-sm bg-cyan-50/80 rounded shadow mb-4">
              <thead>
                <tr className="bg-cyan-200 text-cyan-900">
                  <th className="px-2 py-1">路線</th>
                  <th className="px-2 py-1">您的(上車或下車)車站</th>
                  <th className="px-2 py-1 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {plannedRoutes.length > 0 ? (
                  plannedRoutes.map((plan, idx) => (
                    <tr key={plan + idx} className="border-b border-cyan-100">
                      <td className="px-2 py-1 font-bold text-cyan-700">{plan}</td>
                      <td className="px-2 py-1 text-center">
                        {lockedStops[plan] ? (
                          <span className="flex items-center gap-2 w-full justify-center">
                            <span className="font-bold text-cyan-700">{lockedStops[plan]}</span>
                            <span className="flex-1"></span>
                            <button
                              className="ml-auto text-xs px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                const newLocked = { ...lockedStops };
                                delete newLocked[plan];
                                setLockedStops(newLocked);
                              }}
                            >
                              取消
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 justify-center">
                            <select
                              className="border px-2 py-1 rounded text-cyan-900 border-cyan-400 mx-auto block"
                              value={selectedStops[plan] || ""}
                              onChange={e => setSelectedStops({ ...selectedStops, [plan]: e.target.value })}
                            >
                              <option value="">請選擇</option>
                              {(planStops[plan] || []).map((stop, i) => (
                                <option key={stop + i} value={stop}>{stop}</option>
                              ))}
                            </select>
                            <button
                              className="text-xs px-2 py-0.5 rounded border border-cyan-400 bg-white text-cyan-700 hover:bg-cyan-100"
                              disabled={!selectedStops[plan]}
                              onClick={() => {
                                setLockedStops({ ...lockedStops, [plan]: selectedStops[plan] });
                              }}
                            >
                              確定
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right w-24">
                        <button
                          className="text-red-500 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-0.5"
                          style={{ float: "right" }}
                          onClick={() => {
                            const newPlans = plannedRoutes.filter((r) => r !== plan);
                            setPlannedRoutes(newPlans);
                            localStorage.setItem("plannedRoutes", JSON.stringify(newPlans));
                          }}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-gray-400 px-2 py-1" colSpan={2}>
                      尚無計畫搭乘路線
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </main>
      <footer className="text-center text-cyan-100 py-6 mt-10">
        © {new Date().getFullYear()} 雲林斗六公車路線查詢系統
      </footer>
    </div>
  );
}

// 路線 101 預估到站時間查詢（for debug/console）
function fetchBus101ETA() {
  fetch('https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Yunlin/101')
    .then(res => res.json())
    .then(data => {
      console.log('路線 101');
      data.forEach(item => {
        const name = item.StopName?.Zh_tw || '-';
        if (item.EstimateTime == null || item.StopStatus !== 0) {
          console.log(`${name}：未發車`);
        } else {
          const min = Math.round(item.EstimateTime / 60) || 1;
          console.log(`${name}：${min}分鐘`);
        }
      });
    });
}
// 可在瀏覽器 console 執行 fetchBus101ETA()
