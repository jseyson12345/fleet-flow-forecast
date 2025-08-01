import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, Calendar, User, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface ProcurementData {
  id: string;
  brand: string;
  model: string;
  version: string;
  color?: string;
  revelIdCar?: string;
  status?: string;
  project?: string;
  leaseco: string;
  clientName: string;
  city: string;
  internalUsageDate: string;
  promisedDate: string;
  displayedDateToClient: string;
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
  // Leaseco dates
  leasecoRequestDate?: string;
  etdDate?: string;
  registrationStartDate?: string;
  deliveryReadyDate?: string;
  // Tracker dates
  trackerRequestDate?: string;
  estimatedInstallationDate?: string;
  actualInstallationDate?: string;
  // Delivery dealer info
  dealerName?: string;
  contactPerson?: string;
  phoneEmail?: string;
  // Deal signed date
  dealSignedDate?: string;
}

// Template column headers for import/export
const TEMPLATE_HEADERS = [
  'Ticket ID',
  'RevelIdCar',
  'Brand',
  'Model',
  'Version',
  'Color',
  'Leaseco',
  'Status',
  'Project',
  'License Plate',
  'Chassis Number',
  'Contract Reference',
  'Internal Use Date',
  'Promised Date to Client',
  'Displayed Date to Client',
  'Leaseco Request Date',
  'ETD Date',
  'Registration Start Date',
  'Delivery Ready Date',
  'Tracker Request Date',
  'Estimated Tracker Installation',
  'Actual Tracker Installation',
  'Dealer Name',
  'Contact Person',
  'Phone/Email',
  'Client Name',
  'Client City / Location',
  'Deal Signed Date',
  'Comments'
];

// Mock data - in real app this would come from HubSpot
const mockData: ProcurementData[] = [
  {
    id: '1',
    brand: 'BMW',
    model: 'X3',
    version: 'xDrive20d',
    color: 'Mineral Grey Metallic',
    revelIdCar: 'RVL-BMW-001',
    status: 'In Transit',
    project: 'Corporate Fleet 2024',
    leaseco: 'ALD Automotive',
    clientName: 'Juan García',
    city: 'Madrid',
    internalUsageDate: '2024-02-15',
    promisedDate: '2024-02-10',
    displayedDateToClient: '2024-02-12',
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
    contractEndDate: '2027-02-10',
    leasecoRequestDate: '2024-01-12',
    etdDate: '2024-02-01',
    registrationStartDate: '2024-02-03',
    deliveryReadyDate: '2024-02-14',
    trackerRequestDate: '2024-02-05',
    estimatedInstallationDate: '2024-02-10',
    actualInstallationDate: '2024-02-09',
    dealerName: 'BMW Madrid Centro',
    contactPerson: 'Ana Ruiz',
    phoneEmail: '+34 91 123 4567 / ana.ruiz@bmwmadrid.com'
  },
  {
    id: '2',
    brand: 'Audi',
    model: 'A4',
    version: '2.0 TDI',
    color: 'Ibis White',
    revelIdCar: 'RVL-AUDI-002',
    status: 'Order Placed',
    leaseco: 'Renting Finders',
    clientName: 'María López',
    city: 'Barcelona',
    internalUsageDate: '2024-02-20',
    promisedDate: '2024-02-25',
    displayedDateToClient: '2024-02-25',
    delayed: false,
    requestDate: '2024-01-15',
    licensePlate: '',
    vin: '',
    contractReference: 'CNT-2024-002',
    availabilityDate: '2024-02-18',
    promisedDateAtSigning: '2024-02-25',
    currentEstimatedDelivery: '2024-02-20',
    desiredDeliveryDate: '2024-02-22',
    contractEndDate: '2027-02-25',
    leasecoRequestDate: '2024-01-17',
    trackerRequestDate: '2024-02-15',
    estimatedInstallationDate: '2024-02-20'
  },
  {
    id: '3',
    brand: 'Mercedes',
    model: 'C-Class',
    version: 'C200d',
    color: 'Obsidian Black Metallic',
    revelIdCar: 'RVL-MERC-003',
    status: 'Production',
    project: 'Executive Fleet',
    leaseco: 'Alphabet',
    clientName: 'Carlos Martín',
    city: 'Valencia',
    internalUsageDate: '2024-03-01',
    promisedDate: '2024-02-28',
    displayedDateToClient: '2024-03-05',
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
    contractEndDate: '2027-02-28',
    leasecoRequestDate: '2024-01-22',
    etdDate: '2024-02-20',
    registrationStartDate: '2024-02-22',
    deliveryReadyDate: '2024-03-01',
    trackerRequestDate: '2024-02-25',
    estimatedInstallationDate: '2024-03-01',
    dealerName: 'Mercedes Valencia',
    contactPerson: 'Pedro Sánchez',
    phoneEmail: '+34 96 987 6543 / pedro.sanchez@mbvalencia.com'
  }
];

