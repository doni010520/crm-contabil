'use client';

import React, { useState, useCallback } from 'react';
import { calcClt } from '../lib/calc-clt';
import type { CltResult, Branding } from '../lib/types';

interface CltCalculatorProps {
  onResult?: (result: CltResult) => void;
  branding?: Branding;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CltCalculator({ onResult, branding }: CltCalculatorProps) {
  const [grossSalary, setGrossSalary] = useState('');
  const [hasTransport, setHasTransport] = useState(true);
  const [hasMealVoucher, setHasMealVoucher] = useState(true);
  const [mealValue, setMealValue] = useState('30,00');
  const [result, setResult] = useState<CltResult | null>(null);
  const [error, setError] = useState('');

  const handleCurrencyInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setter('');
      return;
    }
    const num = parseInt(digits, 10) / 100;
    setter(
      num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    );
  };

  const handleCalculate = useCallback(() => {
    setError('');
    const salary = parseFloat(grossSalary.replace(/\D/g, '')) / 100 || 0;
    const meal = parseFloat(mealValue.replace(/\D/g, '')) / 100 || 0;

    if (salary <= 0) {
      setError('Informe o salário bruto.');
      return;
    }

    const data = calcClt(salary, hasTransport, hasMealVoucher, meal);
    setResult(data);
    onResult?.(data);
  }, [grossSalary, hasTransport, hasMealVoucher, mealValue, onResult]);

  const primaryColor = branding?.color || '#2563eb';

  // Dados para o gráfico de pizza CSS
  const pieSegments = result
    ? [
        { label: 'Salário Bruto', value: parseFloat(grossSalary.replace(/\D/g, '')) / 100, color: '#3b82f6' },
        { label: 'INSS Patronal', value: result.breakdown.inssEmployer, color: '#ef4444' },
        { label: 'FGTS', value: result.breakdown.fgts, color: '#f59e0b' },
        { label: '13º Provisão', value: result.breakdown.thirteenthProvision, color: '#10b981' },
        { label: 'Férias Provisão', value: result.breakdown.vacationProvision, color: '#8b5cf6' },
        { label: 'Vale-Transporte', value: result.breakdown.transportVoucher, color: '#06b6d4' },
        { label: 'Vale-Refeição', value: result.breakdown.mealVoucher, color: '#ec4899' },
      ].filter((s) => s.value > 0)
    : [];

  const pieTotal = pieSegments.reduce((sum, s) => sum + s.value, 0);

  // Gerar gradiente cônico para o gráfico de pizza
  let cumulativePercent = 0;
  const conicStops = pieSegments.map((seg) => {
    const start = cumulativePercent;
    const pct = (seg.value / pieTotal) * 100;
    cumulativePercent += pct;
    return `${seg.color} ${start}% ${cumulativePercent}%`;
  });
  const conicGradient = `conic-gradient(${conicStops.join(', ')})`;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2
        className="text-2xl font-bold mb-6 text-center"
        style={{ color: primaryColor }}
      >
        Calculadora de Custo CLT
      </h2>

      <div className="space-y-4 mb-6">
        {/* Salário Bruto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salário Bruto (R$)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={grossSalary}
            onChange={(e) => handleCurrencyInput(e.target.value, setGrossSalary)}
            placeholder="0,00"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasTransport}
              onChange={(e) => setHasTransport(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Vale-Transporte</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasMealVoucher}
              onChange={(e) => setHasMealVoucher(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Vale-Refeição</span>
          </label>
        </div>

        {/* Valor do VR */}
        {hasMealVoucher && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor diário do VR (R$)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={mealValue}
              onChange={(e) => handleCurrencyInput(e.target.value, setMealValue)}
              placeholder="30,00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
      )}

      <button
        onClick={handleCalculate}
        className="w-full text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
        style={{ backgroundColor: primaryColor }}
      >
        Calcular Custo Total
      </button>

      {/* Resultado */}
      {result && (
        <div className="mt-8">
          {/* Custo Total */}
          <div
            className="text-center p-6 rounded-lg mb-6"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <p className="text-sm text-gray-600 mb-1">Custo Total Mensal</p>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
              {formatBRL(result.totalMonthlyCost)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(
                (result.totalMonthlyCost /
                  (parseFloat(grossSalary.replace(/\D/g, '')) / 100)) *
                100
              ).toFixed(0)}
              % do salário bruto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Pizza CSS */}
            <div className="flex flex-col items-center">
              <div
                className="w-48 h-48 rounded-full mb-4"
                style={{ background: conicGradient }}
              />
              <div className="space-y-1">
                {pieSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-gray-600">
                      {seg.label}: {formatBRL(seg.value)} (
                      {((seg.value / pieTotal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhamento */}
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                  Encargos
                </h4>
                <p className="text-sm text-gray-600">
                  INSS Patronal (28,8%): {formatBRL(result.breakdown.inssEmployer)}
                </p>
                <p className="text-sm text-gray-600">
                  FGTS (8%): {formatBRL(result.breakdown.fgts)}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                  Provisões
                </h4>
                <p className="text-sm text-gray-600">
                  13º salário: {formatBRL(result.provisions.thirteenth)}
                </p>
                <p className="text-sm text-gray-600">
                  Férias + 1/3: {formatBRL(result.provisions.vacation)}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                  Benefícios
                </h4>
                <p className="text-sm text-gray-600">
                  Vale-Transporte: {formatBRL(result.benefits.transport)}
                </p>
                <p className="text-sm text-gray-600">
                  Vale-Refeição: {formatBRL(result.benefits.meal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
