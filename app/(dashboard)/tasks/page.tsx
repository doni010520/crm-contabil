import { getTasks, getTeamMembers } from "./actions";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const [tasks, teamMembers] = await Promise.all([
    getTasks(),
    getTeamMembers(),
  ]);

  return <TasksClient initialTasks={tasks} teamMembers={teamMembers} />;
}