const CarProcurementDashboard = () => {
  const [data, setData] = useState(mockData);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Template download function
  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Car Procurement Template');
    XLSX.writeFile(workbook, 'car_procurement_template.xlsx');
    
    toast({
      title: "Template Downloaded",
      description: "The import template has been downloaded successfully.",
    });
  };

  // Parse imported data function
  const parseImportedData = (importData: any[]): ProcurementData[] => {
    return importData.map((row, index) => {
      const id = row['Ticket ID'] || `imported-${Date.now()}-${index}`;
      
      // Helper function to parse dates or return empty string for empty/null values
      const parseDate = (dateValue: any) => {
        // Handle all empty/null/undefined cases
        if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
          return '';
        }
        
        // Handle Excel's numeric date format (serial number)
        if (typeof dateValue === 'number') {
          // Excel dates start from 1900-01-01, but we need to handle empty cells that might be 0
          if (dateValue === 0) return '';
          
          // Convert Excel serial date to JavaScript date
          const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
          return isNaN(excelDate.getTime()) ? '' : excelDate.toISOString().split('T')[0];
        }
        
        // Handle dd/mm/yyyy format
        if (typeof dateValue === 'string' && dateValue.includes('/')) {
          const parts = dateValue.split('/');
          if (parts.length === 3) {
            // Convert dd/mm/yyyy to yyyy-mm-dd
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            const isoDate = `${year}-${month}-${day}`;
            const date = new Date(isoDate);
            return isNaN(date.getTime()) ? '' : isoDate;
          }
        }
        
        // Fallback for other string formats
        if (typeof dateValue === 'string') {
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        }
        
        return '';
      };

      // Calculate delayed status only if both dates are present
      const internalDateStr = parseDate(row['Internal Use Date']);
      const promisedDateStr = parseDate(row['Promised Date to Client']);
      const delayed = internalDateStr && promisedDateStr ? 
        new Date(internalDateStr) > new Date(promisedDateStr) : false;

      return {
        id,
        brand: row['Brand'] || '',
        model: row['Model'] || '',
        version: row['Version'] || '',
        color: row['Color'],
        revelIdCar: row['RevelIdCar'],
        status: row['Status'],
        project: row['Project'],
        leaseco: row['Leaseco'] || '',
        clientName: row['Client Name'] || '',
        city: row['Client City / Location'] || '',
        internalUsageDate: parseDate(row['Internal Use Date']),
        promisedDate: parseDate(row['Promised Date to Client']),
        displayedDateToClient: parseDate(row['Displayed Date to Client']),
        delayed,
        requestDate: parseDate(row['Leaseco Request Date']),
        licensePlate: row['License Plate'],
        vin: row['Chassis Number'],
        contractReference: row['Contract Reference'],
        availabilityDate: parseDate(row['Delivery Ready Date']),
        promisedDateAtSigning: parseDate(row['Promised Date to Client']),
        currentEstimatedDelivery: parseDate(row['Internal Use Date']),
        clientComments: row['Comments'],
        desiredDeliveryDate: parseDate(row['Promised Date to Client']),
        contractEndDate: '', // Don't auto-generate contract end date
        leasecoRequestDate: parseDate(row['Leaseco Request Date']),
        etdDate: parseDate(row['ETD Date']),
        registrationStartDate: parseDate(row['Registration Start Date']),
        deliveryReadyDate: parseDate(row['Delivery Ready Date']),
        trackerRequestDate: parseDate(row['Tracker Request Date']),
        estimatedInstallationDate: parseDate(row['Estimated Tracker Installation']),
        actualInstallationDate: parseDate(row['Actual Tracker Installation']),
        dealerName: row['Dealer Name'],
        contactPerson: row['Contact Person'],
        phoneEmail: row['Phone/Email'],
        dealSignedDate: parseDate(row['Deal Signed Date'])
      };
    });
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        if (file.name.endsWith('.csv')) {
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast({
            title: "Import Error",
            description: "The file appears to be empty.",
            variant: "destructive",
          });
          return;
        }

        // Check for required columns
        const firstRow = jsonData[0] as any;
        const missingColumns = ['Brand', 'Model', 'Leaseco', 'Client Name'].filter(
          col => !Object.keys(firstRow).includes(col)
        );

        if (missingColumns.length > 0) {
          toast({
            title: "Import Warning",
            description: `Missing required columns: ${missingColumns.join(', ')}. Some data may not display correctly.`,
            variant: "destructive",
          });
        }

        const parsedData = parseImportedData(jsonData);
        setData(parsedData);

        toast({
          title: "Import Successful",
          description: `Imported ${parsedData.length} records successfully.`,
        });

      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Error",
          description: "Failed to parse the file. Please check the format and try again.",
          variant: "destructive",
        });
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Car Procurement Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Import Template (.xlsx)
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
          </div>
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
                    {brands.filter(brand => brand && brand.trim()).map(brand => (
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
                    {models.filter(model => model && model.trim()).map(model => (
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
                    {leasecos.filter(leaseco => leaseco && leaseco.trim()).map(leaseco => (
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
                    {cities.filter(city => city && city.trim()).map(city => (
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
                          <SheetContent className="w-[500px] overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Car Details: {item.brand} {item.model}
                              </SheetTitle>
                            </SheetHeader>
                            
                            <div className="mt-6 space-y-6">
                              {/* Basic Information */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Leaseco</label>
                                    <p className="text-sm">{item.leaseco}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                                    <p className="text-sm">{item.brand}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Model</label>
                                    <p className="text-sm">{item.model}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Version</label>
                                    <p className="text-sm">{item.version}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Color</label>
                                    <p className="text-sm">{item.color || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">RevelIdCar</label>
                                    <p className="text-sm">{item.revelIdCar || 'Not assigned'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <p className="text-sm">{item.status || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Project</label>
                                    <p className="text-sm">{item.project || 'Not assigned'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Identification */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Identification</h3>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">License Plate</label>
                                    <p className="text-sm">{item.licensePlate || 'Not assigned'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Chassis Number</label>
                                    <p className="text-sm">{item.vin || 'Not assigned'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Contract Reference</label>
                                    <p className="text-sm">{item.contractReference || 'Not assigned'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Key Dates */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Key Dates</h3>
                                <div className="grid grid-cols-1 gap-3">
                                   <div>
                                     <label className="text-sm font-medium text-muted-foreground">Internal Use Date</label>
                                     <p className="text-sm">{item.internalUsageDate ? new Date(item.internalUsageDate).toLocaleDateString() : 'Not available'}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-muted-foreground">Promised Date to Client</label>
                                     <p className="text-sm">{item.promisedDate ? new Date(item.promisedDate).toLocaleDateString() : 'Not available'}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-muted-foreground">Displayed Date to Client</label>
                                     <p className="text-sm">{item.displayedDateToClient ? new Date(item.displayedDateToClient).toLocaleDateString() : 'Not available'}</p>
                                   </div>
                                </div>
                              </div>

                              {/* Leaseco Dates - Collapsible */}
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                    <span className="font-semibold">Leaseco Dates</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3 space-y-3">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Leaseco Request Date</label>
                                      <p className="text-sm">{item.leasecoRequestDate ? new Date(item.leasecoRequestDate).toLocaleDateString() : 'Not available'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">ETD Date</label>
                                      <p className="text-sm">{item.etdDate ? new Date(item.etdDate).toLocaleDateString() : 'Not available'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Registration Start Date</label>
                                      <p className="text-sm">{item.registrationStartDate ? new Date(item.registrationStartDate).toLocaleDateString() : 'Not available'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Delivery Ready Date</label>
                                      <p className="text-sm">{item.deliveryReadyDate ? new Date(item.deliveryReadyDate).toLocaleDateString() : 'Not available'}</p>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Tracker Dates - Collapsible */}
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                    <span className="font-semibold">Tracker Dates</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3 space-y-3">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Tracker Request Date</label>
                                      <p className="text-sm">{item.trackerRequestDate ? new Date(item.trackerRequestDate).toLocaleDateString() : 'Not available'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Estimated Installation Date</label>
                                      <p className="text-sm">{item.estimatedInstallationDate ? new Date(item.estimatedInstallationDate).toLocaleDateString() : 'Not available'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Actual Installation Date</label>
                                      <p className="text-sm">{item.actualInstallationDate ? new Date(item.actualInstallationDate).toLocaleDateString() : 'Not available'}</p>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Delivery Dealer Info - Collapsible */}
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                    <span className="font-semibold">Delivery Dealer Info</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3 space-y-3">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Dealer Name</label>
                                      <p className="text-sm">{item.dealerName || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                                      <p className="text-sm">{item.contactPerson || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Phone / Email</label>
                                      <p className="text-sm">{item.phoneEmail || 'Not available'}</p>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
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
                          <SheetContent className="w-[500px] overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Client Details: {item.clientName}
                              </SheetTitle>
                            </SheetHeader>
                            
                            <div className="mt-6 space-y-6">
                              {/* Personal Information */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Personal Information</h3>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                    <p className="text-sm">{item.clientName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">City / Location</label>
                                    <p className="text-sm">{item.city}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Key Dates */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Key Dates</h3>
                                <div className="grid grid-cols-1 gap-3">
                                   <div>
                                     <label className="text-sm font-medium text-muted-foreground">Internal Use Date</label>
                                     <p className="text-sm">{item.internalUsageDate ? new Date(item.internalUsageDate).toLocaleDateString() : 'Not available'}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-muted-foreground">Promised Date to Client</label>
                                     <p className="text-sm">{item.promisedDate ? new Date(item.promisedDate).toLocaleDateString() : 'Not available'}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-muted-foreground">Displayed Date to Client</label>
                                     <p className="text-sm">{item.displayedDateToClient ? new Date(item.displayedDateToClient).toLocaleDateString() : 'Not available'}</p>
                                   </div>
                                </div>
                              </div>

                              {/* Assigned Car - Collapsible */}
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                    <span className="font-semibold">Assigned Car</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3 space-y-3">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">RevelIdCar</label>
                                      <p className="text-sm">{item.revelIdCar || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">License Plate</label>
                                      <p className="text-sm">{item.licensePlate || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Chassis Number</label>
                                      <p className="text-sm">{item.vin || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Contract Reference</label>
                                      <p className="text-sm">{item.contractReference || 'Not assigned'}</p>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Delivery Status */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Delivery Status</h3>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Will we meet the promised date?</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={item.delayed ? "destructive" : "default"}>
                                        {item.delayed ? "No" : "Yes"}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        (Based on Internal Use Date vs. Promised Date)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Comments */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Comments</h3>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Any relevant comment</label>
                                    <p className="text-sm bg-muted/50 p-3 rounded-md border">{item.clientComments || 'No comments available'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                      <TableCell>{item.city}</TableCell>
                      <TableCell>{item.internalUsageDate ? new Date(item.internalUsageDate).toLocaleDateString() : 'Not available'}</TableCell>
                      <TableCell>{item.promisedDate ? new Date(item.promisedDate).toLocaleDateString() : 'Not available'}</TableCell>
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