import { createClient } from "@/lib/supabase/server";
import { getDashboardMetrics } from "@/app/(dashboard)/dashboard/actions";
import { getContacts } from "@/app/(dashboard)/contacts/actions";
import { getCompanies } from "@/app/(dashboard)/companies/actions";
import {
  getStages,
  getEntries,
  moveEntry,
} from "@/app/(dashboard)/pipeline/actions";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTeamMembers,
} from "@/app/(dashboard)/tasks/actions";
import {
  getCalendarEvents,
  createCalendarEvent,
} from "@/app/(dashboard)/calendar/actions";

// ---------------------------------------------------------------------------
// Helper: get tenant context for direct DB operations
// ---------------------------------------------------------------------------
async function getUserTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado.");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) throw new Error("Usuario nao encontrado.");

  return { supabase, userId: dbUser.id, tenantId: dbUser.tenant_id };
}

// ---------------------------------------------------------------------------
// Execute a tool call from GPT
// ---------------------------------------------------------------------------
export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  try {
    switch (name) {
      // ===== DASHBOARD =====
      case "get_dashboard_metrics":
        return await getDashboardMetrics();

      // ===== CONTACTS =====
      case "get_contacts": {
        const contacts = await getContacts(
          (args.search as string) || undefined,
          (args.type as string) || undefined
        );
        // Limit to 20 for token efficiency
        return contacts.slice(0, 20).map((c) => ({
          id: c.id,
          name: c.name,
          company_name: c.company_name,
          email: c.email,
          phone: c.phone,
          type: c.type,
          cnpj: c.cnpj,
          tax_regime: c.tax_regime,
          source: c.source,
          created_at: c.created_at,
        }));
      }

      case "create_contact": {
        const { supabase, tenantId } = await getUserTenant();
        const { error } = await supabase.from("contacts").insert({
          tenant_id: tenantId,
          name: args.name as string,
          email: (args.email as string) || null,
          phone: (args.phone as string) || null,
          company_name: (args.company_name as string) || null,
          cnpj: (args.cnpj as string) || null,
          type: (args.type as string) || "lead",
          source: (args.source as string) || null,
          notes: (args.notes as string) || null,
        });
        if (error) throw new Error(error.message);
        return { success: true, message: `Contato "${args.name}" criado com sucesso.` };
      }

      case "update_contact": {
        const { supabase } = await getUserTenant();
        const { id, ...updates } = args;
        // Remove undefined/null keys
        const cleanUpdates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined && v !== null) cleanUpdates[k] = v;
        }
        const { error } = await supabase
          .from("contacts")
          .update(cleanUpdates)
          .eq("id", id as string);
        if (error) throw new Error(error.message);
        return { success: true, message: "Contato atualizado com sucesso." };
      }

      // ===== COMPANIES =====
      case "get_companies": {
        const companies = await getCompanies(
          (args.search as string) || undefined
        );
        return companies.slice(0, 20);
      }

      case "create_company": {
        const { supabase, tenantId } = await getUserTenant();
        const { error } = await supabase.from("companies").insert({
          tenant_id: tenantId,
          company_name: args.company_name as string,
          trade_name: (args.trade_name as string) || null,
          cnpj: (args.cnpj as string) || null,
          phone: (args.phone as string) || null,
          email: (args.email as string) || null,
          tax_regime: (args.tax_regime as string) || null,
          niche: (args.niche as string) || null,
          notes: (args.notes as string) || null,
        });
        if (error) throw new Error(error.message);
        return {
          success: true,
          message: `Empresa "${args.company_name}" criada com sucesso.`,
        };
      }

      // ===== PIPELINE =====
      case "get_pipeline": {
        const [stages, deals] = await Promise.all([getStages(), getEntries()]);
        return {
          stages: stages.map((s) => ({
            id: s.id,
            name: s.name,
            position: s.position,
            color: s.color,
          })),
          deals: deals.slice(0, 30).map((d) => ({
            id: d.id,
            title: d.title,
            value: d.value,
            stage_id: d.stage_id,
            contact: d.contact
              ? { name: d.contact.name, company_name: d.contact.company_name }
              : null,
            created_at: d.created_at,
          })),
        };
      }

      case "create_deal": {
        const { supabase, tenantId } = await getUserTenant();
        const { error } = await supabase.from("deals").insert({
          tenant_id: tenantId,
          contact_id: args.contact_id as string,
          stage_id: args.stage_id as string,
          title: (args.title as string) || "Novo negocio",
          value: (args.value as number) || 0,
        });
        if (error) throw new Error(error.message);
        return { success: true, message: "Negocio criado com sucesso." };
      }

      case "move_deal": {
        await moveEntry(args.deal_id as string, args.stage_id as string);
        return { success: true, message: "Negocio movido com sucesso." };
      }

      // ===== TASKS =====
      case "get_tasks": {
        const tasks = await getTasks({
          status: (args.status as string) || undefined,
          priority: (args.priority as string) || undefined,
          search: (args.search as string) || undefined,
          contactId: (args.contactId as string) || undefined,
          dealId: (args.dealId as string) || undefined,
          dateFrom: (args.dateFrom as string) || undefined,
          dateTo: (args.dateTo as string) || undefined,
        });
        return tasks.slice(0, 20).map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          due_date: t.due_date,
          due_time: t.due_time,
          priority: t.priority,
          status: t.status,
          contact: t.contact ? { name: t.contact.name } : null,
          deal: t.deal ? { title: t.deal.title } : null,
          assignee: t.assignee ? { name: t.assignee.name } : null,
        }));
      }

      case "create_task": {
        await createTask({
          title: args.title as string,
          description: (args.description as string) || undefined,
          dueDate: (args.dueDate as string) || undefined,
          dueTime: (args.dueTime as string) || undefined,
          priority: (args.priority as string) || "medium",
          contactId: (args.contactId as string) || undefined,
          dealId: (args.dealId as string) || undefined,
          assignedTo: (args.assignedTo as string) || undefined,
        });
        return { success: true, message: `Tarefa "${args.title}" criada com sucesso.` };
      }

      case "update_task": {
        const { id: taskId, ...taskUpdates } = args;
        await updateTask(taskId as string, taskUpdates as Parameters<typeof updateTask>[1]);
        return { success: true, message: "Tarefa atualizada com sucesso." };
      }

      case "delete_task": {
        await deleteTask(args.id as string);
        return { success: true, message: "Tarefa excluida com sucesso." };
      }

      // ===== CALENDAR =====
      case "get_calendar_events": {
        const events = await getCalendarEvents(
          args.startDate as string,
          args.endDate as string
        );
        return events.slice(0, 20).map((e) => ({
          id: e.id,
          title: e.title,
          start_at: e.start_at,
          end_at: e.end_at,
          meet_link: e.meet_link,
          location: e.location,
          contact: e.contact ? { name: e.contact.name } : null,
          status: e.status,
        }));
      }

      case "create_calendar_event": {
        const result = await createCalendarEvent({
          title: args.title as string,
          description: (args.description as string) || undefined,
          startAt: args.startAt as string,
          endAt: args.endAt as string,
          contactId: (args.contactId as string) || undefined,
          attendeeEmails: (args.attendeeEmails as string[]) || undefined,
          createMeet: args.createMeet as boolean | undefined,
        });
        return {
          success: true,
          message: `Evento "${args.title}" criado com sucesso.`,
          meetLink: result.meetLink,
        };
      }

      // ===== TEAM =====
      case "get_team_members": {
        const members = await getTeamMembers();
        return members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
        }));
      }

      default:
        return { error: `Ferramenta "${name}" nao encontrada.` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { error: message };
  }
}
