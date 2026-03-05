// ================= API CONFIG =================
const BASE_URL = "https://hopeharbor-website.onrender.com/api";
const FEEDBACK_URL = BASE_URL + "/feedback";
const PAYMENT_URL = BASE_URL + "/payment";

let jwtToken = localStorage.getItem("jwtToken")||null;
let userRole = localStorage.getItem("role")||null;


// ================= SPA NAVIGATION =================
function showSection(id) {
    document.querySelectorAll(".spa-section")
        .forEach(sec => sec.classList.remove("active"));

    const section = document.getElementById(id);
    if (section) section.classList.add("active");
}

function toggleMenu() {
    const nav = document.getElementById("navLinks");
    if (nav) nav.classList.toggle("show");
}


// ================= AUTH HEADER =================
function authHeaders() {

    if (!jwtToken) {
        alert("Please login first!");
        showSection("login");
        throw new Error("No token");
    }

    return {
        Authorization: `Bearer ${jwtToken}`
    };
}


// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {

    showSection("home");

    const adminNav = document.getElementById("adminNav");

    if (adminNav) adminNav.style.display = "none";

    if (userRole === "admin" && adminNav) {
        adminNav.style.display = "inline-block";
    }

});


// ================= REGISTER =================
async function register() {

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPass").value.trim();
    const msg = document.getElementById("regMsg");

    if (!name || !email || !password) {

        msg.style.color = "orange";
        msg.innerText = "Please fill all fields!";
        return;

    }

    try {

        await axios.post(`${BASE_URL}/auth/register`, {
            name,
            email,
            password
        });

        msg.style.color = "green";
        msg.innerText = "Registered! Please login.";

        setTimeout(() => showSection("login"), 1000);

    } catch (err) {

        msg.style.color = "red";
        msg.innerText = err.response?.data?.message || "Registration failed";

    }

}


// ================= LOGIN =================
async function login() {

    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPass").value.trim();
    const msg = document.getElementById("logMsg");

    if (!email || !password) {

        msg.style.color = "orange";
        msg.innerText = "Please fill all fields!";
        return;

    }

    try {

        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password
        });

        const data = res.data;

        jwtToken = data.token;
        userRole = data.user.role;

        localStorage.setItem("jwtToken", jwtToken);
        localStorage.setItem("role", userRole);

        msg.style.color = "green";
        msg.innerText = "Login successful!";

        if (userRole === "admin") {

            const adminNav = document.getElementById("adminNav");

            if (adminNav) adminNav.style.display = "inline-block";

        }

        showSection("home");

    } catch (err) {

        msg.style.color = "red";
        msg.innerText = err.response?.data?.message || "Login failed";

    }

}


// ================= LOGOUT =================
function logout() {

    jwtToken = null;
    userRole = null;

    localStorage.removeItem("jwtToken");
    localStorage.removeItem("role");

    const adminNav = document.getElementById("adminNav");

    if (adminNav) adminNav.style.display = "none";

    alert("Logged out!");
    showSection("home");

}


// ================= FEEDBACK =================
async function submitFeedback() {

    const feedbackText = document.getElementById("feedbackText");

    const text = feedbackText.value.trim();

    if (!text) {
        alert("Write feedback first!");
        return;
    }

    try {

        const userRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: authHeaders()
        });

        await axios.post(FEEDBACK_URL, {

            name: userRes.data.name,
            message: text

        });

        feedbackText.value = "";

        alert("Feedback submitted!");

    } catch (err) {

        console.error(err);

    }

}


// ================= ADMIN FEEDBACK =================
async function loadAdminFeedback() {

    try {

        const res = await axios.get(FEEDBACK_URL);

        const container = document.getElementById("adminFeedbackList");

        if (!container) return;

        container.innerHTML = "";

        res.data.forEach(f => {

            container.innerHTML += `
            <div class="card p-2 mb-2">
                <strong>${f.name}</strong>
                <p>${f.message}</p>
                <small>${new Date(f.createdAt).toLocaleString()}</small>
            </div>
            `;

        });

    } catch (err) {

        console.error("Feedback load error:", err);

    }

}


// ================= ADMIN =================
function loadAdmin() {

    if (!userRole || userRole !== "admin") {

        alert("Access denied!");
        showSection("home");
        return;

    }

    loadAdminReport();
    loadAdminFeedback();

}


async function loadAdminReport() {

    try {

        const res = await axios.get(`${PAYMENT_URL}/report`, {
            headers: authHeaders()
        });

        const totalPayments = document.getElementById("totalPayments");
        const zakatData = document.getElementById("zakatData");
        const dailyMonthlyData = document.getElementById("dailyMonthlyData");

        if (totalPayments)
            totalPayments.innerText = `₹${res.data.totalCollection || 0}`;

        if (zakatData)
            zakatData.innerText = `₹${res.data.zakatCollection || 0}`;

        if (dailyMonthlyData)
            dailyMonthlyData.innerText = `₹${res.data.generalCollection || 0}`;

    } catch (err) {

        console.error("Admin report error:", err);

    }

}