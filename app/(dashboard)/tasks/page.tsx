import {
  getTasks,
  getTeamMembers,
  getContactsForSelect,
  getDealsForSelect,
} from "./actions";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const [tasks, teamMembers, contacts, deals] = await Promise.all([
    getTasks(),
    getTeamMembers(),
    getContactsForSelect(),
    getDealsForSelect(),
  ]);

  return (
    <TasksClient
      initialTasks={tasks}
      teamMembers={teamMembers}
      contacts={contacts}
      deals={deals}
    />
  );
}
