import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, Calendar, User } from 'lucide-react';

interface ProcurementData {
  id: string;
  brand: string;
  model: string;
  version: string;
  leaseco: string;
  clientName: string;
  city: string;
  internalUsageDate: string;
  promisedDate: string;
  delayed: boolean;
  requestDate: string;
  licensePlate?: string;
  vin?: string;
  contractReference?: string;
  availabilityDate?: string;
  promisedDateAtSigning: string;
  currentEstimatedDelivery: string;
  clientComments?: string;
  desiredDeliveryDate: string;
  contractEndDate: string;
}

// Mock data - in real app this would come from HubSpot
const mockData: ProcurementData[] = [
  {
    id: '1',
    brand: 'BMW',
    model: 'X3',
    version: 'xDrive20d',
    leaseco: 'ALD Automotive',
    clientName: 'Juan García',
    city: 'Madrid',
    internalUsageDate: '2024-02-15',
    promisedDate: '2024-02-10',
    delayed: true,
    requestDate: '2024-01-10',
    licensePlate: '1234ABC',
    vin: 'WBA12345678901234',
    contractReference: 'CNT-2024-001',
    availabilityDate: '2024-02-05',
    promisedDateAtSigning: '2024-02-10',
    currentEstimatedDelivery: '2024-02-15',
    clientComments: 'Client prefers delivery in the morning',
    desiredDeliveryDate: '2024-02-08',
    contractEndDate: '2027-02-10'
  },
  {
    id: '2',
    brand: 'Audi',
    model: 'A4',
    version: '2.0 TDI',
    leaseco: 'Renting Finders',
    clientName: 'María López',
    city: 'Barcelona',
    internalUsageDate: '2024-02-20',
    promisedDate: '2024-02-25',
    delayed: false,
    requestDate: '2024-01-15',
    licensePlate: '',
    vin: '',
    contractReference: 'CNT-2024-002',
    availabilityDate: '2024-02-18',
    promisedDateAtSigning: '2024-02-25',
    currentEstimatedDelivery: '2024-02-20',
    desiredDeliveryDate: '2024-02-22',
    contractEndDate: '2027-02-25'
  },
  {
    id: '3',
    brand: 'Mercedes',
    model: 'C-Class',
    version: 'C200d',
    leaseco: 'Alphabet',
    clientName: 'Carlos Martín',
    city: 'Valencia',
    internalUsageDate: '2024-03-01',
    promisedDate: '2024-02-28',
    delayed: true,
    requestDate: '2024-01-20',
    licensePlate: '5678DEF',
    vin: 'WDD12345678901234',
    contractReference: 'CNT-2024-003',
    availabilityDate: '2024-02-25',
    promisedDateAtSigning: '2024-02-28',
    currentEstimatedDelivery: '2024-03-01',
    clientComments: 'Urgent delivery needed',
    desiredDeliveryDate: '2024-02-26',
    contractEndDate: '2027-02-28'
  }
];

const CarProcurementDashboard = () => {
  const [data] = useState(mockData);
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    leaseco: '',
    licensePlate: '',
    vin: '',
    contractReference: '',
    delayed: '',
    city: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filteredData = data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'all') return true;
      if (key === 'delayed') {
        return (value === 'yes' && item.delayed) || (value === 'no' && !item.delayed);
      }
      return item[key as keyof ProcurementData]?.toString().toLowerCase().includes(value.toLowerCase());
    });
  });

  const brands = [...new Set(data.map(item => item.brand))];
  const models = [...new Set(data.map(item => item.model))];
  const leasecos = [...new Set(data.map(item => item.leaseco))];
  const cities = [...new Set(data.map(item => item.city))];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Car Procurement Dashboard</h1>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.brand} onValueChange={(value) => setFilters(prev => ({ ...prev, brand: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.model} onValueChange={(value) => setFilters(prev => ({ ...prev, model: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {models.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.leaseco} onValueChange={(value) => setFilters(prev => ({ ...prev, leaseco: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Leaseco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leasecos</SelectItem>
                  {leasecos.map(leaseco => (
                    <SelectItem key={leaseco} value={leaseco}>{leaseco}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.delayed} onValueChange={(value) => setFilters(prev => ({ ...prev, delayed: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Delayed?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="License plate"
                value={filters.licensePlate}
                onChange={(e) => setFilters(prev => ({ ...prev, licensePlate: e.target.value }))}
              />
              <Input
                placeholder="VIN"
                value={filters.vin}
                onChange={(e) => setFilters(prev => ({ ...prev, vin: e.target.value }))}
              />
              <Input
                placeholder="Contract reference"
                value={filters.contractReference}
                onChange={(e) => setFilters(prev => ({ ...prev, contractReference: e.target.value }))}
              />
              <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Advanced Filters
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Availability Date Range</label>
                    <div className="flex gap-2">
                      <Input type="date" placeholder="From" />
                      <Input type="date" placeholder="To" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tracker Installation Date</label>
                    <div className="flex gap-2">
                      <Input type="date" placeholder="From" />
                      <Input type="date" placeholder="To" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Desired Delivery Date</label>
                    <div className="flex gap-2">
                      <Input type="date" placeholder="From" />
                      <Input type="date" placeholder="To" />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Procurement Operations ({filteredData.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Leaseco</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Internal Usage Date</TableHead>
                    <TableHead>Promised Date</TableHead>
                    <TableHead>Delayed?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="link" className="p-0 h-auto font-medium text-primary hover:underline">
                              {item.brand}
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Car Details: {item.brand} {item.model}
                              </SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                                <p className="text-sm">{new Date(item.requestDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">License Plate</label>
                                <p className="text-sm">{item.licensePlate || 'Not assigned'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">VIN</label>
                                <p className="text-sm">{item.vin || 'Not assigned'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Contract Reference</label>
                                <p className="text-sm">{item.contractReference || 'Not assigned'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Availability Date</label>
                                <p className="text-sm">
                                  {item.availabilityDate ? new Date(item.availabilityDate).toLocaleDateString() : 'Not confirmed'}
                                </p>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.version}</TableCell>
                      <TableCell>{item.leaseco}</TableCell>
                      <TableCell>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="link" className="p-0 h-auto font-medium text-primary hover:underline">
                              {item.clientName}
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Client Details: {item.clientName}
                              </SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Promised Date at Contract Signing</label>
                                <p className="text-sm">{new Date(item.promisedDateAtSigning).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Will we meet the promise?</label>
                                <Badge variant={item.delayed ? "destructive" : "default"}>
                                  {item.delayed ? "No" : "Yes"}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Current Estimated Delivery Date</label>
                                <p className="text-sm">{new Date(item.currentEstimatedDelivery).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Client Comments</label>
                                <p className="text-sm">{item.clientComments || 'No comments'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Desired Delivery Date</label>
                                <p className="text-sm">{new Date(item.desiredDeliveryDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Contract End Date</label>
                                <p className="text-sm">{new Date(item.contractEndDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                      <TableCell>{item.city}</TableCell>
                      <TableCell>{new Date(item.internalUsageDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(item.promisedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={item.delayed ? "destructive" : "default"}>
                          {item.delayed ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarProcurementDashboard;