import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertTriangle, TrendingDown } from 'lucide-react';

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  version: string;
  availableStock: number;
  burnRate: number;
  factoryOrderLeadTime: number | null;
}

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

  const calculateEstimatedOutOfStock = (stock: number, burnRate: number): number => {
    if (burnRate === 0) return Infinity;
    return Math.round((stock / burnRate) * 10) / 10;
  };

  const getStockStatus = (weeksUntilEmpty: number): { color: string; label: string } => {
    if (weeksUntilEmpty <= 2) return { color: 'destructive', label: 'Critical' };
    if (weeksUntilEmpty <= 4) return { color: 'warning', label: 'Low' };
    if (weeksUntilEmpty <= 8) return { color: 'info', label: 'Medium' };
    return { color: 'success', label: 'Good' };
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
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Brand</TableHead>
                  <TableHead className="font-semibold">Model</TableHead>
                  <TableHead className="font-semibold">Version</TableHead>
                  <TableHead className="font-semibold text-center">Available Stock</TableHead>
                  <TableHead className="font-semibold text-center">Burn Rate (per week)</TableHead>
                  <TableHead className="font-semibold text-center">Est. Out of Stock</TableHead>
                  <TableHead className="font-semibold text-center">Factory Lead Time (weeks)</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((vehicle) => {
                  const weeksUntilEmpty = calculateEstimatedOutOfStock(vehicle.availableStock, vehicle.burnRate);
                  const status = getStockStatus(weeksUntilEmpty);
                  const needsAttention = weeksUntilEmpty <= 4;

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
                          <span>{vehicle.burnRate}</span>
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
                          className="w-24 text-center"
                        />
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