const STORAGE_KEY = 'routine_weekday_v1';
const MAX_WEEKS = 4;
let currentEditPeriod = getCurrentPeriod();

function getCurrentPeriod() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    tasks: { Monday: ["Email Review"], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
    history: { Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {}, Saturday: {}, Sunday: {} },
    titles: { Monday: "Monday Routine", Tuesday: "Tuesday Routine", Wednesday: "Wednesday Routine", Thursday: "Thursday Routine", Friday: "Friday Routine", Saturday: "Saturday Routine", Sunday: "Sunday Routine" }
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function renderTasks() {
  const data = loadData();
  const period = getCurrentPeriod();
  const today = getTodayKey();
  const tasks = data.tasks[period] || [];

  if (!data.history[period][today]) {
    data.history[period][today] = {};
    tasks.forEach(t => data.history[period][today][t] = false);
    trimHistory(data.history[period]);
    saveData(data);
  }

  document.getElementById("task-header").innerText = data.titles?.[period] || (period + " Routine");

  const ul = document.getElementById("task-list");
  ul.innerHTML = "";
  const recentDays = getLastNDates(28).filter(d => new Date(d).toLocaleDateString("en-US", { weekday: "long" }) === period);

  tasks.forEach(task => {
    let count = 0;
    recentDays.forEach(day => {
      if (data.history[period]?.[day]?.[task]) count++;
    });
    const percent = Math.round((count / MAX_WEEKS) * 100);

    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = data.history[period][today][task];
    checkbox.onchange = () => {
      data.history[period][today][task] = checkbox.checked;
      saveData(data);
      renderTasks();
      const allChecked = tasks.every(t => data.history[period][today][t]);
      if (allChecked) setTimeout(() => window.close(), 500);
    };
    const label = document.createElement("span");
    label.innerHTML = `${task} <small style="font-size:0.7em;">(${percent}%)</small>`;

    li.appendChild(checkbox);
    li.appendChild(label);
    ul.appendChild(li);
  });

  document.getElementById("completion-rate").innerHTML = "";
}

function getLastNDates(n) {
  const dates = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function renderEditList() {
  const data = loadData();
  const select = document.getElementById("edit-period");
  if (select) currentEditPeriod = select.value;
  const titleBox = document.getElementById("list-title");
  if (titleBox) titleBox.value = data.titles?.[currentEditPeriod] || currentEditPeriod + " Routine";

  const ul = document.getElementById("edit-list");
  ul.innerHTML = "";
  (data.tasks[currentEditPeriod] || []).forEach((task, i) => {
    const li = document.createElement("li");
    li.innerText = task;
    const btn = document.createElement("button");
    btn.innerText = "🗑️";
    btn.onclick = () => {
      data.tasks[currentEditPeriod].splice(i, 1);
      Object.keys(data.history[currentEditPeriod]).forEach(day => delete data.history[currentEditPeriod][day][task]);
      saveData(data);
      renderTasks();
      renderEditList();
    };
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function updateListTitle() {
  const input = document.getElementById("list-title");
  const data = loadData();
  data.titles[currentEditPeriod] = input.value;
  saveData(data);
  renderTasks();
}

function toggleEditMode() {
  const edit = document.getElementById("edit-section");
  const list = document.getElementById("task-list");
  const title = document.getElementById("task-header");
  const button = document.querySelector("#settings-menu button[onclick='toggleEditMode()']");
  const isEditing = edit.style.display === "none";
  edit.style.display = isEditing ? "block" : "none";
  list.style.display = isEditing ? "none" : "block";
  title.style.display = isEditing ? "none" : "block";
  if (button) button.innerText = isEditing ? "Close Edit" : "Edit Tasks";
  if (isEditing) renderEditList();
}

function addTask() {
  const input = document.getElementById("new-task");
  const task = input.value.trim();
  if (!task) return;
  const data = loadData();
  if (!data.tasks[currentEditPeriod].includes(task)) {
    data.tasks[currentEditPeriod].push(task);
    Object.keys(data.history[currentEditPeriod]).forEach(day => data.history[currentEditPeriod][day][task] = false);
    saveData(data);
    renderTasks();
    renderEditList();
  }
  input.value = "";
}

function trimHistory(hist) {
  const cutoff = getLastNDates(28);
  for (let day in hist) {
    if (!cutoff.includes(day)) delete hist[day];
  }
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied!");
}

function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "routine_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      alert("Data imported! Reloading...");
      location.reload();
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
}

function toggleSettings() {
  const menu = document.getElementById("settings-menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

function showReadme() {
  document.getElementById("readme-modal").style.display = "block";
}

function hideReadme() {
  document.getElementById("readme-modal").style.display = "none";
}

window.onload = () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  renderTasks();
  document.querySelectorAll('#settings-menu button, #settings-menu input[type="file"]').forEach(el => {
    el.addEventListener('click', () => {
      const menu = document.getElementById("settings-menu");
      if (menu) menu.style.display = "none";
    });
  });
};
