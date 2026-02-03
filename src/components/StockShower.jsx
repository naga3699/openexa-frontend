import { useEffect, useState } from "react";
import StockChart from "./StockChart";

export default function StockShower() {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [nextDay, setNextDay] = useState(null);
  const [monteCarlo, setMonteCarlo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/fetch?ticker=${selectedTicker}`
      );
      const json = await res.json();
      setData(json.data); // save the data
      setMetrics(json.metrics);
      setNextDay(json.nextDay);
      setMonteCarlo(json.mcLogReturn);
    } catch (err) {
      console.error("Error fetching:", err);
    }

    setLoading(false);
  };

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setProgress(i);
      if (i >= 100) clearInterval(interval);
    }, 10); // 0.2 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const tickers = [
    "IAU",
    "IVV",
    "BTC",
    "IBIT",
    "GBTC",
    "FBTC",
    "ARKB",
    "BITB",
    "HODL",
    "BRRR",
  ];
  const [selectedTicker, setSelectedTicker] = useState("GBTC");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-3xl text-white/85">
          Log Return Prediction For{" "}
          <span className="text-blue-700">{selectedTicker}</span>
        </h2>
        <div className="flex flex-col">
          <div className="flex gap-3 h-fit">
            {tickers.map((ticker) => (
              <button
                onClick={() => setSelectedTicker(ticker)}
                className={`uppercase transition-all text-sm font-semibold px-6 py-3 cursor-pointer font-mono rounded text-white ${
                  selectedTicker === ticker
                    ? "bg-blue-700 hover:bg-blue-700/80"
                    : "bg-blue-700/20 hover:bg-blue-700/50"
                }`}
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {data.length > 0 ? (
          <div>
            <StockChart data={data} />
          </div>
        ) : (
          <div className="w-full h-[420px] rounded-2xl border-gray-400 border flex items-center justify-center">
            <span className="text-gray-500 text-xl font-thin">
              Run Model To Generate Graph
            </span>
          </div>
        )}
        {metrics && (
          <div className="flex gap-6">
            <div className="flex flex-col gap-2 p-6 border border-slate-800 w-fit rounded-2xl">
              <h2 className="text-white/85 font-semibold text-xl">Metrics</h2>

              <div className="flex gap-3">
                <MetricCard name={"MSE"} value={metrics.mse.toFixed(4)} />
                <MetricCard name={"RMSE"} value={metrics.rmse.toFixed(4)} />
                <MetricCard name={"R²"} value={metrics.r2.toFixed(3)} />
                <MetricCard name={"MAE"} value={metrics.mae.toFixed(4)} />
                <MetricCard name={"DA%"} value={metrics.direc.toFixed(1)} />
              </div>
            </div>

            <div className="flex flex-col gap-2 p-6 border border-slate-800 w-fit rounded-2xl">
              <h2 className="text-white/85 font-semibold text-xl">
                Predictions
              </h2>

              <div className="flex gap-3">
                <MetricCard name={"Next Day"} value={nextDay.toFixed(4)} />
                <MetricCard
                  name={"90% Confidence"}
                  value={`${monteCarlo.p5.toFixed(
                    4
                  )} to ${monteCarlo.p95.toFixed(4)}`}
                />
                <MetricCard name={"P(POS)"} value={monteCarlo.probPositive} />
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={fetchPredictions}
        className="bg-linear-to-r hover:scale-105 transition-all from-purple-500 to-purple-800 group rounded-full flex items-center px-12 w-fit hover:bg-violet-800/80 cursor-pointer h-12 text-white font-semibold"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-white">Epoch {progress}/100</p>

            <div className="h-6 w-6 rounded-full border-[3px] border-slate-700 border-t-white border-r-white border-b-white animate-spin" />
          </div>
        ) : (
          <span className="uppercase text-xs tracking-wider">Run Model</span>
        )}
      </button>
    </div>
  );
}

function MetricCard({ name, value }) {
  return (
    <div className="bg-[#0b1120] px-4 py-3 flex flex-col rounded-xl">
      <span className="font-semibold text-xs text-white/85">{name}</span>
      <span className="text-white/85 font-mono">{value}</span>
    </div>
  );
}
