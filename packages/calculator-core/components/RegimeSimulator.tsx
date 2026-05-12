'use client';

import React, { useState, useCallback } from 'react';
import { calcSimples } from '../lib/calc-simples';
import { calcPresumido } from '../lib/calc-presumido';
import { calcReal } from '../lib/calc-real';
import type {
  SimplesAnnex,
  ActivityType,
  SimplesResult,
  PresumidoResult,
  RealResult,
  TaxRegime,
  Branding,
} from '../lib/types';

interface RegimeComparisonData {
  simples: SimplesResult | null;
  presumido: PresumidoResult;
  real: RealResult;
  cheapest: TaxRegime;
}

interface RegimeSimulatorProps {
  onResult?: (result: RegimeComparisonData) => void;
  branding?: Branding;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  return (value * 100).toFixed(2) + '%';
}

export function RegimeSimulator({ onResult, branding }: RegimeSimulatorProps) {
  const [revenueMonthly, setRevenueMonthly] = useState('');
  const [revenue12m, setRevenue12m] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('services');
  const [annex, setAnnex] = useState<SimplesAnnex>('III');
  const [expenseMonthly, setExpenseMonthly] = useState('');
  const [result, setResult] = useState<RegimeComparisonData | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = useCallback(() => {
    setError('');
    const monthly = parseFloat(revenueMonthly.replace(/\D/g, '')) / 100 || 0;
    const annual = parseFloat(revenue12m.replace(/\D/g, '')) / 100 || 0;
    const expenses = parseFloat(expenseMonthly.replace(/\D/g, '')) / 100 || 0;

    if (monthly <= 0 || annual <= 0) {
      setError('Preencha o faturamento mensal e anual (12 meses).');
      return;
    }

    // Simples (pode exceder o limite)
    let simples: SimplesResult | null = null;
    try {
      simples = calcSimples(monthly, annual, annex);
    } catch {
      // Acima do limite do Simples Nacional
    }

    const presumido = calcPresumido(monthly, activityType);
    const real = calcReal(monthly, expenses || monthly * 0.5, activityType);

    // Determinar o mais barato
    const candidates: { regime: TaxRegime; tax: number }[] = [
      { regime: 'presumido', tax: presumido.monthlyTax },
      { regime: 'real', tax: real.monthlyTax },
    ];
    if (simples) {
      candidates.push({ regime: 'simples', tax: simples.monthlyTax });
    }
    candidates.sort((a, b) => a.tax - b.tax);
    const cheapest = candidates[0].regime;

    const data: RegimeComparisonData = { simples, presumido, real, cheapest };
    setResult(data);
    onResult?.(data);
  }, [revenueMonthly, revenue12m, activityType, annex, expenseMonthly, onResult]);

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

  const primaryColor = branding?.color || '#2563eb';

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2
        className="text-2xl font-bold mb-6 text-center"
        style={{ color: primaryColor }}
      >
        Simulador de Regime Tributário
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Faturamento Mensal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Faturamento Mensal (R$)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={revenueMonthly}
            onChange={(e) => handleCurrencyInput(e.target.value, setRevenueMonthly)}
            placeholder="0,00"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Faturamento 12 meses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Faturamento nos últimos 12 meses (R$)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={revenue12m}
            onChange={(e) => handleCurrencyInput(e.target.value, setRevenue12m)}
            placeholder="0,00"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tipo de Atividade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Atividade
          </label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="commerce">Comércio</option>
            <option value="services">Serviços</option>
          </select>
        </div>

        {/* Anexo do Simples */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anexo do Simples Nacional
          </label>
          <select
            value={annex}
            onChange={(e) => setAnnex(e.target.value as SimplesAnnex)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="I">Anexo I - Comércio</option>
            <option value="II">Anexo II - Indústria</option>
            <option value="III">Anexo III - Serviços</option>
            <option value="IV">Anexo IV - Serviços</option>
            <option value="V">Anexo V - Serviços</option>
          </select>
        </div>

        {/* Despesas Mensais (para Lucro Real) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Despesas Mensais - R$ (para cálculo do Lucro Real)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={expenseMonthly}
            onChange={(e) => handleCurrencyInput(e.target.value, setExpenseMonthly)}
            placeholder="0,00 (se vazio, estima 50% do faturamento)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
      )}

      <button
        onClick={handleCalculate}
        className="w-full text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
        style={{ backgroundColor: primaryColor }}
      >
        Calcular
      </button>

      {/* Resultado */}
      {result && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            Comparativo de Regimes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border">Regime</th>
                  <th className="text-right p-3 border">Alíquota Efetiva</th>
                  <th className="text-right p-3 border">Imposto Mensal</th>
                  <th className="text-right p-3 border">Imposto Anual</th>
                </tr>
              </thead>
              <tbody>
                {/* Simples */}
                <tr
                  className={
                    result.cheapest === 'simples'
                      ? 'bg-green-50 font-semibold'
                      : ''
                  }
                >
                  <td className="p-3 border">
                    Simples Nacional
                    {result.cheapest === 'simples' && (
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                        Mais barato
                      </span>
                    )}
                  </td>
                  <td className="text-right p-3 border">
                    {result.simples
                      ? formatPercent(result.simples.effectiveRate)
                      : 'N/A'}
                  </td>
                  <td className="text-right p-3 border">
                    {result.simples
                      ? formatBRL(result.simples.monthlyTax)
                      : 'Excede limite'}
                  </td>
                  <td className="text-right p-3 border">
                    {result.simples
                      ? formatBRL(result.simples.annualTax)
                      : '-'}
                  </td>
                </tr>

                {/* Presumido */}
                <tr
                  className={
                    result.cheapest === 'presumido'
                      ? 'bg-green-50 font-semibold'
                      : ''
                  }
                >
                  <td className="p-3 border">
                    Lucro Presumido
                    {result.cheapest === 'presumido' && (
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                        Mais barato
                      </span>
                    )}
                  </td>
                  <td className="text-right p-3 border">
                    {formatPercent(result.presumido.totalRate)}
                  </td>
                  <td className="text-right p-3 border">
                    {formatBRL(result.presumido.monthlyTax)}
                  </td>
                  <td className="text-right p-3 border">
                    {formatBRL(result.presumido.annualTax)}
                  </td>
                </tr>

                {/* Lucro Real */}
                <tr
                  className={
                    result.cheapest === 'real'
                      ? 'bg-green-50 font-semibold'
                      : ''
                  }
                >
                  <td className="p-3 border">
                    Lucro Real
                    {result.cheapest === 'real' && (
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                        Mais barato
                      </span>
                    )}
                  </td>
                  <td className="text-right p-3 border">
                    {formatPercent(result.real.totalRate)}
                  </td>
                  <td className="text-right p-3 border">
                    {formatBRL(result.real.monthlyTax)}
                  </td>
                  <td className="text-right p-3 border">
                    {formatBRL(result.real.annualTax)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detalhamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {result.simples && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Simples Nacional</h4>
                <p className="text-sm text-gray-600">
                  Anexo {result.simples.breakdown.annex} - Faixa{' '}
                  {result.simples.breakdown.faixa}
                </p>
                <p className="text-sm text-gray-600">
                  Alíquota nominal:{' '}
                  {formatPercent(result.simples.breakdown.nominalRate)}
                </p>
                <p className="text-sm text-gray-600">
                  Dedução: {formatBRL(result.simples.breakdown.deduction)}
                </p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Lucro Presumido</h4>
              <p className="text-sm text-gray-600">
                IRPJ: {formatBRL(result.presumido.breakdown.irpj)}
              </p>
              <p className="text-sm text-gray-600">
                CSLL: {formatBRL(result.presumido.breakdown.csll)}
              </p>
              <p className="text-sm text-gray-600">
                PIS: {formatBRL(result.presumido.breakdown.pis)}
              </p>
              <p className="text-sm text-gray-600">
                COFINS: {formatBRL(result.presumido.breakdown.cofins)}
              </p>
              {result.presumido.breakdown.adicional > 0 && (
                <p className="text-sm text-gray-600">
                  Adicional IRPJ: {formatBRL(result.presumido.breakdown.adicional)}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Lucro Real</h4>
              <p className="text-sm text-gray-600">
                IRPJ: {formatBRL(result.real.breakdown.irpj)}
              </p>
              <p className="text-sm text-gray-600">
                CSLL: {formatBRL(result.real.breakdown.csll)}
              </p>
              <p className="text-sm text-gray-600">
                PIS: {formatBRL(result.real.breakdown.pis)}
              </p>
              <p className="text-sm text-gray-600">
                COFINS: {formatBRL(result.real.breakdown.cofins)}
              </p>
              <p className="text-sm text-gray-600">
                Margem de lucro: {formatPercent(result.real.profitMargin)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
