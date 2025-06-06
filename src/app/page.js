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
  { key: "timetable", label: "公車時刻表" },
  { key: "stop", label: "公車站點資訊" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("route");

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

  // 內容3：時刻表
  const [timetableData, setTimetableData] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(false);

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
  const fetchRouteInfo = async (routeName) => {
    setRouteLoading(true);
    setRouteInfo(null);
    try {
      const token = await getTDXToken();
      const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/YunlinCounty/${encodeURIComponent(routeName)}?$format=JSON`;
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

  // 時刻表（雲林縣）
  const fetchTimetable = async () => {
    setTimetableLoading(true);
    try {
      const token = await getTDXToken();
      const res = await fetch(
        "https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/YunlinCounty?%24top=30&%24format=JSON",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setTimetableData(Array.isArray(data) ? data : []);
    } catch {
      setTimetableData([]);
    }
    setTimetableLoading(false);
  };

  // 站點資訊（雲林縣）
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
    if (active === "eta") fetchEta();
    if (active === "timetable") fetchTimetable();
    if (active === "stop") fetchStop();
  }, [active]);

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
      )}

      {/* 主內容 */}
      <main className="max-w-2xl mx-auto mt-8 p-6 rounded-lg bg-white/80 text-cyan-900 shadow-lg">
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
            </div>
            {routeLoading && <div>載入中...</div>}
            {routeInfo && (
              <div className="mt-2">
                {routeInfo.length === 0 ? (
                  <div>查無資料</div>
                ) : (
                  <ul className="space-y-2">
                    {routeInfo.map((item, idx) => (
                      <li key={idx} className="border-l-4 pl-2 border-cyan-400 bg-cyan-50/80 rounded">
                        <div>路線：{item.RouteName?.Zh_tw || "無資料"}</div>
                        <div>車牌：{item.PlateNumb || "無資料"}</div>
                        <div>站點：{item.StopName?.Zh_tw || "無資料"}</div>
                        <div>預估到站：{item.EstimateTime ? Math.round(item.EstimateTime / 60) + " 分" : "無資料"}</div>
                      </li>
                    ))}
                  </ul>
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
              !etaLoading && <div>查無資料</div>}
            {etaRoute &&
              etaData.filter(
                (item) =>
                  item.RouteName?.Zh_tw === etaRoute &&
                  item.PlateNumb !== "-1" &&
                  item.PlateNumb !== -1
              ).length > 0 &&
              etaData
                .filter(
                  (item) =>
                    item.RouteName?.Zh_tw === etaRoute &&
                    item.PlateNumb !== "-1" &&
                    item.PlateNumb !== -1
                )
                .every((item) => item.EstimateTime === -1) && (
                <div className="text-red-600 font-bold mt-2">本日末班車已過</div>
              )}
          </section>
        )}

        {active === "timetable" && (
          <section>
            <h2 className={`text-xl font-bold mb-4 ${accentColor}`}>公車時刻表</h2>
            <button
              className="mb-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
              onClick={fetchTimetable}
              disabled={timetableLoading}
            >
              重新整理
            </button>
            {timetableLoading && <div>載入中...</div>}
            <ul className="space-y-2">
              {timetableData.map((item, idx) => (
                <li key={idx} className="border-l-4 pl-2 border-cyan-400 bg-cyan-50/80 rounded">
                  <div>路線：{item.RouteName?.Zh_tw || "無資料"}</div>
                  <div>車牌：{item.PlateNumb || "無資料"}</div>
                  <div>站點：{item.StopName?.Zh_tw || "無資料"}</div>
                  <div>預估到站：{item.EstimateTime ? Math.round(item.EstimateTime / 60) + " 分" : "無資料"}</div>
                </li>
              ))}
            </ul>
            {timetableData.length === 0 && !timetableLoading && <div>查無資料</div>}
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
                </li>
              ))}
            </ul>
            {stopData.length === 0 && !stopLoading && <div>查無資料</div>}
          </section>
        )}
      </main>
      <footer className="text-center text-cyan-100 py-6 mt-10">
        © {new Date().getFullYear()} 雲林斗六公車路線查詢系統
      </footer>
    </div>
  );
}
/*
修改內容
標題:雲林斗六公車路線
描述:雲林斗六公車路線查詢系統，提供即時公車到站資訊、路線查詢、時刻表等功能，方便民眾出行。
漢堡:放入內容一到四
內容1(公車路線查詢):可輸入公車路線號碼的輸入框，並在下方顯示對應的公車路線資訊。使用者可以透過輸入框查詢特定的公車路線，並獲得相關的站點和時間表資訊。
7011 API:https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/YilanCounty/7011?%24top=30&%24format=JSON
201 API:https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/YilanCounty/201?%24top=30&%24format=JSON
101 API:https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/YilanCounty/101?%24top=30&%24format=JSON
內容2(公車預估到站時間):顯示選定公車路線的預估到站時間，並提供即時更新。使用者可以查看所選公車路線的預估到站時間，方便安排出行計劃。
API:https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/YunlinCounty?%24top=30&%24format=JSON
內容3(公車時刻表):提供公車路線的時刻表資訊，使用者可以查看各站點的發車時間。這有助於使用者了解公車的運行時間，便於計劃出行。
API:https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/YunlinCounty?%24top=30&%24format=JSON
內容4(公車站點資訊):顯示公車站點的詳細資訊，包括站點名稱、位置和相關服務。使用者可以查看各個公車站點的詳細資訊，方便找到所需的站點。
API:https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/City/YunlinCounty?%24top=30&%24format=JSON

幫我網頁色系訂為藍綠色
*/