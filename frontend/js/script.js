// ================= API CONFIG =================
const BASE_URL = "https://hopeharbor-website.onrender.com/api";
const FEEDBACK_URL = BASE_URL + "/feedback";

let jwtToken = localStorage.getItem("jwtToken") || null;

// ================= SPA SECTION NAVIGATION =================
function showSection(id) {
    document.querySelectorAll(".spa-section").forEach(sec => sec.classList.remove("active"));
    const section = document.getElementById(id);
    if (section) section.classList.add("active");

    document.querySelectorAll("nav.spa-nav a").forEach(link => link.classList.remove("active"));
}

function toggleMenu() {
    document.getElementById("navLinks").classList.toggle("show");
}

// ================= DEFAULT PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {
    showSection("home");

    const totalMembers = document.getElementById("total-members");
    if (totalMembers) totalMembers.innerText = 150;

    loadFeedback();

    ["regName", "regEmail", "regPass", "logEmail", "logPass"]
        .forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = "";
        });
});

// ================= REGISTER =================
async function register() {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPass").value.trim();
    const msg = document.getElementById("regMsg");
    msg.innerText = "";

    if (!name || !email || !password) {
        msg.style.color = "orange";
        msg.innerText = "Please fill all fields!";
        return;
    }

    try {
        await axios.post(`${BASE_URL}/auth/register`, { name, email, password });

        msg.style.color = "lightgreen";
        msg.innerText = "Registered successfully! Please login.";

        ["regName", "regEmail", "regPass"]
            .forEach(id => document.getElementById(id).value = "");

        setTimeout(() => showSection("login"), 1000);

    } catch (err) {
        msg.style.color = "red";
        msg.innerText = err.response?.data?.message || "Registration failed!";
    }
}

// ================= LOGIN =================
async function login() {
    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPass").value.trim();
    const msg = document.getElementById("logMsg");
    msg.innerText = "";

    if (!email || !password) {
        msg.style.color = "orange";
        msg.innerText = "Please fill all fields!";
        return;
    }

    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });

        jwtToken = res.data.token;
        localStorage.setItem("jwtToken", jwtToken);

        msg.style.color = "lightgreen";
        msg.innerText = "Login successful!";

        ["logEmail", "logPass"]
            .forEach(id => document.getElementById(id).value = "");

        setTimeout(() => showSection("home"), 1000);

    } catch (err) {
        msg.style.color = "red";
        msg.innerText = err.response?.data?.message || "Invalid credentials!";
    }
}

// ================= LOGOUT =================
function logout() {
    jwtToken = "";
    localStorage.removeItem("jwtToken");
    ["logEmail","logPass"]
        .forEach(id => document.getElementById(id).value = "");
    alert("Logged out successfully!");
    showSection("home");
}
async function loadFeedback() {
    try {
        const response = await fetch(FEEDBACK_URL);
        const data = await response.json();

        const feedbackContainer = document.getElementById("feedbackList");
        feedbackContainer.innerHTML = "";

        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "card p-3 mb-2";
            div.innerHTML = `
                <h6>${item.name}</h6>
                <p>${item.message}</p>
            `;
            feedbackContainer.appendChild(div);
        });

    } catch (error) {
        console.error("Error loading feedback:", error);
    }
}