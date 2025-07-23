
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  version: string;
  availableStock: number;
  burnRate: number;
  factoryOrderLeadTime: number | null;
}

type TimeFrame = 'week' | 'day' | '5days' | '30days' | 'month';

const timeFrameOptions = [
  { value: 'week', label: 'Per Week', multiplier: 1 },
  { value: 'day', label: 'Per Day', multiplier: 7 },
  { value: '5days', label: 'Last 5 Days', multiplier: 1.4 },
  { value: '30days', label: 'Last 30 Days', multiplier: 0.233 },
  { value: 'month', label: 'Per Month', multiplier: 0.25 },
];

const mockData: VehicleData[] = [
  {
    id: '1',
    brand: 'BMW',
    model: 'X3',
    version: 'xDrive30i M Sport',
    availableStock: 45,
    burnRate: 8,
    factoryOrderLeadTime: 12,
  },
  {
    id: '2',
    brand: 'Mercedes-Benz',
    model: 'C-Class',
    version: 'C220d AMG Line',
    availableStock: 12,
    burnRate: 15,
    factoryOrderLeadTime: 16,
  },
  {
    id: '3',
    brand: 'Audi',
    model: 'A4',
    version: 'Avant 2.0 TDI S-Line',
    availableStock: 8,
    burnRate: 6,
    factoryOrderLeadTime: null,
  },
  {
    id: '4',
    brand: 'Volkswagen',
    model: 'Golf',
    version: 'GTI 2.0 TSI',
    availableStock: 3,
    burnRate: 12,
    factoryOrderLeadTime: 8,
  },
  {
    id: '5',
    brand: 'Tesla',
    model: 'Model Y',
    version: 'Long Range AWD',
    availableStock: 25,
    burnRate: 20,
    factoryOrderLeadTime: 4,
  },
];

export const VehicleInventoryTable: React.FC = () => {
  const [data, setData] = useState<VehicleData[]>(mockData);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');

  const getTimeFrameConfig = () => {
    return timeFrameOptions.find(option => option.value === timeFrame) || timeFrameOptions[0];
  };

  const calculateEstimatedOutOfStock = (stock: number, burnRate: number): number => {
    const config = getTimeFrameConfig();
    const adjustedBurnRate = burnRate / config.multiplier;
    if (adjustedBurnRate === 0) return Infinity;
    return Math.round((stock / adjustedBurnRate) * 10) / 10;
  };

  const getAdjustedBurnRate = (burnRate: number): number => {
    const config = getTimeFrameConfig();
    return Math.round((burnRate / config.multiplier) * 10) / 10;
  };

  const getStockStatus = (weeksUntilEmpty: number): { color: string; label: string } => {
    if (weeksUntilEmpty <= 2) return { color: 'destructive', label: 'Critical' };
    if (weeksUntilEmpty <= 4) return { color: 'warning', label: 'Low' };
    if (weeksUntilEmpty <= 8) return { color: 'info', label: 'Medium' };
    return { color: 'success', label: 'Good' };
  };

  const calculateRecommendedOrderDate = (weeksUntilEmpty: number, factoryLeadTime: number | null): Date | null => {
    if (factoryLeadTime === null || weeksUntilEmpty === Infinity) return null;
    
    const weeksToOrder = weeksUntilEmpty - factoryLeadTime;
    const today = new Date();
    const recommendedDate = new Date(today);
    recommendedDate.setDate(today.getDate() + (weeksToOrder * 7));
    
    return recommendedDate;
  };

  const getDateStatus = (date: Date | null): { variant: string; isPast: boolean; isWithin7Days: boolean } => {
    if (!date) return { variant: 'secondary', isPast: false, isWithin7Days: false };
    
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isPast = diffDays < 0;
    const isWithin7Days = diffDays >= 0 && diffDays <= 7;
    
    return { 
      variant: isPast ? 'destructive' : isWithin7Days ? 'warning' : 'secondary',
      isPast,
      isWithin7Days
    };
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const updateFactoryOrderLeadTime = (id: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    if (numValue !== null && (isNaN(numValue) || numValue < 0)) return;
    
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, factoryOrderLeadTime: numValue } : item
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Vehicle Inventory Management</CardTitle>
            <p className="text-muted-foreground mt-1">
              Track vehicle stock levels, burn rates, and procurement planning
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="timeframe" className="text-sm font-medium">
                Time Frame:
              </label>
              <Select value={timeFrame} onValueChange={(value: TimeFrame) => setTimeFrame(value)}>
                <SelectTrigger id="timeframe" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeFrameOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-mint hover:bg-mint/80">
                  <TableHead className="font-semibold text-white">Brand</TableHead>
                  <TableHead className="font-semibold text-white">Model</TableHead>
                  <TableHead className="font-semibold text-white">Version</TableHead>
                  <TableHead className="font-semibold text-center text-white">Available Stock</TableHead>
                  <TableHead className="font-semibold text-center text-white">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          BR ({getTimeFrameConfig().label.toLowerCase()})
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Burn Rate ({getTimeFrameConfig().label.toLowerCase()})</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="font-semibold text-center text-white">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          EOS
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Estimated Out of Stock</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="font-semibold text-center text-white">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          FLT (weeks)
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Factory Lead Time (weeks)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="font-semibold text-center text-white">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          ROD
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recommended Order Date</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="font-semibold text-center text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((vehicle) => {
                  const adjustedBurnRate = getAdjustedBurnRate(vehicle.burnRate);
                  const weeksUntilEmpty = calculateEstimatedOutOfStock(vehicle.availableStock, vehicle.burnRate);
                  const status = getStockStatus(weeksUntilEmpty);
                  const needsAttention = weeksUntilEmpty <= 4;
                  const recommendedOrderDate = calculateRecommendedOrderDate(weeksUntilEmpty, vehicle.factoryOrderLeadTime);
                  const dateStatus = getDateStatus(recommendedOrderDate);

                  return (
                    <TableRow key={vehicle.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{vehicle.brand}</TableCell>
                      <TableCell className="font-medium">{vehicle.model}</TableCell>
                      <TableCell className="text-muted-foreground">{vehicle.version}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">{vehicle.availableStock}</span>
                          {needsAttention && <AlertTriangle className="h-4 w-4 text-warning" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingDown className="h-3 w-3 text-muted-foreground" />
                          <span>{adjustedBurnRate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${
                          weeksUntilEmpty <= 2 ? 'text-destructive' : 
                          weeksUntilEmpty <= 4 ? 'text-warning' : 
                          'text-foreground'
                        }`}>
                          {weeksUntilEmpty === Infinity ? '∞' : `${weeksUntilEmpty} weeks`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          value={vehicle.factoryOrderLeadTime ?? ''}
                          onChange={(e) => updateFactoryOrderLeadTime(vehicle.id, e.target.value)}
                          placeholder="Enter weeks"
                          className="w-24 text-center bg-white text-black border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {dateStatus.isPast && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {dateStatus.isWithin7Days && !dateStatus.isPast && <Calendar className="h-4 w-4 text-warning" />}
                          <span className={`font-medium ${
                            dateStatus.isPast ? 'text-destructive' : 
                            dateStatus.isWithin7Days ? 'text-warning' : 
                            'text-foreground'
                          }`}>
                            {formatDate(recommendedOrderDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={status.color as any}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
