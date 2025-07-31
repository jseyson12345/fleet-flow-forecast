
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, AlertTriangle, TrendingDown, Calendar, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface VehicleData {
  id: string;
  modelId?: string;
  brand: string;
  model: string;
  version: string;
  availableStock: number;
  burnRate: number;
  factoryOrderLeadTime: number | null;
}

interface ImportedData {
  modelId?: string;
  Brand: string;
  Model: string;
  Version: string;
  'Available Stock': number;
  'Burn Rate': number;
}

type TimeFrame = 'week' | 'day' | '5days' | '30days' | 'month';
type SortField = 'brand' | 'model' | 'version' | 'availableStock' | 'burnRate' | 'eosDate' | 'factoryOrderLeadTime' | 'rodDate' | 'status';
type SortDirection = 'asc' | 'desc';

interface FLTStorage {
  [modelId: string]: number;
}

const timeFrameOptions = [
  { value: 'week', label: 'Per Week', multiplier: 7 },
  { value: 'day', label: 'Per Day', multiplier: 1 },
  { value: '5days', label: 'Last 5 Days', multiplier: 5 },
  { value: '30days', label: 'Last 30 Days', multiplier: 30 },
  { value: 'month', label: 'Per Month', multiplier: 30 },
];

const STORAGE_KEYS = {
  VEHICLE_DATA: 'vehicle_inventory_data',
  FLT_VALUES: 'vehicle_inventory_flt_values',
};

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
  const [data, setData] = useState<VehicleData[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const [showModelId, setShowModelId] = useState(false);
  const [fltValues, setFltValues] = useState<FLTStorage>({});
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load persisted data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEYS.VEHICLE_DATA);
    const savedFLT = localStorage.getItem(STORAGE_KEYS.FLT_VALUES);
    
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to load saved data:', error);
        setData(mockData);
      }
    } else {
      setData(mockData);
    }
    
    if (savedFLT) {
      try {
        setFltValues(JSON.parse(savedFLT));
      } catch (error) {
        console.error('Failed to load saved FLT values:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem(STORAGE_KEYS.VEHICLE_DATA, JSON.stringify(data));
    }
  }, [data]);

  // Save FLT values to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FLT_VALUES, JSON.stringify(fltValues));
  }, [fltValues]);

  const getTimeFrameConfig = () => {
    return timeFrameOptions.find(option => option.value === timeFrame) || timeFrameOptions[0];
  };

  const calculateEstimatedOutOfStockDate = (stock: number, burnRate: number): Date | null => {
    if (!stock || !burnRate || burnRate <= 0) return null;
    
    const timeFrameConfig = getTimeFrameConfig();
    const adjustedBurnRate = getAdjustedBurnRate(burnRate);
    const daysUntilOutOfStock = stock / adjustedBurnRate;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysUntilOutOfStock);
    return futureDate;
  };

  const getAdjustedBurnRate = (burnRate: number): number => {
    const config = getTimeFrameConfig();
    return Math.round((burnRate / config.multiplier) * 10) / 10;
  };

  const getStockStatus = (eosDate: Date | null): { color: string; label: string } => {
    if (!eosDate) return { color: 'default', label: 'Good' };
    
    const today = new Date();
    const diffTime = eosDate.getTime() - today.getTime();
    const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7);
    
    if (diffWeeks < 2) return { color: 'destructive', label: 'Critical' };
    if (diffWeeks <= 4) return { color: 'warning', label: 'Low' };
    if (diffWeeks <= 8) return { color: 'secondary', label: 'Medium' };
    return { color: 'default', label: 'Good' };
  };

  const calculateRecommendedOrderDate = (eosDate: Date | null, factoryLeadTimeMonths: number | null): Date | null => {
    if (factoryLeadTimeMonths === null || !eosDate) return null;
    
    const recommendedDate = new Date(eosDate);
    // Convert decimal months to days (e.g., 4.5 months = 135 days)
    const daysToSubtract = factoryLeadTimeMonths * 30;
    recommendedDate.setDate(recommendedDate.getDate() - daysToSubtract);
    
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
    const parsedValue = value === '' ? null : parseFloat(value);
    
    // Find the vehicle and update both data and FLT storage
    setData(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, factoryOrderLeadTime: parsedValue };
        // Store FLT value by modelId for future imports
        if (item.modelId && parsedValue !== null) {
          setFltValues(prevFlt => ({
            ...prevFlt,
            [item.modelId!]: parsedValue
          }));
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Apply stored FLT values to imported data
  const applyStoredFLTValues = (importedData: VehicleData[]): VehicleData[] => {
    return importedData.map(item => ({
      ...item,
      factoryOrderLeadTime: item.modelId && fltValues[item.modelId] 
        ? fltValues[item.modelId] 
        : item.factoryOrderLeadTime
    }));
  };

  // Sorting functionality
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'brand':
          aValue = a.brand;
          bValue = b.brand;
          break;
        case 'model':
          aValue = a.model;
          bValue = b.model;
          break;
        case 'version':
          aValue = a.version;
          bValue = b.version;
          break;
        case 'availableStock':
          aValue = a.availableStock;
          bValue = b.availableStock;
          break;
        case 'burnRate':
          aValue = a.burnRate;
          bValue = b.burnRate;
          break;
        case 'eosDate':
          aValue = calculateEstimatedOutOfStockDate(a.availableStock, a.burnRate)?.getTime() || 0;
          bValue = calculateEstimatedOutOfStockDate(b.availableStock, b.burnRate)?.getTime() || 0;
          break;
        case 'factoryOrderLeadTime':
          aValue = a.factoryOrderLeadTime || 0;
          bValue = b.factoryOrderLeadTime || 0;
          break;
        case 'rodDate':
          const aEos = calculateEstimatedOutOfStockDate(a.availableStock, a.burnRate);
          const bEos = calculateEstimatedOutOfStockDate(b.availableStock, b.burnRate);
          aValue = calculateRecommendedOrderDate(aEos, a.factoryOrderLeadTime)?.getTime() || 0;
          bValue = calculateRecommendedOrderDate(bEos, b.factoryOrderLeadTime)?.getTime() || 0;
          break;
        case 'status':
          const aStatus = getStockStatus(calculateEstimatedOutOfStockDate(a.availableStock, a.burnRate));
          const bStatus = getStockStatus(calculateEstimatedOutOfStockDate(b.availableStock, b.burnRate));
          aValue = aStatus.label;
          bValue = bStatus.label;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1);
    });
  }, [data, sortField, sortDirection]);

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const parseImportedData = (importedData: ImportedData[]): VehicleData[] => {
    return importedData.map((row, index) => ({
      id: `imported-${Date.now()}-${index}`,
      modelId: row.modelId?.toString() || '',
      brand: row.Brand?.toString() || '',
      model: row.Model?.toString() || '',
      version: row.Version?.toString() || '',
      availableStock: Number(row['Available Stock']) || 0,
      burnRate: Number(row['Burn Rate']) || 0,
      factoryOrderLeadTime: null,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => {
          try {
            const importedData = parseImportedData(results.data as ImportedData[]);
            const dataWithStoredFLT = applyStoredFLTValues(importedData);
            setData(dataWithStoredFLT);
            toast({
              title: "Success!",
              description: `Imported ${dataWithStoredFLT.length} vehicles from CSV file.`,
            });
          } catch (error) {
            toast({
              title: "Import Error",
              description: "Failed to parse CSV file. Please check the format.",
              variant: "destructive",
            });
          }
        },
        header: true,
        skipEmptyLines: true,
        error: (error) => {
          toast({
            title: "Import Error",
            description: "Failed to read CSV file.",
            variant: "destructive",
          });
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportedData[];
          
          const importedData = parseImportedData(jsonData);
          const dataWithStoredFLT = applyStoredFLTValues(importedData);
          setData(dataWithStoredFLT);
          toast({
            title: "Success!",
            description: `Imported ${dataWithStoredFLT.length} vehicles from Excel file.`,
          });
        } catch (error) {
          toast({
            title: "Import Error",
            description: "Failed to parse Excel file. Please check the format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV or Excel (.xlsx/.xls) file.",
        variant: "destructive",
      });
    }
    
    // Reset the input
    event.target.value = '';
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModelId(!showModelId)}
                className="gap-2"
              >
                {showModelId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                Model ID
              </Button>
            </div>
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
              <Button variant="outline" className="gap-2" onClick={handleFileImport}>
                <Upload className="h-4 w-4" />
                Import Data
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-mint hover:bg-mint/80">
                  {showModelId && (
                    <TableHead className="font-semibold text-white">
                      Model ID
                    </TableHead>
                  )}
                  <TableHead 
                    className="font-semibold text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('brand')}
                  >
                    <div className="flex items-center">
                      Brand
                      {getSortIcon('brand')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('model')}
                  >
                    <div className="flex items-center">
                      Model
                      {getSortIcon('model')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('version')}
                  >
                    <div className="flex items-center">
                      Version
                      {getSortIcon('version')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-center text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('availableStock')}
                  >
                    <div className="flex items-center justify-center">
                      Available Stock
                      {getSortIcon('availableStock')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-center text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('burnRate')}
                  >
                    <div className="flex items-center justify-center">
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
                      {getSortIcon('burnRate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-center text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('eosDate')}
                  >
                    <div className="flex items-center justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            EOS
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Estimated Out of Stock Date</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {getSortIcon('eosDate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-center text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('factoryOrderLeadTime')}
                  >
                    <div className="flex items-center justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            FLT (months)
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Factory Lead Time (months)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {getSortIcon('factoryOrderLeadTime')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-center text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('rodDate')}
                  >
                    <div className="flex items-center justify-center">
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
                      {getSortIcon('rodDate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-center text-white cursor-pointer hover:bg-mint/60 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((vehicle) => {
                  const adjustedBurnRate = getAdjustedBurnRate(vehicle.burnRate);
                  const eosDate = calculateEstimatedOutOfStockDate(vehicle.availableStock, vehicle.burnRate);
                  const status = getStockStatus(eosDate);
                  const recommendedOrderDate = calculateRecommendedOrderDate(eosDate, vehicle.factoryOrderLeadTime);
                  const dateStatus = getDateStatus(recommendedOrderDate);
                  
                  // Calculate weeks until empty for attention indicator
                  const config = getTimeFrameConfig();
                  const adjustedBurnRateForWeeks = vehicle.burnRate / config.multiplier;
                  const weeksUntilEmpty = adjustedBurnRateForWeeks > 0 ? vehicle.availableStock / adjustedBurnRateForWeeks : Infinity;
                  const needsAttention = weeksUntilEmpty <= 4;

                  return (
                    <TableRow key={vehicle.id} className="hover:bg-muted/30 transition-colors">
                      {showModelId && <TableCell className="font-medium text-muted-foreground">{vehicle.modelId || '-'}</TableCell>}
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
                          !eosDate ? 'text-foreground' :
                          (() => {
                            const today = new Date();
                            const diffTime = eosDate.getTime() - today.getTime();
                            const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7);
                            if (diffWeeks < 2) return 'text-destructive';
                            if (diffWeeks <= 4) return 'text-warning';
                            return 'text-foreground';
                          })()
                        }`}>
                          {formatDate(eosDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={vehicle.factoryOrderLeadTime ?? ''}
                          onChange={(e) => updateFactoryOrderLeadTime(vehicle.id, e.target.value)}
                          placeholder="Enter months"
                          className="w-24 text-center bg-white text-black border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {dateStatus.isPast && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {dateStatus.isWithin7Days && !dateStatus.isPast && <Calendar className="h-4 w-4 text-warning" />}
                          {dateStatus.isPast && recommendedOrderDate ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="font-medium text-destructive cursor-help">
                                    ASAP
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Original date: {formatDate(recommendedOrderDate)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className={`font-medium ${
                              dateStatus.isPast ? 'text-destructive' : 
                              dateStatus.isWithin7Days ? 'text-warning' : 
                              'text-foreground'
                            }`}>
                              {formatDate(recommendedOrderDate)}
                            </span>
                          )}
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
