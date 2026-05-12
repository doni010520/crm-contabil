'use client';

import React, { useState, useCallback } from 'react';
import { calcQuiz, QUIZ_QUESTIONS } from '../lib/calc-quiz';
import type { QuizResult, Branding } from '../lib/types';

interface FiscalHealthQuizProps {
  onResult?: (result: QuizResult) => void;
  branding?: Branding;
}

const LEVEL_CONFIG = {
  green: {
    label: 'Verde - Saudável',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    emoji: '',
    description: 'Sua empresa está com a saúde fiscal em boa forma!',
  },
  yellow: {
    label: 'Amarelo - Atenção',
    color: '#ca8a04',
    bgColor: '#fefce8',
    emoji: '',
    description: 'Existem pontos de atenção que precisam ser melhorados.',
  },
  red: {
    label: 'Vermelho - Crítico',
    color: '#dc2626',
    bgColor: '#fef2f2',
    emoji: '',
    description: 'Sua empresa precisa de atenção urgente na área fiscal.',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  fiscalCompliance: 'Conformidade Fiscal',
  financialOrganization: 'Organização Financeira',
  taxPlanning: 'Planejamento Tributário',
  legalObligations: 'Obrigações Legais',
  technology: 'Tecnologia',
};

export function FiscalHealthQuiz({ onResult, branding }: FiscalHealthQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const primaryColor = branding?.color || '#2563eb';
  const totalQuestions = QUIZ_QUESTIONS.length;
  const progress = ((currentQuestion) / totalQuestions) * 100;

  const handleAnswer = useCallback(
    (questionId: string, value: number) => {
      const newAnswers = { ...answers, [questionId]: value };
      setAnswers(newAnswers);

      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        // Última pergunta - calcular resultado
        const quizResult = calcQuiz(newAnswers);
        setResult(quizResult);
        onResult?.(quizResult);
      }
    },
    [answers, currentQuestion, totalQuestions, onResult],
  );

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  // Tela de resultado
  if (result) {
    const levelCfg = LEVEL_CONFIG[result.level];

    return (
      <div className="w-full max-w-2xl mx-auto">
        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: primaryColor }}
        >
          Resultado da Saúde Fiscal
        </h2>

        {/* Score Gauge */}
        <div
          className="text-center p-8 rounded-xl mb-6"
          style={{ backgroundColor: levelCfg.bgColor }}
        >
          <div className="relative w-40 h-40 mx-auto mb-4">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={levelCfg.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(result.totalScore / 100) * 314.16} 314.16`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-4xl font-bold"
                style={{ color: levelCfg.color }}
              >
                {result.totalScore}
              </span>
            </div>
          </div>
          <p
            className="text-xl font-bold mb-2"
            style={{ color: levelCfg.color }}
          >
            {levelCfg.label}
          </p>
          <p className="text-sm text-gray-600">{levelCfg.description}</p>
        </div>

        {/* Categorias */}
        <div className="space-y-3 mb-6">
          {Object.entries(result.categoryScores).map(([key, score]) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">
                  {CATEGORY_LABELS[key] || key}
                </span>
                <span className="font-medium">{score}/20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: `${(score / 20) * 100}%`,
                    backgroundColor:
                      score >= 14
                        ? '#16a34a'
                        : score >= 8
                          ? '#ca8a04'
                          : '#dc2626',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recomendações */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Recomendações</h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 text-gray-400">&#8226;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleRestart}
          className="w-full text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          Refazer Quiz
        </button>
      </div>
    );
  }

  // Tela de perguntas
  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2
        className="text-2xl font-bold mb-6 text-center"
        style={{ color: primaryColor }}
      >
        Quiz de Saúde Fiscal
      </h2>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>
            Pergunta {currentQuestion + 1} de {totalQuestions}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: primaryColor,
            }}
          />
        </div>
      </div>

      {/* Pergunta */}
      <div className="mb-6">
        <p className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </p>

        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(question.id, option.value)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <span className="text-sm text-gray-700">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navegação */}
      {currentQuestion > 0 && (
        <button
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Voltar
        </button>
      )}
    </div>
  );
}
