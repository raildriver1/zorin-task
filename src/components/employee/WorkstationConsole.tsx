
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Car, Users, Briefcase, DollarSign, ListChecks, CheckCircle, AlertTriangle, X, PlusCircle, Trash2, Search, Cog, CreditCard, Landmark, ChevronDown, Wand, Repeat, MessageSquare } from 'lucide-react';
import type { CounterAgent, Aggregator, PriceListItem, Car as CarType, RetailPriceConfig, PaymentType, Employee, WashEvent, EmployeeConsumption, WashComment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { normalizeLicensePlate } from "@/lib/utils";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { getCounterAgentsData, getAggregatorsData, getRetailPriceConfig, getEmployeesData, invalidateAggregatorsCache, invalidateCounterAgentsCache, getWashEventsData } from '@/lib/data-loader';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '../ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';


type OperationPaymentMethod = "cash" | "card" | "transfer" | "aggregator" | "counterAgentContract";
type CurrentStep = "idle" | "vehicleInput" | "paymentSelection" | "aggregatorSelection" | "serviceSelection" | "confirmation";

const priorityServiceKeywords = [
  'тягач', 
  '90 кубов',
  'европа',
  'америка',
  'полуприцеп',
  'самосвал',
  'цистерна'
];


export function WorkstationConsole() {
  const { employee: loggedInEmployee } = useAuth();
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');
  const [normalizedVehicleNumber, setNormalizedVehicleNumber] = useState('');
  
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Map<string, string>>(new Map());
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  const [foundCounterAgent, setFoundCounterAgent] = useState<CounterAgent | null>(null);
  const [foundAggregators, setFoundAggregators] = useState<Aggregator[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<OperationPaymentMethod | null>(null);
  const [selectedAggregator, setSelectedAggregator] = useState<Aggregator | null>(null);
  
  const [washServices, setWashServices] = useState<(PriceListItem & { id: string })[]>([]);
  const [lastWashServices, setLastWashServices] = useState<(PriceListItem & { id: string, isFromLastWash?: boolean })[] | null>(null);
  const [lastWashComment, setLastWashComment] = useState<WashComment | null>(null);
  const [driverComment, setDriverComment] = useState('');

  const lastConsumptionRef = useRef<Record<string, Record<string, number>>>({});


  const [customExtraServiceName, setCustomExtraServiceName] = useState('');
  const [customExtraServicePrice, setCustomExtraServicePrice] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [tempSelectedAggregatorId, setTempSelectedAggregatorId] = useState<string | undefined>(undefined);


  const [currentStep, setCurrentStep] = useState<CurrentStep>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [allCounterAgents, setAllCounterAgents] = useState<CounterAgent[]>([]);
  const [allAggregators, setAllAggregators] = useState<Aggregator[]>([]);
  const [allWashEvents, setAllWashEvents] = useState<WashEvent[]>([]);
  const [retailPriceConfig, setRetailPriceConfig] = useState<RetailPriceConfig>({ mainPriceList: [], additionalPriceList: [], allowCustomRetailServices: true, cardAcquiringPercentage: 1.2 });

  useEffect(() => {
    const savedShiftState = sessionStorage.getItem('isShiftActive');
    if (savedShiftState === 'true') {
      setIsShiftActive(true);
    }
  }, []);

  useEffect(() => {
    if (loggedInEmployee && loggedInEmployee.username !== 'admin' && !selectedEmployees.some(e => e.id === loggedInEmployee.id)) {
      setSelectedEmployees(prev => [...prev, loggedInEmployee]);
    }
  }, [loggedInEmployee]);

  useEffect(() => {
    async function fetchData() {
      if (isShiftActive) {
        setIsLoading(true);
        try {
          const [agentsData, aggregatorsData, retailData, employeesData, washEventsData] = await Promise.all([
            getCounterAgentsData(),
            getAggregatorsData(),
            getRetailPriceConfig(),
            getEmployeesData(),
            getWashEventsData()
          ]);
          setAllCounterAgents(agentsData);
          setAllAggregators(aggregatorsData);
          setRetailPriceConfig(retailData);
          const activeEmployees = employeesData.filter(e => e.username !== 'admin');
          setAllEmployees(activeEmployees);
          setEmployeeMap(new Map(activeEmployees.map(e => [e.id, e.fullName])));
          setAllWashEvents(washEventsData);
        } catch (error) {
          console.error("Error fetching data for workstation:", error);
          toast({ title: "Ошибка", description: "Не удалось загрузить данные для рабочей станции.", variant: "destructive"});
          setAllCounterAgents([]);
          setAllAggregators([]);
          setAllEmployees([]);
          setAllWashEvents([]);
          setRetailPriceConfig({ mainPriceList: [], additionalPriceList: [], allowCustomRetailServices: true, cardAcquiringPercentage: 1.2 });
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchData();
  }, [isShiftActive, toast]);


  useEffect(() => {
    sessionStorage.setItem('isShiftActive', String(isShiftActive));
    if (isShiftActive) {
      setCurrentStep("vehicleInput");
    } else {
      setCurrentStep("idle");
      resetForm();
    }
  }, [isShiftActive]);

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicleNumberInput(e.target.value);
    if (currentStep !== "vehicleInput" && currentStep !== "idle") {
        resetFormStateForNewVehicle(true);
    }
  };

  const checkVehicleNumber = () => {
    if (selectedEmployees.length === 0) {
      toast({ title: "Ошибка", description: "Выберите хотя бы одного сотрудника.", variant: "destructive" });
      return;
    }
    if (!vehicleNumberInput.trim()) {
      toast({ title: "Ошибка", description: "Введите номер машины.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const normalizedInput = normalizeLicensePlate(vehicleNumberInput);
    setNormalizedVehicleNumber(normalizedInput);

    resetFormStateForNewVehicle(true); 

    // Find last wash for this vehicle
    const lastWash = allWashEvents.find(event => event.vehicleNumber === normalizedInput);
    if (lastWash) {
        const services = [lastWash.services.main, ...lastWash.services.additional];
        setLastWashServices(services.map(s => ({ ...s, id: s.id || `last-wash-service-${s.serviceName}`, isFromLastWash: true })));
        if (lastWash.driverComments && lastWash.driverComments.length > 0) {
          setLastWashComment(lastWash.driverComments[lastWash.driverComments.length - 1]);
        }
    }


    const agent = allCounterAgents.find(ca =>
      ca.cars.some(car => car.licensePlate === normalizedInput)
    );

    if (agent) {
      setFoundCounterAgent(agent);
      if (agent.priceList && agent.priceList.length > 0) {
        setSelectedPaymentMethod("counterAgentContract");
        setCurrentStep("serviceSelection");
        toast({
          title: "Контрагент найден!",
          description: `${agent.name}. Применяется договорной прайс-лист.`,
        });
      } else {
        toast({
          title: "Ошибка данных контрагента",
          description: `У контрагента ${agent.name} нет прайс-листа. Обслуживание невозможно.`,
          variant: "destructive",
        });
          setCurrentStep("vehicleInput");
      }
      setIsLoading(false);
      return;
    }

    const aggregatorsWithCar = allAggregators.filter(agg => 
      agg.cars.some(car => car.licensePlate === normalizedInput)
    );

    if (aggregatorsWithCar.length > 0) {
      setFoundAggregators(aggregatorsWithCar);
      toast({ title: "Машина найдена в базе агрегаторов", description: `Рекомендуется выбрать оплату через агрегатора.` });
    } else {
      toast({ title: "Контрагент не найден", description: `Продолжите как розничный клиент.` });
    }
    
    setCurrentStep("paymentSelection");
    setIsLoading(false);
  };
  
  const handleEmployeeSelect = (employee: Employee) => {
    if (loggedInEmployee && employee.id === loggedInEmployee.id && loggedInEmployee.username !== 'admin') {
        toast({ title: "Нельзя снять себя", description: "Вы не можете убрать себя из команды.", variant: "destructive"});
        return;
    }

    setSelectedEmployees(prev => 
      prev.some(e => e.id === employee.id)
        ? prev.filter(e => e.id !== employee.id)
        : [...prev, employee]
    );
  };

  const handlePaymentMethodSelect = (method: "cash" | "card" | "transfer" | "aggregator") => {
    setSelectedPaymentMethod(method);
    setSelectedAggregator(null);
    setWashServices([]);

    if (method === 'aggregator') {
      if(allAggregators.length > 0) {
        setTempSelectedAggregatorId(foundAggregators?.[0]?.id);
        setCurrentStep("aggregatorSelection");
      } else {
        toast({ title: "Нет доступных агрегаторов", description: "Пожалуйста, добавьте агрегаторов в систему.", variant: "destructive" });
        setSelectedPaymentMethod(null);
        setCurrentStep("paymentSelection");
      }
    } else if (method === 'cash' || method === 'card' || method === 'transfer') {
      setCurrentStep("serviceSelection");
    }
  };

  const confirmAggregatorSelection = () => {
    if (!tempSelectedAggregatorId) return;
    const aggregator = allAggregators.find(a => a.id === tempSelectedAggregatorId);
    if (!aggregator) {
        toast({ title: "Ошибка", description: "Выбранный агрегатор не найден.", variant: "destructive" });
        return;
    }

    setSelectedAggregator(aggregator);
    setWashServices([]);

    const activePriceList = aggregator.priceLists.find(p => p.name === aggregator.activePriceListName) ?? aggregator.priceLists[0];

    if (activePriceList && activePriceList.services.length > 0) {
      setCurrentStep("serviceSelection");
    } else {
       toast({ title: "Нет услуг", description: `У агрегатора ${aggregator.name} нет активных услуг в прайс-листе.`, variant: "destructive" });
    }
  }
  
  const handleServiceSelect = (service: PriceListItem) => {
    setWashServices(prev => {
        const serviceWithId = { ...service, id: `service-${service.serviceName}-${Date.now()}` };
        // Check if service already exists
        if(prev.some(s => s.serviceName === service.serviceName)) {
            return prev.filter(s => s.serviceName !== service.serviceName); // Deselect
        }
        return [...prev, serviceWithId]; // Select
    });
  };

  const handleAddCustomExtraService = () => {
    if (!customExtraServiceName.trim() || !customExtraServicePrice.trim()) {
      toast({ title: "Ошибка", description: "Введите название и цену для дополнительной услуги.", variant: "destructive" });
      return;
    }
    const price = parseFloat(customExtraServicePrice);
    if (isNaN(price) || price < 0) {
      toast({ title: "Ошибка", description: "Цена дополнительной услуги должна быть положительным числом.", variant: "destructive" });
      return;
    }
    const serviceWithId = { 
      serviceName: customExtraServiceName, 
      price, 
      isCustom: true, 
      id: `custom-${customExtraServiceName}-${Date.now()}` 
    };
    setWashServices(prev => [...prev, serviceWithId]);
    
    setCustomExtraServiceName('');
    setCustomExtraServicePrice('');
  };

  const handleRemoveService = (serviceId: string) => {
    setWashServices(washServices.filter(s => s.id !== serviceId));
  };
  
  const calculateTotalPrice = () => {
    return washServices.reduce((sum, s) => sum + s.price, 0);
  };

  const proceedToConfirmation = () => {
    if (washServices.length === 0) {
        toast({ title: "Ошибка", description: "Не выбрано ни одной услуги.", variant: "destructive" });
        return;
    }
    setCurrentStep("confirmation");
  }

  const showPrices = selectedPaymentMethod !== 'counterAgentContract';
  
  const paymentMethodLabels: Record<OperationPaymentMethod, string> = {
    cash: 'Наличные',
    card: 'Карта',
    transfer: 'Перевод',
    aggregator: 'Агрегатор',
    counterAgentContract: 'По договору',
  };
  
  const totalAmount = calculateTotalPrice();
  const acquiringFee = selectedPaymentMethod === 'card' && retailPriceConfig.cardAcquiringPercentage
      ? totalAmount * ((retailPriceConfig.cardAcquiringPercentage || 0) / 100)
      : 0;
  const netAmount = totalAmount - acquiringFee;

  const updateBalance = async (entity: CounterAgent | Aggregator, amount: number, type: 'counterAgent' | 'aggregator'): Promise<boolean> => {
    const newBalance = (entity.balance ?? 0) - amount;
    const updatedEntity = { ...entity, balance: newBalance };

    const apiPath = type === 'counterAgent' ? '/api/counter-agents' : '/api/aggregators';
    try {
        const response = await fetch(`${apiPath}/${entity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEntity)
        });
        if (!response.ok) {
             console.error(`Не удалось обновить баланс для ${entity.name}.`);
             return false;
        }
        if (type === 'counterAgent') {
          await invalidateCounterAgentsCache();
          setAllCounterAgents(prev => prev.map(a => a.id === updatedEntity.id ? updatedEntity : a));
        } else {
          await invalidateAggregatorsCache();
          setAllAggregators(prev => prev.map(a => a.id === updatedEntity.id ? updatedEntity as Aggregator : a));
        }
        return true;
    } catch(error) {
        console.error(`Сетевая ошибка при обновлении баланса для ${entity.name}.`);
        return false;
    }
  };


  const confirmWash = async () => {
    setIsLoading(true);

    let finalSelectedAggregator = selectedAggregator;

    if (selectedPaymentMethod === 'counterAgentContract' && foundCounterAgent) {
        await updateBalance(foundCounterAgent, totalAmount, 'counterAgent');
    }

    if (selectedPaymentMethod === 'aggregator' && selectedAggregator) {
        const success = await updateBalance(selectedAggregator, totalAmount, 'aggregator');
        if (success) {
            finalSelectedAggregator = allAggregators.find(a => a.id === selectedAggregator.id) || selectedAggregator;
        }

        const carExists = finalSelectedAggregator.cars.some(car => car.licensePlate === normalizedVehicleNumber);
        if (!carExists) {
            const newCar: CarType = {
                id: `car_${finalSelectedAggregator.id}_${finalSelectedAggregator.cars.length + 1}_${normalizedVehicleNumber}`,
                licensePlate: normalizedVehicleNumber
            };
            const updatedAggregator = { ...finalSelectedAggregator, cars: [...finalSelectedAggregator.cars, newCar] };
            
            try {
                const response = await fetch(`/api/aggregators/${finalSelectedAggregator.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedAggregator)
                });
                if (!response.ok) {
                    console.error(`Не удалось добавить машину ${normalizedVehicleNumber} в автопарк агрегатора.`);
                } else {
                    setAllAggregators(prev => prev.map(a => a.id === updatedAggregator.id ? updatedAggregator : a));
                    await invalidateAggregatorsCache();
                }
            } catch (error) {
                 console.error(`Сетевая ошибка при сохранении машины в автопарк агрегатора.`);
            }
        }
    }
    
    if (washServices.length === 0 || !selectedPaymentMethod || selectedEmployees.length === 0) {
        toast({ title: "Ошибка", description: "Недостаточно данных для сохранения: проверьте выбор исполнителей и услуг.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const createDefaultConsumptions = (service: PriceListItem): EmployeeConsumption[] => {
        return selectedEmployees.map(emp => ({
            employeeId: emp.id,
            amount: service.chemicalConsumption || 0
        }));
    };

    const getPriceListNameForAggregator = () => {
      if (selectedPaymentMethod !== 'aggregator' || !finalSelectedAggregator) return undefined;
      const activeList = finalSelectedAggregator.priceLists.find(pl => pl.name === finalSelectedAggregator.activePriceListName) ?? finalSelectedAggregator.priceLists[0];
      return activeList?.name;
    }

    const mainService = washServices[0];
    const additional = washServices.slice(1);
    
    const newWashComment = driverComment ? { text: driverComment, authorId: loggedInEmployee!.id, date: new Date().toISOString() } : undefined;
    
    const washEventToSave: Omit<WashEvent, 'driverComment'> & { driverComments?: WashComment[] } = {
        id: `we_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        vehicleNumber: normalizedVehicleNumber,
        employeeIds: selectedEmployees.map(e => e.id),
        paymentMethod: selectedPaymentMethod,
        sourceId: selectedPaymentMethod === 'aggregator' ? finalSelectedAggregator?.id : (selectedPaymentMethod === 'counterAgentContract' ? foundCounterAgent?.id : undefined),
        sourceName: selectedPaymentMethod === 'aggregator' ? finalSelectedAggregator?.name : (selectedPaymentMethod === 'counterAgentContract' ? foundCounterAgent?.name : undefined),
        priceListName: getPriceListNameForAggregator(),
        totalAmount: totalAmount,
        netAmount: netAmount,
        acquiringFee: acquiringFee,
        services: {
            main: { 
                ...mainService,
                employeeConsumptions: createDefaultConsumptions(mainService)
            },
            additional: additional.map(s => ({
                ...s,
                employeeConsumptions: createDefaultConsumptions(s)
            })),
        },
        driverComments: newWashComment ? [newWashComment] : undefined,
    };

    try {
        const response = await fetch('/api/wash-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(washEventToSave),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось сохранить мойку.');
        }

        toast({
            title: "Мойка зарегистрирована!",
            description: `Данные о мойке для ${normalizedVehicleNumber} успешно сохранены в журнале.`,
            variant: "default",
            action: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
        resetFormStateForNewVehicle(false, true);
    } catch (error: any) {
        console.error("Error saving wash event:", error);
        toast({
            title: "Ошибка сохранения",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const resetFormStateForNewVehicle = (soft = false, keepEmployees = false) => {
    if(!soft) {
      setVehicleNumberInput('');
      setNormalizedVehicleNumber('');
      if (!keepEmployees) {
        setSelectedEmployees((loggedInEmployee && loggedInEmployee.username !== 'admin') ? [loggedInEmployee] : []);
      }
    }
    setFoundCounterAgent(null);
    setFoundAggregators([]);
    setSelectedPaymentMethod(null);
    setSelectedAggregator(null);
    setWashServices([]);
    setCustomExtraServiceName('');
    setCustomExtraServicePrice('');
    setLastWashServices(null);
    setLastWashComment(null);
    setDriverComment('');
    setCurrentStep(isShiftActive ? "vehicleInput" : "idle");
    setServiceSearchQuery('');
    setTempSelectedAggregatorId(undefined);
  }


  const resetForm = () => {
    resetFormStateForNewVehicle();
  };

  const canAddCustomServices =
    (['cash', 'card', 'transfer'].includes(selectedPaymentMethod || '') && (retailPriceConfig.allowCustomRetailServices ?? true)) ||
    (selectedPaymentMethod === 'counterAgentContract' && (foundCounterAgent?.allowCustomServices ?? true));
  
  const predefinedExtraServices = 
    ['cash', 'card', 'transfer'].includes(selectedPaymentMethod || '') ? retailPriceConfig.additionalPriceList :
    (selectedPaymentMethod === 'counterAgentContract' ? foundCounterAgent?.additionalPriceList :
    []);

  const getAggregatorActiveServices = () => {
    if (selectedPaymentMethod !== 'aggregator' || !selectedAggregator) return [];
    const activeList = selectedAggregator.priceLists.find(pl => pl.name === selectedAggregator.activePriceListName) ?? selectedAggregator.priceLists[0];
    return activeList?.services || [];
  };

  const servicesToShow = 
    selectedPaymentMethod === 'counterAgentContract' && foundCounterAgent?.priceList ? foundCounterAgent.priceList :
    selectedPaymentMethod === 'aggregator' ? getAggregatorActiveServices() :
    ['cash', 'card', 'transfer'].includes(selectedPaymentMethod || '') ? retailPriceConfig.mainPriceList :
    [];

  const sortedServices = useMemo(() => {
      const allAvailableServices = [...servicesToShow];
      const serviceNames = new Set(allAvailableServices.map(s => s.serviceName));

      // Add services from the last wash if they don't already exist in the current price list
      if (lastWashServices) {
          lastWashServices.forEach(lastService => {
              if (!serviceNames.has(lastService.serviceName)) {
                  allAvailableServices.push(lastService);
                  serviceNames.add(lastService.serviceName);
              }
          });
      }

      return allAvailableServices.slice().sort((a, b) => {
          const aIsFromLast = lastWashServices?.some(s => s.serviceName === a.serviceName);
          const bIsFromLast = lastWashServices?.some(s => s.serviceName === b.serviceName);

          if (aIsFromLast && !bIsFromLast) return -1;
          if (!aIsFromLast && bIsFromLast) return 1;

          const aName = a.serviceName.toLowerCase();
          const bName = b.serviceName.toLowerCase();
          const aIsPriority = priorityServiceKeywords.some(keyword => aName.includes(keyword));
          const bIsPriority = priorityServiceKeywords.some(keyword => bName.includes(keyword));

          if (aIsPriority && !bIsPriority) return -1;
          if (!aIsPriority && bIsPriority) return 1;
          
          return a.serviceName.localeCompare(b.serviceName);
      });
  }, [servicesToShow, lastWashServices]);

  const filteredServices = sortedServices.filter(s => 
    s.serviceName.toLowerCase().includes(serviceSearchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Управление сменой</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Button
            onClick={() => setIsShiftActive(true)}
            disabled={isShiftActive || isLoading}
            variant="default"
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading && !isShiftActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Начать смену
          </Button>
          <Button
            onClick={() => setIsShiftActive(false)}
            disabled={!isShiftActive}
            variant="destructive"
            size="lg"
          >
            Завершить смену
          </Button>
          <Badge variant={isShiftActive ? "default" : "secondary"} className={`text-lg px-4 py-2 ${isShiftActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {isShiftActive ? "Смена активна" : "Смена закрыта"}
          </Badge>
        </CardContent>
      </Card>

      {isShiftActive && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Регистрация мойки</CardTitle>
            <CardDescription>Выберите команду на смену, затем введите номер машины. Система автоматически определит тип клиента.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(currentStep !== "idle") && (
              <div className="space-y-4 p-4 border rounded-md bg-background shadow-sm">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <Label className="text-lg font-medium mb-2 block">1. Команда на смене</Label>
                        <div className="flex flex-wrap gap-2 items-center">
                            {selectedEmployees.map(e => <Badge key={e.id} variant="default" className="text-base px-3 py-1">{e.fullName}</Badge>)}
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" />Добавить/убрать</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <ScrollArea className="h-60">
                                    <div className="p-2 space-y-1">
                                    {allEmployees.map(employee => (
                                        <div key={employee.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                                            <Checkbox
                                                id={`emp-partner-${employee.id}`}
                                                checked={selectedEmployees.some(e => e.id === employee.id)}
                                                onCheckedChange={() => handleEmployeeSelect(employee)}
                                            />
                                            <Label htmlFor={`emp-partner-${employee.id}`} className="font-normal flex-1 cursor-pointer">{employee.fullName}</Label>
                                        </div>
                                    ))}
                                    </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div>
                      <Label htmlFor="vehicleNumber" className="text-lg font-medium mb-2 block">2. Введите номер машины</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="vehicleNumber"
                          type="text"
                          value={vehicleNumberInput}
                          onChange={handleVehicleNumberChange}
                          placeholder="Например, А123ВС777"
                          className="text-base flex-grow"
                          disabled={isLoading}
                        />
                        <Button onClick={checkVehicleNumber} disabled={isLoading || !vehicleNumberInput.trim() || selectedEmployees.length === 0}>
                          {isLoading && normalizedVehicleNumber ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Car className="mr-2 h-4 w-4" />}
                          Проверить
                        </Button>
                      </div>
                       {normalizedVehicleNumber && <p className="text-sm text-muted-foreground mt-1">Нормализованный: {normalizedVehicleNumber}</p>}
                    </div>
                </div>

                 {lastWashComment?.text && (
                    <Accordion type="single" collapsible className="w-full mt-3">
                        <AccordionItem value="item-1" className="border-amber-200 bg-amber-50 rounded-lg">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline text-amber-800">
                                <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-amber-600" />
                                <span className="font-semibold">Есть комментарий от предыдущей смены</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <blockquote className="border-l-2 border-amber-300 pl-4 text-amber-900 italic">
                                {lastWashComment.text}
                                </blockquote>
                                <p className="text-xs text-amber-800/70 mt-2 text-right">
                                    Автор: {employeeMap.get(lastWashComment.authorId) || 'Неизвестно'} ({format(new Date(lastWashComment.date), 'dd.MM.yyyy HH:mm', { locale: ru })})
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                 )}

                 {foundCounterAgent && (
                    <Alert variant="default" className="mt-3">
                        <Users className="h-4 w-4" />
                        <AlertTitle>Контрагент: {foundCounterAgent.name}</AlertTitle>
                    </Alert>
                )}
                 {selectedAggregator && (
                    <Alert variant="default" className="mt-3">
                        <Briefcase className="h-4 w-4" />
                        <AlertTitle>Агрегатор: {selectedAggregator.name}</AlertTitle>
                    </Alert>
                )}
              </div>
            )}

            {currentStep === "paymentSelection" && (
              <Card className="bg-muted/30 animate-in fade-in-20">
                <CardHeader>
                     <CardTitle className="flex items-center"><Car className="mr-2"/>Розничный клиент</CardTitle>
                     <CardDescription>Выберите способ оплаты для машины с номером {normalizedVehicleNumber}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {foundAggregators && foundAggregators.length > 0 && (
                    <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Машина найдена в базе агрегаторов!</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Эта машина числится у агрегатора(ов): <strong>{foundAggregators.map(a => a.name).join(', ')}</strong>.
                        </AlertDescription>
                    </Alert>
                  )}
                  <Label className="text-md font-medium mb-3 block">Выберите способ оплаты:</Label>
                  <RadioGroup
                    onValueChange={(value) => handlePaymentMethodSelect(value as "cash" | "card" | "transfer" | "aggregator")}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    <Label htmlFor="cash" className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-background cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
                      <RadioGroupItem value="cash" id="cash" className="sr-only" />
                      <DollarSign className="h-8 w-8 mb-2 text-green-600"/>
                      <span className="font-semibold">Наличные</span>
                    </Label>
                     <Label htmlFor="card" className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-background cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
                      <RadioGroupItem value="card" id="card" className="sr-only"/>
                      <CreditCard className="h-8 w-8 mb-2 text-blue-600"/>
                      <span className="font-semibold">Карта</span>
                    </Label>
                    <Label htmlFor="transfer" className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-background cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
                      <RadioGroupItem value="transfer" id="transfer" className="sr-only"/>
                      <Landmark className="h-8 w-8 mb-2 text-purple-600"/>
                      <span className="font-semibold">Перевод</span>
                    </Label>
                    <Label htmlFor="aggregator" className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-background cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
                      <RadioGroupItem value="aggregator" id="aggregator" className="sr-only"/>
                      <Briefcase className="h-8 w-8 mb-2 text-indigo-600"/>
                      <span className="font-semibold">Агрегатор</span>
                    </Label>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}
            
            {currentStep === "aggregatorSelection" && (
              <Card className="bg-muted/30 animate-in fade-in-20">
                <CardHeader>
                  <CardTitle className="flex items-center"><Briefcase className="mr-2"/>Выберите агрегатора</CardTitle>
                </CardHeader>
                <CardContent>
                  {allAggregators.length > 0 ? (
                    <>
                    <RadioGroup
                      onValueChange={setTempSelectedAggregatorId}
                      value={tempSelectedAggregatorId}
                      className="space-y-2"
                    >
                      {allAggregators.map(agg => (
                        <Label key={agg.id} htmlFor={`agg-${agg.id}`} className={cn("flex items-center space-x-2 p-3 border rounded-md hover:bg-background cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary", foundAggregators.some(fa => fa.id === agg.id) && "bg-blue-50 border-blue-200")}>
                          <RadioGroupItem value={agg.id} id={`agg-${agg.id}`} />
                          <span className="font-medium text-base">{agg.name}</span>
                           {foundAggregators.some(fa => fa.id === agg.id) && <Badge variant="secondary">В автопарке</Badge>}
                        </Label>
                      ))}
                    </RadioGroup>
                    <div className="flex justify-end mt-4">
                      <Button onClick={confirmAggregatorSelection} disabled={!tempSelectedAggregatorId} size="lg">
                        Далее
                      </Button>
                    </div>
                    </>
                  ) : (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Нет агрегаторов</AlertTitle>
                        <AlertDescription>В системе нет зарегистрированных агрегатов. Пожалуйста, добавьте их.</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === "serviceSelection" && (
              <Card className="bg-muted/30 animate-in fade-in-20">
                <CardHeader>
                  <CardTitle className="flex items-center"><ListChecks className="mr-2"/>Выберите услуги</CardTitle>
                   {selectedPaymentMethod && ['cash', 'card', 'transfer'].includes(selectedPaymentMethod) && !foundCounterAgent && <CardDescription>Услуга для розничного клиента ({paymentMethodLabels[selectedPaymentMethod]}).</CardDescription>}
                   {selectedPaymentMethod === 'counterAgentContract' && foundCounterAgent && <CardDescription>Специальные услуги для контрагента: <strong>{foundCounterAgent.name}</strong> (по договору).</CardDescription>}
                   {selectedPaymentMethod === 'aggregator' && selectedAggregator && <CardDescription>Услуги для агрегатора: <strong>{selectedAggregator.name}</strong></CardDescription>}
                </CardHeader>
                <CardContent>
                   <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Поиск по названию услуги..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <ScrollArea className="h-[250px] pr-3 mb-4">
                    <div className="space-y-2">
                        {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <Button
                                    key={service.serviceName}
                                    variant={washServices.some(s => s.serviceName === service.serviceName) ? "default" : "outline"}
                                    className={cn(
                                      "w-full text-base py-6 h-auto min-h-[3rem] text-left leading-tight",
                                      showPrices ? "justify-between" : "justify-start"
                                    )}
                                    onClick={() => handleServiceSelect(service)}>
                                    <span className="whitespace-normal break-words flex-1 mr-2 flex items-center gap-2">
                                     {(service as any).isFromLastWash && <Repeat className="h-4 w-4 text-primary" />}
                                      {service.serviceName}
                                    </span>
                                    {showPrices && <span className="font-bold whitespace-nowrap">{service.price} руб.</span>}
                                </Button>
                            ))
                        ) : (
                             <p className="text-muted-foreground text-center py-4">
                                {servicesToShow.length > 0 ? "Услуги, соответствующие поиску, не найдены." : "Для данного клиента нет доступных услуг."}
                            </p>
                        )}
                    </div>
                  </ScrollArea>
                  
                  {(predefinedExtraServices && predefinedExtraServices.length > 0) && (
                      <div className="mb-4">
                          <Label>Добавить предопределенные доп. услуги:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                              {predefinedExtraServices.map(service => (
                                  <Button key={service.serviceName} variant="outline" size="sm" onClick={() => handleServiceSelect(service)}>
                                      <PlusCircle className="mr-2 h-4 w-4"/> {service.serviceName} {showPrices && `(${service.price} руб.)`}
                                  </Button>
                              ))}
                          </div>
                      </div>
                  )}
                
                  <Separator className="my-4"/>

                  {washServices.length > 0 && (
                      <div className="space-y-2 mb-4">
                          <Label>Выбранные услуги:</Label>
                          {washServices.map((service, index) => (
                            <div key={service.id} className="flex items-center justify-between p-2 pl-3 border rounded-md bg-background">
                              <span className="font-medium">{service.serviceName}</span>
                              <div className="flex items-center gap-2">
                                {showPrices && <span className="font-semibold">{service.price} руб.</span>}
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveService(service.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                      </div>
                  )}

                  {canAddCustomServices && (
                      <div className="p-3 border rounded-md bg-muted/20 space-y-2">
                          <Label htmlFor="customExtraServiceName" className="text-sm font-medium">Добавить произвольную доп. услугу</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Input 
                                  id="customExtraServiceName"
                                  value={customExtraServiceName}
                                  onChange={(e) => setCustomExtraServiceName(e.target.value)}
                                  placeholder="Название услуги"
                                  className="text-sm sm:col-span-2"
                              />
                              <Input 
                                  id="customExtraServicePrice"
                                  type="number"
                                  value={customExtraServicePrice}
                                  onChange={(e) => setCustomExtraServicePrice(e.target.value)}
                                  placeholder="Цена"
                                  className="text-sm"
                                  hidden={!showPrices}
                              />
                          </div>
                          <Button onClick={handleAddCustomExtraService} size="sm" variant="outline" className="mt-2">
                              <PlusCircle className="mr-2 h-4 w-4" /> Добавить
                          </Button>
                      </div>
                  )}
                </CardContent>

                {washServices.length > 0 && (
                  <CardContent className="mt-4 pt-4 border-t">
                    <div className="text-right">
                        {showPrices ? (
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-2xl font-bold">Итого: {totalAmount.toFixed(2)} руб.</p>
                             {selectedPaymentMethod === 'card' && acquiringFee > 0 && (
                                <p className="text-sm text-muted-foreground">К получению: {netAmount.toFixed(2)} руб. (вкл. комиссию {acquiringFee.toFixed(2)} руб.)</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xl font-bold">Оплата по договору</p>
                        )}
                        <Button onClick={proceedToConfirmation} size="lg" className="mt-4">
                            Далее к подтверждению
                        </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {currentStep === "confirmation" && washServices.length > 0 && (
              <Card className="border-primary bg-primary/5 animate-in fade-in-20">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary"><CheckCircle className="mr-2"/>Подтверждение мойки</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p><strong>Номер машины:</strong> {normalizedVehicleNumber} (Введено: {vehicleNumberInput})</p>
                  <p><strong>Клиент:</strong> {
                    selectedPaymentMethod === 'counterAgentContract' && foundCounterAgent ? `${foundCounterAgent.name} (Контрагент по договору)` :
                    selectedPaymentMethod === 'aggregator' && selectedAggregator ? `Клиент агрегатора (${selectedAggregator.name})` :
                    'Розничный клиент'
                  }</p>
                  <p><strong>Способ оплаты:</strong> {
                    selectedPaymentMethod ? (paymentMethodLabels[selectedPaymentMethod] || 'Не определен') : 'Не определен'
                  }</p>
                   <p><strong>Исполнители:</strong> {selectedEmployees.map(e => e.fullName).join(', ')}</p>
                  
                  <Separator />
                  <p className="font-semibold">Оказанные услуги:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {washServices.map((s, i) => (
                        <li key={`confirm-${s.id}`}>{s.serviceName}{showPrices && ` - ${s.price} руб.`}{i === 0 && ' (Основная)'}</li>
                    ))}
                  </ul>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="driverComment">Комментарий к мойке (клиент, машина)</Label>
                    <Textarea 
                      id="driverComment"
                      placeholder="Например: водитель просил не использовать сильную химию на дисках..."
                      value={driverComment}
                      onChange={(e) => setDriverComment(e.target.value)}
                    />
                  </div>

                  <Separator />

                  {showPrices ? (
                    <div className="text-right space-y-1">
                      <p className="text-2xl font-bold"><strong>Итого к оплате:</strong> {totalAmount.toFixed(2)} руб.</p>
                       {selectedPaymentMethod === 'card' && acquiringFee > 0 && (
                          <div className="text-sm">
                              <p className="text-muted-foreground">Комиссия за эквайринг ({retailPriceConfig.cardAcquiringPercentage}%): -{acquiringFee.toFixed(2)} руб.</p>
                              <p className="font-semibold text-foreground">К получению: {netAmount.toFixed(2)} руб.</p>
                          </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-right"><strong>Оплата:</strong> По договору</p>
                  )}

                  <div className="flex space-x-3 pt-3">
                    <Button onClick={confirmWash} disabled={isLoading} size="lg" className="flex-1">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Подтвердить и зарегистрировать
                    </Button>
                     <Button onClick={() => setCurrentStep("serviceSelection")} variant="outline" size="lg">Назад к услугам</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep !== 'idle' && currentStep !== 'vehicleInput' && (
                 <Button onClick={() => resetFormStateForNewVehicle()} variant="ghost" className="mt-4 text-muted-foreground">
                    <X className="mr-2 h-4 w-4" /> Начать заново (другая машина)
                </Button>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}

    