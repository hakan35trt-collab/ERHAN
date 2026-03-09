import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CompanyChart({ visitors }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    console.log('CompanyChart - Gelen visitors:', visitors);
    
    if (!visitors || visitors.length === 0) {
      console.log('CompanyChart - Veri yok');
      setChartData([]);
      return;
    }

    // Firma bazında içeride ve çıkmış kişi sayısını hesapla
    const companyStats = {};
    
    visitors.forEach(visitor => {
      // Firma adını al
      let company = visitor.company;
      
      // Boş, null, undefined kontrolü
      if (!company || company.trim() === '') {
        company = 'BELİRTİLMEMİŞ';
      } else {
        company = company.trim().toUpperCase();
      }
      
      console.log('İşleniyor:', visitor.first_name, visitor.last_name, 'Firma:', company);
      
      // Initialize company stats if not exists
      if (!companyStats[company]) {
        companyStats[company] = { inside: 0, exited: 0 };
      }
      
      // Ana ziyaretçi sayısı
      const totalVisitors = 1 + (visitor.vehicle_visitors?.length || 0);
      
      // İçeride mi çıkmış mı kontrolü
      if (!visitor.exit_time) {
        companyStats[company].inside += totalVisitors;
      } else {
        companyStats[company].exited += totalVisitors;
      }
    });

    console.log('Firma İstatistikleri:', companyStats);

    // Chart data formatı
    const data = Object.entries(companyStats)
      .map(([company, stats]) => ({
        company: company.length > 12 ? company.substring(0, 12) + '...' : company,
        fullCompany: company,
        inside: stats.inside,
        exited: stats.exited,
        total: stats.inside + stats.exited
      }))
      .sort((a, b) => b.total - a.total);

    console.log('Chart Data:', data);
    setChartData(data);
  }, [visitors]);

  const COLORS = [
    '#FBBF24', // amber-400
    '#F59E0B', // amber-500
    '#D97706', // amber-600
    '#B45309', // amber-700
    '#92400E', // amber-800
    '#78350F', // amber-900
    '#FCD34D', // amber-300
    '#FDE68A', // amber-200
    '#F97316', // orange-500
    '#EA580C'  // orange-600
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border-2 border-amber-600 p-3 rounded-lg shadow-lg">
          <p className="text-amber-400 font-bold">{payload[0].payload.fullCompany}</p>
          <p className="text-green-400 text-sm">İçeride: {payload[0].payload.inside}</p>
          <p className="text-gray-400 text-sm">Çıkmış: {payload[0].payload.exited}</p>
          <p className="text-amber-300 text-sm font-bold">Toplam: {payload[0].payload.total}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2">
        <CardHeader className="border-b border-amber-600/30">
          <CardTitle className="flex items-center space-x-2 text-amber-400 text-lg">
            <Building2 className="w-5 h-5" />
            <span>Firma Bazlı Ziyaretçi İstatistiği</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-amber-600">
            Henüz veri bulunmuyor.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2">
      <CardHeader className="py-1.5 px-2 border-b border-amber-600/30">
        <CardTitle className="flex items-center justify-between text-amber-400 text-xs">
          <div className="flex items-center space-x-1.5">
            <Building2 className="w-3 h-3" />
            <span>Firma İstatistik</span>
          </div>
          <span className="text-[10px] text-amber-600">{chartData.length} Firma</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1.5">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className="bg-gray-700/50 p-1.5 rounded border border-amber-600/30 hover:border-amber-600/50 transition-all"
            >
              <div className="flex items-center space-x-1 mb-0.5">
                <div 
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-amber-400 text-[10px] font-semibold truncate" title={item.fullCompany}>
                  {item.fullCompany}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-xs">
                <span className="text-green-400 font-bold">{item.inside}</span>
                <span className="text-amber-600">/</span>
                <span className="text-gray-400 font-bold">{item.exited}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}