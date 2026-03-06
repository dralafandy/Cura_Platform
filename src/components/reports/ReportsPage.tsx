import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, FunnelChart, Funnel, LabelList, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartBar, FaMoneyBillWave, FaUserInjured, FaTooth, FaHospitalUser, FaCalendarAlt, FaDownload, FaChartPie, FaChartLine, FaChartArea, FaChartRadar, FaChartFunnel } from 'react-icons/fa';

// Mock data - In a real application, this would come from your backend
const mockData = {
  kpi: [
    { id: 'revenue', title: 'Total Revenue', value: 125000, change: 12.5, icon: <FaMoneyBillWave /> },
    { id: 'profit', title: 'Net Profit', value: 75000, change: 8.3, icon: <FaChartBar /> },
    { id: 'patients', title: 'Active Patients', value: 1240, change: 5.2, icon: <FaUserInjured /> },
    { id: 'completion', title: 'Completion Rate', value: 92, change: 3.1, suffix: '%' },
    { id: 'doctors', title: 'Total Doctors', value: 8, change: 0, icon: <FaHospitalUser /> },
    { id: 'treatments', title: 'Treatments Completed', value: 1240, change: 15.7, icon: <FaTooth /> },
  ],
  revenueData: [
    { name: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
    { name: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
    { name: 'Mar', revenue: 2000, expenses: 9800, profit: 1200 },
    { name: 'Apr', revenue: 2780, expenses: 3908, profit: 2000 },
    { name: 'May', revenue: 1890, expenses: 4800, profit: 2100 },
    { name: 'Jun', revenue: 2390, expenses: 3800, profit: 2200 },
    { name: 'Jul', revenue: 3490, expenses: 4300, profit: 2100 },
  ],
  expenseData: [
    { name: 'Equipment', value: 4000 },
    { name: 'Staff Salaries', value: 3000 },
    { name: 'Rent', value: 2000 },
    { name: 'Utilities', value: 1700 },
    { name: 'Marketing', value: 1200 },
  ],
  patientData: [
    { name: 'New Patients', value: 400 },
    { name: 'Returning Patients', value: 600 },
    { name: 'Referrals', value: 240 },
  ],
  treatmentData: [
    { name: 'Cleaning', value: 300 },
    { name: 'Filling', value: 200 },
    { name: 'Extraction', value: 150 },
    { name: 'Implant', value: 100 },
    { name: 'Braces', value: 80 },
  ],
  doctorData: [
    { name: 'Dr. Smith', cleanings: 70, fillings: 50, extractions: 20 },
    { name: 'Dr. Johnson', cleanings: 55, fillings: 45, extractions: 30 },
    { name: 'Dr. Williams', cleanings: 65, fillings: 60, extractions: 25 },
    { name: 'Dr. Brown', cleanings: 45, fillings: 70, extractions: 35 },
  ],
  supplierData: [
    { name: 'MedSupply Co.', amount: 5000 },
    { name: 'DentalTech', amount: 4500 },
    { name: 'OralCare Inc.', amount: 3800 },
    { name: 'HygienePro', amount: 3200 },
  ],
};

// Sparkline component for KPI trends
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  return (
    <div className="h-10 w-full relative">
      <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 10} 40`} className="overflow-visible">
        <polyline
          points={data.map((value, index) => `${index * 10},${40 - ((value - minValue) / range) * 40}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="font-bold text-gray-800 dark:text-gray-200">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Animated counter for KPI values
const AnimatedCounter = ({ value, suffix = '', duration = 1000 }: { value: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16); // 60fps animation
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
      {Math.round(count).toLocaleString()}{suffix}
    </span>
  );
};

// Chart selector component
const ChartSelector = ({ 
  options, 
  selected, 
  onSelect 
}: { 
  options: { id: string; label: string; icon: React.ReactNode }[]; 
  selected: string; 
  onSelect: (id: string) => void; 
}) => {
  return (
    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`flex items-center px-3 py-1.5 rounded-md transition-all ${
            selected === option.id
              ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="mr-2">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

// Export chart as image
const exportChartAsImage = (chartId: string, filename: string) => {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) return;

  // This would require html2canvas to be installed
  // import('html2canvas').then(({ default: html2canvas }) => {
  //   html2canvas(chartElement).then(canvas => {
  //     const link = document.createElement('a');
  //     link.download = `${filename}.png`;
  //     link.href = canvas.toDataURL();
  //     link.click();
  //   });
  // });
};

const ReportsPage = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [chartTypes, setChartTypes] = useState({
    overview: 'bar',
    financial: 'line',
    patient: 'pie',
    doctor: 'radar',
    treatment: 'bar',
    supplier: 'funnel'
  });

  // Chart type options
  const chartOptions = [
    { id: 'bar', label: 'Bar', icon: <FaChartBar /> },
    { id: 'line', label: 'Line', icon: <FaChartLine /> },
    { id: 'area', label: 'Area', icon: <FaChartArea /> },
    { id: 'pie', label: 'Pie', icon: <FaChartPie /> },
    { id: 'radar', label: 'Radar', icon: <FaChartRadar /> },
    { id: 'funnel', label: 'Funnel', icon: <FaChartFunnel /> },
  ];

  // Render chart based on type
  const renderChart = (data: any[], keys: string[], colors: string[], type: string, id: string) => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
              <YAxis tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              {keys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
              <YAxis tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              {keys.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index]} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
              <YAxis tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              {keys.map((key, index) => (
                <Area 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stackId="1"
                  stroke={colors[index]} 
                  fill={colors[index]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, 'Value']} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              {keys.map((key, index) => (
                <Radar
                  key={key}
                  dataKey={key}
                  stroke={colors[index]}
                  fill={colors[index]}
                  fillOpacity={0.2}
                />
              ))}
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'funnel':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
              <YAxis tick={{ fill: '#6B7280' }} />
              <Tooltip />
              <Funnel
                dataKey="amount"
                data={data}
                isAnimationActive
              >
                <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
              <YAxis tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              {keys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.kpi.slice(0, 3).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</p>
                      <div className="mt-2 flex items-baseline">
                        <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-green-500 text-sm">
                      <span>{kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%</span>
                      <span className="ml-2">from last month</span>
                    </div>
                    <Sparkline data={[20, 35, 25, 40, 30, 45, kpi.value / 1000]} color="#10B981" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Revenue Overview</h3>
                  <ChartSelector
                    options={chartOptions}
                    selected={chartTypes.overview}
                    onSelect={(type) => setChartTypes({ ...chartTypes, overview: type })}
                  />
                </div>
                <div id="revenue-chart">
                  {renderChart(
                    mockData.revenueData,
                    ['revenue', 'expenses', 'profit'],
                    ['#4F46E5', '#EF4444', '#10B981'],
                    chartTypes.overview,
                    'revenue'
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Expense Distribution</h3>
                  <ChartSelector
                    options={chartOptions.filter(opt => ['pie', 'bar', 'funnel'].includes(opt.id))}
                    selected={chartTypes.overview}
                    onSelect={(type) => setChartTypes({ ...chartTypes, overview: type })}
                  />
                </div>
                <div id="expense-chart">
                  {renderChart(
                    mockData.expenseData,
                    ['value'],
                    ['#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981'],
                    chartTypes.overview === 'pie' ? 'pie' : 'bar',
                    'expense'
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.kpi.slice(0, 3).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</p>
                      <div className="mt-2 flex items-baseline">
                        <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-green-500 text-sm">
                      <span>{kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%</span>
                      <span className="ml-2">from last month</span>
                    </div>
                    <Sparkline data={[20, 35, 25, 40, 30, 45, kpi.value / 1000]} color="#10B981" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Daily Financial Trends</h3>
                <div className="flex space-x-3">
                  <ChartSelector
                    options={chartOptions}
                    selected={chartTypes.financial}
                    onSelect={(type) => setChartTypes({ ...chartTypes, financial: type })}
                  />
                  <button 
                    onClick={() => exportChartAsImage('financial-trends', 'financial-trends')}
                    className="flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <FaDownload className="mr-2" /> Export
                  </button>
                </div>
              </div>
              <div id="financial-trends">
                {renderChart(
                  mockData.revenueData,
                  ['revenue', 'expenses', 'profit'],
                  ['#4F46E5', '#EF4444', '#10B981'],
                  chartTypes.financial,
                  'financial'
                )}
              </div>
            </div>
          </div>
        );

      case 'patient':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.kpi.slice(3, 6).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</p>
                      <div className="mt-2 flex items-baseline">
                        <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-green-500 text-sm">
                      <span>{kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%</span>
                      <span className="ml-2">from last month</span>
                    </div>
                    <Sparkline data={[20, 35, 25, 40, 30, 45, kpi.value / 100]} color="#10B981" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Patient Distribution</h3>
                  <ChartSelector
                    options={chartOptions.filter(opt => ['pie', 'bar', 'funnel'].includes(opt.id))}
                    selected={chartTypes.patient}
                    onSelect={(type) => setChartTypes({ ...chartTypes, patient: type })}
                  />
                </div>
                <div id="patient-distribution">
                  {renderChart(
                    mockData.patientData,
                    ['value'],
                    ['#F59E0B', '#8B5CF6', '#EC4899'],
                    chartTypes.patient === 'pie' ? 'pie' : 'bar',
                    'patient'
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Patient Value Distribution</h3>
                  <button 
                    onClick={() => exportChartAsImage('patient-value', 'patient-value')}
                    className="flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <FaDownload className="mr-2" /> Export
                  </button>
                </div>
                <div id="patient-value">
                  {renderChart(
                    mockData.patientData,
                    ['value'],
                    ['#3B82F6', '#10B981', '#F59E0B'],
                    'area',
                    'patient-value'
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'doctor':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.kpi.slice(4, 6).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</p>
                      <div className="mt-2 flex items-baseline">
                        <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-green-500 text-sm">
                      <span>{kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%</span>
                      <span className="ml-2">from last month</span>
                    </div>
                    <Sparkline data={[20, 35, 25, 40, 30, 45, kpi.value / 10]} color="#10B981" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Doctor Performance Comparison</h3>
                <ChartSelector
                  options={chartOptions.filter(opt => ['radar', 'bar'].includes(opt.id))}
                  selected={chartTypes.doctor}
                  onSelect={(type) => setChartTypes({ ...chartTypes, doctor: type })}
                />
              </div>
              <div id="doctor-performance">
                {renderChart(
                  mockData.doctorData,
                  ['cleanings', 'fillings', 'extractions'],
                  ['#4F46E5', '#10B981', '#F59E0B'],
                  chartTypes.doctor,
                  'doctor'
                )}
              </div>
            </div>
          </div>
        );

      case 'treatment':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.kpi.slice(5).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</p>
                      <div className="mt-2 flex items-baseline">
                        <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-green-500 text-sm">
                      <span>{kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%</span>
                      <span className="ml-2">from last month</span>
                    </div>
                    <Sparkline data={[20, 35, 25, 40, 30, 45, kpi.value / 100]} color="#10B981" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Treatment Frequency</h3>
                  <ChartSelector
                    options={chartOptions}
                    selected={chartTypes.treatment}
                    onSelect={(type) => setChartTypes({ ...chartTypes, treatment: type })}
                  />
                </div>
                <div id="treatment-frequency">
                  {renderChart(
                    mockData.treatmentData,
                    ['value'],
                    ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    chartTypes.treatment === 'pie' ? 'pie' : 'bar',
                    'treatment'
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Treatment Revenue</h3>
                  <button 
                    onClick={() => exportChartAsImage('treatment-revenue', 'treatment-revenue')}
                    className="flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <FaDownload className="mr-2" /> Export
                  </button>
                </div>
                <div id="treatment-revenue">
                  {renderChart(
                    mockData.treatmentData,
                    ['value'],
                    ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    'area',
                    'treatment-revenue'
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'supplier':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.kpi.slice(0, 3).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</p>
                      <div className="mt-2 flex items-baseline">
                        <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-green-500 text-sm">
                      <span>{kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%</span>
                      <span className="ml-2">from last month</span>
                    </div>
                    <Sparkline data={[20, 35, 25, 40, 30, 45, kpi.value / 1000]} color="#10B981" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Supplier Comparison</h3>
                <ChartSelector
                  options={chartOptions.filter(opt => ['bar', 'funnel', 'pie'].includes(opt.id))}
                  selected={chartTypes.supplier}
                  onSelect={(type) => setChartTypes({ ...chartTypes, supplier: type })}
                />
              </div>
              <div id="supplier-comparison">
                {renderChart(
                  mockData.supplierData,
                  ['amount'],
                  ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                  chartTypes.supplier === 'funnel' ? 'funnel' : 'bar',
                  'supplier'
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reports Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive analytics and insights for your clinic
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
                { id: 'financial', label: 'Financial', icon: <FaMoneyBillWave /> },
                { id: 'patient', label: 'Patient', icon: <FaUserInjured /> },
                { id: 'doctor', label: 'Doctor', icon: <FaHospitalUser /> },
                { id: 'treatment', label: 'Treatment', icon: <FaTooth /> },
                { id: 'supplier', label: 'Supplier', icon: <FaCalendarAlt /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportsPage;