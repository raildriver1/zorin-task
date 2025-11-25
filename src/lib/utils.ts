import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Нормализует номерной знак:
 * - Транслитерирует ключевые русские буквы в латинские.
 * - Переводит все в верхний регистр.
 * - Удаляет все символы, кроме латинских букв (A-Z) и цифр (0-9).
 * @param plate Исходная строка номерного знака.
 * @returns Нормализованная строка номерного знака.
 */
export function normalizeLicensePlate(plate: string): string {
  if (!plate) return "";

  const cyrillicToLatinMap: { [key: string]: string } = {
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M',
    'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T',
    'У': 'Y', 'Х': 'X',
    // добавим строчные для удобства ввода пользователем
    'а': 'A', 'в': 'B', 'е': 'E', 'к': 'K', 'м': 'M',
    'н': 'H', 'о': 'O', 'р': 'P', 'с': 'C', 'т': 'T',
    'у': 'Y', 'х': 'X',
  };

  let normalized = '';
  for (const char of plate) {
    normalized += cyrillicToLatinMap[char] || char;
  }

  return normalized.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
