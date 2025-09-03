import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function StudentProgressChart({ studentId }) {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentTests();
  }, [studentId]);

  const fetchStudentTests = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_student_tests/${studentId}`);
      const data = await response.json();
      setTestData(data);
    } catch (error) {
      console.error('Test ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Yuklanmoqda...</div>;

  const chartData = {
    labels: testData.map(test => `Test ${test.test_number}`),
    datasets: [
      {
        label: 'O\'quvchi Balli',
        data: testData.map(test => test.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true
      },
      {
        label: 'O\'rtacha Ball',
        data: testData.map(test => test.average_score),
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Test Natijalari Progressi'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Grafigi</h3>
      <Line data={chartData} options={options} />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {testData.map((test, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Test #{test.test_number}</span>
              <span className="text-sm text-gray-500">{new Date(test.date).toLocaleDateString('uz-UZ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sizning balingiz: <strong>{test.score}</strong></span>
              <span>O'rtacha: <strong>{test.average_score.toFixed(1)}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentProgressChart;