const { ipcRenderer } = require("electron");

ipcRenderer.on("update_available", () => {
    alert("🚀 New update available! Downloading...");
});

ipcRenderer.on("update_downloaded", () => {
    alert("✅ Update downloaded. Restarting...");
    setTimeout(() => {
        ipcRenderer.send("restart_app");
    }, 3000);
});


document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    
    let button = document.getElementById("themeToggle");

    if (button.innerText === "🌙") {
        button.innerText = "☀️";
    } else {
        button.innerText = "🌙";
    }
});

// Task array to store tasks
let tasks = [];

// Load tasks from local storage
function loadTasks() {
    const storedTasks = localStorage.getItem("tasks");
    tasks = storedTasks ? JSON.parse(storedTasks) : [];
    tasks.forEach(renderTask);
}

// Save tasks to local storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Format date properly
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "No Due Date"; 

    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    };

    return date.toLocaleString('en-US', options); 
}

// Add task function
document.getElementById("addTaskBtn").addEventListener("click", addTask);

function addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskDueDate = document.getElementById("taskDueDate");

    if (taskInput.value.trim() === "") return alert("Task name cannot be empty!");

    const task = {
        id: Date.now(),
        name: taskInput.value,
        dueDate: taskDueDate.value,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTask(task);

    // Reset input fields
    taskInput.value = "";
    taskDueDate.value = "";
}

// Function to remove a task with animation
function removeTask(taskElement, taskId) {
    taskElement.style.animation = "fadeOut 0.3s ease-in-out";
    setTimeout(() => {
        taskElement.remove();
        deleteTask(taskId);
    }, 300); // Remove after animation ends
}

// Render task in the UI
function renderTask(task) {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < now && !task.completed;

    taskElement.innerHTML = `
        <p class="${task.completed ? 'completed' : ''}">${task.name}</p>
        <p class="${isOverdue ? 'overdue' : ''}">Due: <strong>${formatDateTime(task.dueDate)}</strong></p>
        <button class="task-button complete-btn" onclick="markComplete(${task.id})">👍</button>
        <button class="task-button delete-btn" onclick="removeTask(this.parentElement, ${task.id})">❌</button>
    `;

    // Fade-in effect for new tasks
    taskElement.style.animation = "fadeIn 0.3s ease-in-out";

    document.getElementById("taskList").appendChild(taskElement);
}

// Mark task as complete
function markComplete(taskId) {
    tasks = tasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
    );
    saveTasks();
    refreshTaskList();
}

// Delete task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    refreshTaskList();
}

// Refresh task list
function refreshTaskList() {
    document.getElementById("taskList").innerHTML = "";
    tasks.forEach(renderTask);
}

// Request permission for notifications when the page loads
if (Notification.permission !== "granted") {
    Notification.requestPermission().then(permission => {
        if (permission !== "granted") {
            console.warn("Notifications denied by user.");
        }
    });
}

// Function to send notifications
function sendNotification(task) {
    if (Notification.permission === "granted") {
        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const timeLeft = Math.round((dueDate - now) / (60 * 1000)); // Time left in minutes

        if (timeLeft > 0) {
            const notification = new Notification("Task Reminder ⏳", {
                body: `Your task "${task.name}" is due in ${timeLeft} mins!`,
                icon: "task-icon.png",
                requireInteraction: true, // Keeps notification visible until user interacts
            });

            notification.onclick = () => {
                window.focus(); // Bring the app into focus when clicked
            };
        }
    } else {
        console.warn("Notifications are blocked.");
    }
}
// Function to check and send reminders (optimized)
function checkReminders() {
    const now = new Date();
    
    tasks.forEach(task => {
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate - now;

            if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) { // Task due within 1 hour
                sendNotification(task);
            }
        }
    });
}

function formatOverdueTime(timeDiff) {
    const minutes = Math.floor(timeDiff / (60 * 1000));
    const hours = Math.floor(timeDiff / (60 * 60 * 1000));
    const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));

    if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""}`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

function sendOverdueNotification(task) {
    if (Notification.permission === "granted") {
        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const timeDiff = now - dueDate; // Overdue time in milliseconds

        if (timeDiff > 0) {
            const overdueTime = formatOverdueTime(timeDiff); // Get human-readable time format

            const notification = new Notification("Overdue Task ⚠️", {
                body: `Your task "${task.name}" is overdue by ${overdueTime}!`,
                icon: "task-icon.png",
                requireInteraction: true, // Keeps notification visible until user interacts
            });

            notification.onclick = () => {
                window.focus(); // Bring the app into focus when clicked
            };
        }
    } else {
        console.warn("Notifications are blocked.");
    }
}

// Function to check for overdue tasks
function checkOverdueTasks() {
    const now = new Date();

    tasks.forEach(task => {
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            if (now > dueDate && !task.completed) { // Task is overdue and not completed
                sendOverdueNotification(task);
            }
        }
    });
}

function formatTimeLeft(timeDiff) {
    const minutes = Math.floor(timeDiff / (60 * 1000));
    const hours = Math.floor(timeDiff / (60 * 60 * 1000));
    const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));

    if (weeks > 0) return `in ${weeks} week${weeks > 1 ? "s" : ""}`;
    if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
}

function sendDueNotification(task) {
    if (Notification.permission === "granted") {
        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate - now; // Time left in milliseconds

        if (timeDiff > 0) {
            const timeLeft = formatTimeLeft(timeDiff); // Get human-readable time format

            const notification = new Notification("Upcoming Task ⏳", {
                body: `Your task "${task.name}" is due ${timeLeft}!`,
                icon: "task-icon.png",
                requireInteraction: true, // Keeps notification visible until user interacts
            });

            notification.onclick = () => {
                window.focus(); // Bring the app into focus when clicked
            };
        }
    } else {
        console.warn("Notifications are blocked.");
    }
}

// Function to check for upcoming due tasks
function checkDueTasks() {
    const now = new Date();

    tasks.forEach(task => {
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate - now;

            if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000) { // Due within 24 hours
                sendDueNotification(task);
            }
        }
    });
}

// Run the reminder check
setInterval(checkReminders, 3600000);
setInterval(checkOverdueTasks, 3600000);
setInterval(checkDueTasks, 86400000);

// Load tasks when the app starts
loadTasks();


// (60,000 milliseconds = 1 minute)