"use client";

import { useState, useMemo } from 'react';
import type { WashEvent, Employee } from '@/types';
import { ZorinWashLogClient } from './ZorinWashLogClient';
import { TodaySummary } from './TodaySummary';
import { isToday } from 'date-fns';

interface WashLogPageWrapperProps {
  initialWashEvents: WashEvent[];
  initialEmployees: Employee[];
}

export function WashLogPageWrapper({ initialWashEvents, initialEmployees }: WashLogPageWrapperProps) {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Filter wash events based on search query
  const filteredEvents = useMemo(() => {
    if (!query.trim()) return initialWashEvents;

    const searchLower = query.toLowerCase();
    return initialWashEvents.filter(event => {
      const vehicleMatch = event.vehicleNumber?.toLowerCase().includes(searchLower);
      const sourceMatch = event.sourceName?.toLowerCase().includes(searchLower);
      return vehicleMatch || sourceMatch;
    });
  }, [initialWashEvents, query]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Calculate today's summary
  const todayEvents = useMemo(() => {
    return initialWashEvents.filter(event => isToday(new Date(event.timestamp)));
  }, [initialWashEvents]);

  const todayReport = useMemo(() => {
    // Build simple report matching TodaySummary expectations
    const employeesWorkedToday = new Set<string>();

    todayEvents.forEach(event => {
      event.employeeIds?.forEach(id => employeesWorkedToday.add(id));
    });

    return Array.from(employeesWorkedToday).map(empId => {
      const empEvents = todayEvents.filter(e => e.employeeIds?.includes(empId));
      const totalPay = empEvents.reduce((sum, e) => {
        // Divide total amount by number of employees on that wash
        const empCount = e.employeeIds?.length || 1;
        return sum + (e.totalAmount / empCount);
      }, 0);

      return {
        grossPay: totalPay,
        completedWashes: empEvents.length
      };
    });
  }, [todayEvents]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="wash-log">
      <TodaySummary reportData={todayReport} />

      <ZorinWashLogClient
        washEvents={paginatedEvents}
        employees={initialEmployees}
        query={query}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
