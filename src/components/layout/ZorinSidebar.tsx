"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  UserCog,
  Briefcase,
  Wallet,
  ShoppingCart,
  Warehouse,
  Settings,
  DollarSign,
  FilePieChart,
  LineChart,
  FileText,
  BrainCircuit,
  BookCheck,
  Clipboard,
  LogOut,
  WashingMachine
} from 'lucide-react';

interface ZorinSidebarProps {
  onLogout: () => void;
  newServicesCount: number;
  isOpen?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  notificationKey?: 'newServices';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Главное',
    items: [
      { href: '/dashboard', label: 'Дашборд', icon: Home },
      { href: '/employee/workstation', label: 'Рабочая станция', icon: Clipboard },
      { href: '/wash-log', label: 'Журнал моек', icon: BookCheck },
    ],
  },
  {
    title: 'Управление',
    items: [
      { href: '/employees', label: 'Сотрудники', icon: UserCog },
      { href: '/counter-agents', label: 'Контрагенты', icon: Users },
      { href: '/aggregators', label: 'Агрегаторы', icon: Briefcase },
      { href: '/salary-schemes', label: 'Схемы зарплат', icon: Wallet },
      { href: '/expenses', label: 'Расходы', icon: ShoppingCart },
      { href: '/inventory', label: 'Склад', icon: Warehouse },
      { href: '/settings', label: 'Прайс-лист "Наличка"', icon: Settings, notificationKey: 'newServices' },
    ],
  },
  {
    title: 'Финансы и отчеты',
    items: [
      { href: '/transactions', label: 'Розничные транзакции', icon: DollarSign },
      { href: '/salary-report', label: 'Отчет по зарплате', icon: FilePieChart },
      { href: '/client-analytics', label: 'Анализ клиентов', icon: LineChart },
      { href: '/invoices', label: 'Счета', icon: FileText },
      { href: '/reports', label: 'AI-Аналитика', icon: BrainCircuit },
    ],
  },
];

export function ZorinSidebar({ onLogout, newServicesCount, isOpen = true, onToggle }: ZorinSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };

  return (
    <div className={cn(
      "zorin-sidebar",
      "flex flex-col h-full",
      isOpen ? "w-[280px]" : "w-[80px]"
    )} data-state={isOpen ? "open" : "collapsed"}>

      {/* Sidebar Header */}
      <div className="zorin-sidebar-header">
        <Link href="/dashboard" className="zorin-logo-link">
          <WashingMachine className="zorin-logo-icon" />
          <span className="zorin-logo-text">АвтомойкаПро</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          onClick={onToggle}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="zorin-sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="zorin-nav-group">
            <h3 className="zorin-nav-group-title">{group.title}</h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const showNotification = item.notificationKey === 'newServices' && newServicesCount > 0 && !isActive(item.href);

                return (
                  <li key={item.href} className="zorin-nav-item">
                    <Link
                      href={item.href}
                      className={cn(
                        "zorin-nav-link",
                        isActive(item.href) && "active"
                      )}
                    >
                      <item.icon className="zorin-nav-icon" />
                      <span className="zorin-nav-text">{item.label}</span>
                      {showNotification && (
                        <span className="zorin-nav-badge">
                          {newServicesCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="zorin-sidebar-footer">
        <button onClick={onLogout} className="zorin-logout-link">
          <LogOut className="zorin-nav-icon" />
          <span className="zorin-nav-text">Выйти</span>
        </button>
      </div>
    </div>
  );
}