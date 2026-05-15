import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const AI_TOOLS: ChatCompletionTool[] = [
  // ===== DASHBOARD =====
  {
    type: "function",
    function: {
      name: "get_dashboard_metrics",
      description:
        "Obtem metricas gerais do CRM: total de contatos, contratos ativos, propostas pendentes, faturamento mensal, valor do pipeline, distribuicao por estagio, contatos recentes.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },

  // ===== CONTACTS =====
  {
    type: "function",
    function: {
      name: "get_contacts",
      description:
        "Lista contatos do CRM. Pode filtrar por busca (nome, email, telefone, CNPJ) e tipo (lead, client, former_client, partner).",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Termo de busca" },
          type: {
            type: "string",
            enum: ["all", "lead", "client", "former_client", "partner"],
            description: "Tipo de contato",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_contact",
      description: "Cria um novo contato no CRM.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do contato (obrigatorio)" },
          email: { type: "string", description: "E-mail" },
          phone: { type: "string", description: "Telefone" },
          company_name: { type: "string", description: "Nome da empresa" },
          cnpj: { type: "string", description: "CNPJ" },
          type: {
            type: "string",
            enum: ["lead", "client", "former_client", "partner"],
            default: "lead",
          },
          source: {
            type: "string",
            enum: [
              "whatsapp",
              "website",
              "referral",
              "google",
              "social",
              "event",
              "outbound",
              "other",
            ],
          },
          notes: { type: "string", description: "Observacoes" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_contact",
      description: "Atualiza dados de um contato existente.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do contato" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          type: {
            type: "string",
            enum: ["lead", "client", "former_client", "partner"],
          },
          notes: { type: "string" },
        },
        required: ["id"],
      },
    },
  },

  // ===== COMPANIES =====
  {
    type: "function",
    function: {
      name: "get_companies",
      description: "Lista empresas do CRM. Pode filtrar por busca.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Busca por razao social, fantasia ou CNPJ" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_company",
      description: "Cria uma nova empresa no CRM.",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string", description: "Razao social (obrigatorio)" },
          trade_name: { type: "string", description: "Nome fantasia" },
          cnpj: { type: "string", description: "CNPJ" },
          phone: { type: "string" },
          email: { type: "string" },
          tax_regime: {
            type: "string",
            enum: ["simples", "presumido", "real", "mei"],
          },
          niche: { type: "string", description: "Setor/nicho de atuacao" },
          notes: { type: "string" },
        },
        required: ["company_name"],
      },
    },
  },

  // ===== PIPELINE / DEALS =====
  {
    type: "function",
    function: {
      name: "get_pipeline",
      description:
        "Obtem o pipeline completo: estagios e negocios (deals) com contatos vinculados e valores.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_deal",
      description: "Cria um novo negocio (deal) no pipeline.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "ID do contato vinculado (obrigatorio)" },
          stage_id: { type: "string", description: "ID do estagio no pipeline (obrigatorio)" },
          title: { type: "string", description: "Titulo do negocio" },
          value: { type: "number", description: "Valor em reais" },
        },
        required: ["contact_id", "stage_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_deal",
      description:
        "Move um negocio para outro estagio do pipeline. Use get_pipeline primeiro para obter os IDs dos estagios.",
      parameters: {
        type: "object",
        properties: {
          deal_id: { type: "string", description: "ID do negocio" },
          stage_id: { type: "string", description: "ID do novo estagio" },
        },
        required: ["deal_id", "stage_id"],
      },
    },
  },

  // ===== TASKS =====
  {
    type: "function",
    function: {
      name: "get_tasks",
      description:
        "Lista tarefas. Pode filtrar por status, prioridade, responsavel, contato, negocio, data e busca.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "todo", "in_progress", "done", "cancelled"],
          },
          priority: {
            type: "string",
            enum: ["all", "low", "medium", "high", "urgent"],
          },
          search: { type: "string", description: "Busca no titulo" },
          contactId: { type: "string" },
          dealId: { type: "string" },
          dateFrom: { type: "string", description: "Data inicio (YYYY-MM-DD)" },
          dateTo: { type: "string", description: "Data fim (YYYY-MM-DD)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Cria uma nova tarefa.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titulo da tarefa (obrigatorio)" },
          description: { type: "string" },
          dueDate: { type: "string", description: "Data de vencimento (YYYY-MM-DD)" },
          dueTime: { type: "string", description: "Hora (HH:MM)" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
          },
          contactId: { type: "string", description: "ID do contato vinculado" },
          dealId: { type: "string", description: "ID do negocio vinculado" },
          assignedTo: { type: "string", description: "ID do responsavel" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Atualiza uma tarefa existente (status, prioridade, prazo, etc).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da tarefa" },
          title: { type: "string" },
          description: { type: "string" },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          due_time: { type: "string", description: "HH:MM" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
          },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "done", "cancelled"],
          },
          assigned_to: { type: "string" },
          contact_id: { type: "string" },
          deal_id: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Exclui uma tarefa. Confirme com o usuario antes de chamar.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da tarefa" },
        },
        required: ["id"],
      },
    },
  },

  // ===== CALENDAR =====
  {
    type: "function",
    function: {
      name: "get_calendar_events",
      description: "Lista eventos do calendario em um periodo.",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "Data inicio ISO (YYYY-MM-DDTHH:mm:ss)",
          },
          endDate: {
            type: "string",
            description: "Data fim ISO (YYYY-MM-DDTHH:mm:ss)",
          },
        },
        required: ["startDate", "endDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Cria um evento no calendario do CRM.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titulo do evento (obrigatorio)" },
          description: { type: "string" },
          startAt: {
            type: "string",
            description: "Inicio do evento ISO (YYYY-MM-DDTHH:mm:ss)",
          },
          endAt: {
            type: "string",
            description: "Fim do evento ISO (YYYY-MM-DDTHH:mm:ss)",
          },
          contactId: { type: "string" },
          attendeeEmails: {
            type: "array",
            items: { type: "string" },
            description: "E-mails dos participantes",
          },
          createMeet: { type: "boolean", description: "Criar link Google Meet" },
        },
        required: ["title", "startAt", "endAt"],
      },
    },
  },

  // ===== TEAM =====
  {
    type: "function",
    function: {
      name: "get_team_members",
      description: "Lista membros da equipe (para atribuir tarefas ou negocios).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];
