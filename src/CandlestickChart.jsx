import React from "react";
import CanvasJSReact from "@canvasjs/react-charts";
 
const CanvasJSChart = CanvasJSReact?.CanvasJSChart || null;
 
export default function CandlestickChart({ options }) {
  if (!options) return null;
  
  if (!CanvasJSChart) {
    return (
      <div className="my-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
        <p>⚠️ Chart library not loaded. Please refresh the page.</p>
      </div>
    );
  }
  
  return (
    <div className="my-4">
      <CanvasJSChart options={options} />
    </div>
  );
}