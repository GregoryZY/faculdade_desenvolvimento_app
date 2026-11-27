import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient, ProjectRole, TaskStatus } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const AVATAR_COLORS = ["#0F5B52", "#B87A1F", "#9E3220", "#454842", "#0C4A43", "#3B6EA5", "#7A4E9E", "#2F7D4F"];

const formatTask = (t: any) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  projectId: t.projectId,
  status: t.status,
  priority: t.priority,
  tags: t.tags,
  startDate: t.startDate.toISOString(),
  dueDate: t.dueDate.toISOString(),
  assigneeIds: t.assignments.map((a: any) => a.userId),
  creatorId: t.creatorId,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});

// 1. BOOTSTRAP: Carrega o estado inicial do banco
app.get("/api/bootstrap", async (_req, res) => {
  try {
    const [users, projects, memberships, rawTasks, subtasks, comments, activity] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, title: true, avatarColor: true },
      }),
      prisma.project.findMany(),
      prisma.projectMember.findMany({
        select: { projectId: true, userId: true, role: true },
      }),
      prisma.task.findMany({ include: { assignments: true } }),
      prisma.subtask.findMany({ orderBy: { order: "asc" } }),
      prisma.comment.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    res.json({
      users,
      projects,
      memberships,
      tasks: rawTasks.map(formatTask),
      subtasks,
      comments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
      activity: activity.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar dados do banco." });
  }
});

// 2. AUTENTICAÇÃO
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  const mail = email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: mail } });
  if (exists) return res.status(400).json({ ok: false, error: "Já existe uma conta com esse e-mail." });

  const count = await prisma.user.count();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: mail,
      passwordHash,
      avatarColor: AVATAR_COLORS[count % AVATAR_COLORS.length],
    },
    select: { id: true, name: true, email: true, title: true, avatarColor: true },
  });
  res.json({ ok: true, user });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ ok: false, error: "Credenciais inválidas." });
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ ok: true, user: safeUser });
});

// 3. PROJETOS E MEMBROS
app.post("/api/projects", async (req, res) => {
  const { name, color, ownerId } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        color,
        ownerId,
        members: { create: { userId: ownerId, role: ProjectRole.LEADER } },
      },
    });
    res.json({ ok: true, project });
  } catch {
    res.status(400).json({ ok: false, error: "Você já tem um projeto com esse nome." });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.post("/api/projects/:id/members", async (req, res) => {
  const { email, role } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return res.status(404).json({ ok: false, error: "Nenhuma conta cadastrada com esse e-mail." });

  try {
    await prisma.projectMember.create({
      data: { projectId: req.params.id, userId: user.id, role },
    });
    res.json({ ok: true, userId: user.id });
  } catch {
    res.status(400).json({ ok: false, error: `${user.name} já participa deste projeto.` });
  }
});

app.patch("/api/projects/:id/members/:userId", async (req, res) => {
  await prisma.projectMember.update({
    where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    data: { role: req.body.role },
  });
  res.json({ ok: true });
});

app.delete("/api/projects/:id/members/:userId", async (req, res) => {
  const { id: projectId, userId } = req.params;
  const { actorId, reason } = req.body;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ ok: false });

  await prisma.taskAssignment.deleteMany({
    where: { userId, task: { projectId } },
  });
  await prisma.task.updateMany({
    where: { projectId, creatorId: userId },
    data: { creatorId: project.ownerId },
  });
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  res.json({ ok: true, actorId, reason });
});

// 4. TAREFAS
app.post("/api/tasks", async (req, res) => {
  const { title, description, projectId, priority, tags, startDate, dueDate, assigneeIds, creatorId } = req.body;
  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      priority,
      tags,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      creatorId,
      assignments: { create: assigneeIds.map((userId: string) => ({ userId })) },
      activity: { create: { actorId: creatorId, action: "CREATED", message: "criou a tarefa" } },
    },
    include: { assignments: true, activity: true },
  });
  res.json({
    task: formatTask(task),
    activity: task.activity.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
  });
});

app.patch("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { patch, actorId, logMessage, logAction } = req.body;
  const { assigneeIds, startDate, dueDate, ...rest } = patch;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      ...(assigneeIds
        ? {
            assignments: {
              deleteMany: {},
              create: assigneeIds.map((userId: string) => ({ userId })),
            },
          }
        : {}),
      ...(logMessage
        ? { activity: { create: { actorId, action: logAction || "STATUS_CHANGED", message: logMessage } } }
        : {}),
    },
    include: { assignments: true, activity: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  res.json({
    task: formatTask(updated),
    latestActivity: updated.activity[0]
      ? { ...updated.activity[0], createdAt: updated.activity[0].createdAt.toISOString() }
      : null,
  });
});

app.delete("/api/tasks/:id", async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// 5. SUBTAREFAS E COMENTÁRIOS
app.post("/api/tasks/:id/subtasks", async (req, res) => {
  const count = await prisma.subtask.count({ where: { taskId: req.params.id } });
  const subtask = await prisma.subtask.create({
    data: { taskId: req.params.id, title: req.body.title, order: count },
  });
  res.json(subtask);
});

app.patch("/api/subtasks/:id/toggle", async (req, res) => {
  const current = await prisma.subtask.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).end();
  const updated = await prisma.subtask.update({
    where: { id: req.params.id },
    data: { done: !current.done },
  });
  const activity = await prisma.activityLog.create({
    data: {
      taskId: current.taskId,
      actorId: req.body.actorId,
      action: "SUBTASK_TOGGLED",
      message: `${updated.done ? "concluiu" : "reabriu"} o item "${updated.title}"`,
    },
  });
  res.json({ subtask: updated, activity: { ...activity, createdAt: activity.createdAt.toISOString() } });
});

app.delete("/api/subtasks/:id", async (req, res) => {
  await prisma.subtask.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.post("/api/tasks/:id/comments", async (req, res) => {
  const { authorId, body } = req.body;
  const comment = await prisma.comment.create({
    data: { taskId: req.params.id, authorId, body },
  });
  const activity = await prisma.activityLog.create({
    data: { taskId: req.params.id, actorId: authorId, action: "COMMENTED", message: "comentou na tarefa" },
  });
  res.json({
    comment: { ...comment, createdAt: comment.createdAt.toISOString() },
    activity: { ...activity, createdAt: activity.createdAt.toISOString() },
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));