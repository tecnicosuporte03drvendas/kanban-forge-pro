import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Celular formatting utilities
export function formatCelularForDisplay(celular: string): string {
  if (!celular) return '';
  
  // Remove 55 prefix if present
  const cleaned = celular.startsWith('55') ? celular.substring(2) : celular;
  
  // Format as (XX) XXXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  
  return cleaned;
}

export function formatCelularForDB(celular: string): string {
  if (!celular) return '5521982534276';
  
  // Remove all non-numeric characters
  const cleaned = celular.replace(/\D/g, '');
  
  // If it's 11 digits, prepend 55
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }
  
  // If it's already 13 digits and starts with 55, return as is
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned;
  }
  
  // Default fallback
  return '5521982534276';
}

export function validateCelular(celular: string): boolean {
  if (!celular) return false;
  
  const cleaned = celular.replace(/\D/g, '');
  return cleaned.length === 11;
}
