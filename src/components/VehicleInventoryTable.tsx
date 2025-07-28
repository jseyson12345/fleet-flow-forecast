
import React, { useState, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  version: string;
  availableStock: number;
  burnRate: number;
  factoryOrderLeadTime: number | null;
}

interface ImportedData {
  Brand: string;
  Model: string;
  Version: string;
  'Available Stock': number;
  'Burn Rate': number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const getStockStatus = (eos: number): { color: string; label: string } => {
    if (eos < 2) return { color: 'destructive', label: 'Critical' };
    if (eos <= 4) return { color: 'warning', label: 'Low' };
    if (eos <= 8) return { color: 'secondary', label: 'Medium' };
    return { color: 'default', label: 'Good' };
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

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const parseImportedData = (importedData: ImportedData[]): VehicleData[] => {
    return importedData.map((row, index) => ({
      id: `imported-${Date.now()}-${index}`,
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
            setData(importedData);
            toast({
              title: "Success!",
              description: `Imported ${importedData.length} vehicles from CSV file.`,
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
          setData(importedData);
          toast({
            title: "Success!",
            description: `Imported ${importedData.length} vehicles from Excel file.`,
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
                           EOS (weeks)
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Estimated Out of Stock (Available Stock / Burn Rate)</p>
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
                  const eos = vehicle.burnRate > 0 ? vehicle.availableStock / vehicle.burnRate : Infinity;
                  const adjustedBurnRate = getAdjustedBurnRate(vehicle.burnRate);
                  const weeksUntilEmpty = calculateEstimatedOutOfStock(vehicle.availableStock, vehicle.burnRate);
                  const status = getStockStatus(eos);
                  const needsAttention = eos <= 4;
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
                          eos < 2 ? 'text-destructive' : 
                          eos <= 4 ? 'text-warning' : 
                          'text-foreground'
                        }`}>
                          {eos === Infinity ? '∞' : `${eos.toFixed(1)}`}
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
