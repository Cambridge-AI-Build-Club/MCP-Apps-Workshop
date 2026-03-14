import { App } from "@modelcontextprotocol/ext-apps";

// ---------- DOM Elements ----------

const todoListEl = document.getElementById("todo-list")!;
const addForm = document.getElementById("add-form") as HTMLFormElement;
const todoInput = document.getElementById("todo-input") as HTMLInputElement;
const statsEl = document.getElementById("stats")!;

// ---------- Types ----------

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

// ---------- App Setup ----------

const app = new App({ name: "Todo App", version: "1.0.0" });
app.connect();

// Handle the initial tool result pushed by the host
app.ontoolresult = (result) => {
  const text = result.content?.find((c: any) => c.type === "text")?.text;
  if (text) {
    try {
      renderTodos(JSON.parse(text));
    } catch {
      renderTodos([]);
    }
  }
};

// ---------- Rendering ----------

function renderTodos(todos: Todo[]) {
  if (todos.length === 0) {
    todoListEl.innerHTML =
      '<li class="empty-state">No todos yet. Add one above!</li>';
    statsEl.textContent = "";
    return;
  }

  const completed = todos.filter((t) => t.completed).length;
  statsEl.textContent = `${completed} of ${todos.length} completed`;

  todoListEl.innerHTML = todos
    .map(
      (t) => `
    <li class="todo-item ${t.completed ? "completed" : ""}" data-id="${t.id}">
      <input type="checkbox" class="todo-checkbox" ${t.completed ? "checked" : ""} />
      <span class="todo-title">${escapeHtml(t.title)}</span>
      <span class="todo-date">${new Date(t.createdAt).toLocaleDateString()}</span>
      <button class="delete-btn" title="Delete">&times;</button>
    </li>`
    )
    .join("");

  // Toggle completion
  todoListEl.querySelectorAll(".todo-checkbox").forEach((cb) => {
    cb.addEventListener("change", async (e) => {
      const item = (e.target as HTMLElement).closest(".todo-item")!;
      const id = Number(item.getAttribute("data-id"));
      item.classList.add("loading");
      await app.callServerTool({ name: "complete_todo", arguments: { id } });
      await refreshTodos();
    });
  });

  // Delete
  todoListEl.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const item = (e.target as HTMLElement).closest(".todo-item")!;
      const id = Number(item.getAttribute("data-id"));
      item.classList.add("loading");
      await app.callServerTool({ name: "delete_todo", arguments: { id } });
      await refreshTodos();
    });
  });
}

// ---------- Actions ----------

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;

  const btn = addForm.querySelector("button")!;
  btn.disabled = true;
  todoInput.value = "";

  await app.callServerTool({ name: "add_todo", arguments: { title } });
  await refreshTodos();
  btn.disabled = false;
  todoInput.focus();
});

async function refreshTodos() {
  const result = await app.callServerTool({
    name: "show_todos",
    arguments: {},
  });
  const text = result.content?.find((c: any) => c.type === "text")?.text;
  if (text) {
    try {
      renderTodos(JSON.parse(text));
    } catch {
      // ignore parse errors
    }
  }
}

// ---------- Helpers ----------

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
