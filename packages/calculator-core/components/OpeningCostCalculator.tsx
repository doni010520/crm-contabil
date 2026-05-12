'use client';

import React, { useState, useCallback } from 'react';
import { calcOpening, AVAILABLE_STATES } from '../lib/calc-opening';
import type { CompanyType, OpeningResult, Branding } from '../lib/types';

interface OpeningCostCalculatorProps {
  onResult?: (result: OpeningResult) => void;
  branding?: Branding;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const COMPANY_TYPE_LABELS: Record<CompanyType, { label: string; description: string }> = {
  mei: {
    label: 'MEI',
    description: 'Microempreendedor Individual - Faturamento até R$ 81.000/ano',
  },
  me: {
    label: 'ME',
    description: 'Microempresa - Faturamento até R$ 360.000/ano',
  },
  epp: {
    label: 'EPP',
    description: 'Empresa de Pequeno Porte - Faturamento até R$ 4.800.000/ano',
  },
};

const BREAKDOWN_LABELS: Record<string, string> = {
  contratoSocial: 'Contrato Social / Requerimento',
  juntaComercial: 'Junta Comercial',
  alvara: 'Alvará de Funcionamento',
  certificadoDigital: 'Certificado Digital',
  contabilidade: 'Honorários Contábeis (abertura)',
  outros: 'Outros (taxas diversas)',
};

export function OpeningCostCalculator({ onResult, branding }: OpeningCostCalculatorProps) {
  const [state, setState] = useState('SP');
  const [companyType, setCompanyType] = useState<CompanyType>('me');
  const [hasPartners, setHasPartners] = useState(false);
  const [result, setResult] = useState<OpeningResult | null>(null);

  const primaryColor = branding?.color || '#2563eb';

  const handleCalculate = useCallback(() => {
    const data = calcOpening(state, companyType, hasPartners);
    setResult(data);
    onResult?.(data);
  }, [state, companyType, hasPartners, onResult]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2
        className="text-2xl font-bold mb-6 text-center"
        style={{ color: primaryColor }}
      >
        Calculadora de Custo de Abertura
      </h2>

      <div className="space-y-4 mb-6">
        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AVAILABLE_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Empresa
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.entries(COMPANY_TYPE_LABELS) as [CompanyType, typeof COMPANY_TYPE_LABELS[CompanyType]][]).map(
              ([type, info]) => (
                <button
                  key={type}
                  onClick={() => setCompanyType(type)}
                  className={`p-3 border rounded-lg text-left transition-colors cursor-pointer ${
                    companyType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{info.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                </button>
              ),
            )}
          </div>
        </div>

        {/* Tem sócios */}
        {companyType !== 'mei' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPartners}
              onChange={(e) => setHasPartners(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">
              A empresa terá sócios?
            </span>
          </label>
        )}
      </div>

      <button
        onClick={handleCalculate}
        className="w-full text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
        style={{ backgroundColor: primaryColor }}
      >
        Calcular Custo de Abertura
      </button>

      {/* Resultado */}
      {result && (
        <div className="mt-8">
          {/* Total */}
          <div
            className="text-center p-6 rounded-lg mb-6"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <p className="text-sm text-gray-600 mb-1">Custo Total Estimado</p>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
              {formatBRL(result.totalCost)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Prazo estimado: {result.timeline}
            </p>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Detalhamento dos Custos
            </h3>
            <div className="space-y-2">
              {Object.entries(result.breakdown).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                >
                  <span className="text-sm text-gray-600">
                    {BREAKDOWN_LABELS[key] || key}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      value > 0 ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {value > 0 ? formatBRL(value) : 'Isento'}
                  </span>
                </div>
              ))}
            </div>

            {/* Barra visual */}
            <div className="mt-4">
              <div className="flex rounded-full overflow-hidden h-3">
                {Object.entries(result.breakdown)
                  .filter(([, v]) => v > 0)
                  .map(([key, value], idx) => {
                    const colors = [
                      '#3b82f6',
                      '#ef4444',
                      '#f59e0b',
                      '#10b981',
                      '#8b5cf6',
                      '#06b6d4',
                    ];
                    return (
                      <div
                        key={key}
                        style={{
                          width: `${(value / result.totalCost) * 100}%`,
                          backgroundColor: colors[idx % colors.length],
                        }}
                        title={`${BREAKDOWN_LABELS[key]}: ${formatBRL(value)}`}
                      />
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Nota sobre MEI */}
          {companyType === 'mei' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                O MEI possui abertura gratuita pelo Portal do Empreendedor.
                Os custos acima referem-se apenas ao certificado digital
                (opcional) e taxas menores.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
