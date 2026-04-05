import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, TrendingUp, Package, BarChart, Calendar, Loader2 } from "lucide-react";
import { useInventoryStore } from "@/store/useInventoryStore";
import { useDarkModeStore } from "@/store/useDarkModeStore";

export const KPICards = () => {
  const { kpiData, lowStockCount, isLoadingKPIs, error, fetchKPIData } = useInventoryStore();
  const { isDarkMode } = useDarkModeStore();

  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  const getChangeIcon = (type: string) => {
    if (type === "positive") return <ArrowUp className="h-3 w-3" />;
    if (type === "negative") return <ArrowDown className="h-3 w-3" />;
    return null;
  };

  const getChangeColor = (type: string) => {
    if (type === "positive") return isDarkMode ? "text-green-400" : "text-green-600";
    if (type === "negative") return isDarkMode ? "text-red-400" : "text-red-600";
    return isDarkMode ? "text-gray-400" : "text-gray-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Convert KPIData into display format
  const getKPICards = () => {
    if (!kpiData) return [];

    return [
      {
        title: "Inventory Value",
        value: formatCurrency(kpiData.total_inventory_value),
        change: "Live",
        changeType: "positive",
        icon: TrendingUp,
        description: "from connected data"
      },
      {
        title: "Total Products",
        value: formatNumber(kpiData.total_products),
        change: "SKU",
        changeType: "positive",
        icon: Package,
        description: "active products"
      },
      {
        title: "Low Stock Alerts",
        value: formatNumber(lowStockCount),
        change: lowStockCount > 0 ? "Review" : "OK",
        changeType: lowStockCount > 0 ? "negative" : "positive",
        icon: Package,
        description: "items below threshold"
      },
      {
        title: "Avg Turnover",
        value: `${kpiData.average_turnover.toFixed(1)}x`,
        change: "FY",
        changeType: "positive",
        icon: BarChart,
        description: "annual turnover"
      }
    ];
  };

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`col-span-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <CardContent className="pt-6">
            <div className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              <p className="font-medium">Error loading KPIs</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingKPIs || !kpiData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className={`hover:shadow-lg transition-shadow ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''
            }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                <div className={`h-4 w-20 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
              </CardTitle>
              <Loader2 className={`h-4 w-4 animate-spin ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
            </CardHeader>
            <CardContent>
              <div className={`h-8 w-16 rounded animate-pulse mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              <div className={`h-4 w-24 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiCards = getKPICards();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {kpiCards.map((kpi, index) => (
        <Card key={index} className="glass-dark border-white/5 hover:border-purple-500/50 hover:glow-purple transition-all duration-500 group overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-purple-400/80">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-outfit tracking-tight">{kpi.value}</div>
            <div className="flex items-center space-x-2 text-[10px] mt-2 font-bold uppercase tracking-wider">
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 ${getChangeColor(kpi.changeType)}`}>
                {getChangeIcon(kpi.changeType)}
                {kpi.change}
              </span>
              <span className="text-gray-500">{kpi.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
