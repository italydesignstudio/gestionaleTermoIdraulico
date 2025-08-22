import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProvenienzaData {
  provenienzaContatto: string;
  count: number;
}

interface ProvenienzaChartProps {
  data: ProvenienzaData[];
}

const ProvenienzaChart: React.FC<ProvenienzaChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <p>Nessun dato disponibile</p>
      </div>
    );
  }

  // Colori per il grafico
  const colors = [
    '#0d6efd', // primary
    '#6c757d', // secondary
    '#198754', // success
    '#dc3545', // danger
    '#ffc107', // warning
    '#0dcaf0', // info
    '#6f42c1', // purple
    '#fd7e14', // orange
    '#20c997', // teal
    '#e83e8c', // pink
    '#6610f2', // indigo
  ];

  const chartData = {
    labels: data.map(item => item.provenienzaContatto),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default ProvenienzaChart;
