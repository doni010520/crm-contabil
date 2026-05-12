'use client';

import React, { useState, useCallback } from 'react';
import type { LeadData } from '../lib/types';

interface LeadGateProps {
  onSubmit: (lead: LeadData) => void;
  /** Conteúdo parcial mostrado embaçado como "preview" */
  partialResult?: React.ReactNode;
}

/**
 * Aplica máscara de telefone: (XX) XXXXX-XXXX
 */
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function LeadGate({ onSubmit, partialResult }: LeadGateProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      newErrors.phone = 'Telefone inválido. Use (XX) XXXXX-XXXX';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phone, email]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const lead: LeadData = {
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        ...(email.trim() && { email: email.trim() }),
      };

      onSubmit(lead);
      setSubmitted(true);
    },
    [name, phone, email, validate, onSubmit],
  );

  if (submitted) {
    return null; // O componente pai exibe o resultado completo
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Preview embaçado */}
      {partialResult && (
        <div className="relative mb-6 overflow-hidden rounded-lg">
          <div className="blur-sm pointer-events-none select-none opacity-60">
            {partialResult}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <p className="text-lg font-semibold text-gray-700 text-center px-4">
              Preencha seus dados para ver o resultado completo
            </p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Ver Resultado Completo
        </button>

        <p className="text-xs text-gray-400 text-center">
          Seus dados estão seguros e não serão compartilhados.
        </p>
      </form>
    </div>
  );
}
