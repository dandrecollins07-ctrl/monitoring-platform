import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const colors = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

function ResponseTimeChart({ metrics }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (!metrics || Object.keys(metrics).length === 0) return;

    // Use timestamps from the first URL as labels
    const firstUrl = Object.keys(metrics)[0];
    const labels = metrics[firstUrl].map((entry) =>
      new Date(entry.checked_at).toLocaleTimeString()
    );

    const datasets = Object.entries(metrics).map(([url, entries], index) => ({
      label: url,
      data: entries.map((entry) => entry.response_time_ms),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      tension: 0.3,
    }));

    setChartData({
      labels,
      datasets,
    });
  }, [metrics]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Response Time by URL",
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Response Time (ms)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Checked At",
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

export default ResponseTimeChart;