// ================= API CONFIG =================
const BASE_URL = "https://hopeharbor-website.onrender.com/api";
const FEEDBACK_URL = BASE_URL + "/feedback";
const PAYMENT_URL = BASE_URL + "/payment";

let jwtToken = localStorage.getItem("jwtToken") || null;
let userRole = localStorage.getItem("role") || null;

// ================= SPA NAVIGATION =================
function showSection(id) {
    document.querySelectorAll(".spa-section").forEach(sec => sec.classList.remove("active"));
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
    return { Authorization: `Bearer ${jwtToken}` };
}

// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {
    showSection("home");
    const adminNav = document.getElementById("adminNav");
    if (adminNav) adminNav.style.display = userRole === "admin" ? "inline-block" : "none";
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
        const res = await axios.post(`${BASE_URL}/auth/register`, { name, email, password });
        msg.style.color = "green";
        msg.innerText = res.data.message || "Registered! Please login.";
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
        const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
        const data = res.data;

        jwtToken = res.data.token;
        userRole = res.data.user.role;

        localStorage.setItem("jwtToken", jwtToken);
        localStorage.setItem("role", userRole);

        msg.style.color = "green";
        msg.innerText = "Login successful!";

        if (userRole === "admin") {
            document.getElementById("adminNav").style.display = "inline-block";
        }

        showSection("home");
    } catch (err) {
        console.log(err.response?.data);
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
    document.getElementById("adminNav").style.display = "none";
    alert("Logged out!");
    showSection("home");
}

// ================= PROFILE =================
async function loadProfileData() {
    if (!jwtToken) { showSection("login"); return; }
    try {
        const res = await axios.get(`${BASE_URL}/auth/me`, { headers: authHeaders() });
        const user = res.data;
        document.getElementById("profileName").innerText = user.name;
        document.getElementById("profileImage").src = user.avatar || "images/man1.png";
    } catch (err) { console.error("Profile load error:", err); }
}

function uploadPhoto() {
    const fileInput = document.getElementById("photoUpload");
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    axios.post(`${BASE_URL}/auth/upload-avatar`, formData, { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } })
        .then(res => { alert("Photo uploaded!"); loadProfileData(); })
        .catch(err => console.error("Upload error:", err));
}

// ================= FEEDBACK =================
function toggleFeedback() {
    const section = document.getElementById("feedback");
    section.style.display = section.style.display === "block" ? "none" : "block";
}

async function submitFeedback() {
    const text = document.getElementById("feedbackText").value.trim();
    if (!text) { alert("Write feedback first!"); return; }
    try {
        const userRes = await axios.get(`${BASE_URL}/auth/me`, { headers: authHeaders() });
        await axios.post(FEEDBACK_URL, { name: userRes.data.name, message: text });
        document.getElementById("feedbackText").value = "";
        alert("Feedback submitted!");
    } catch (err) { console.error(err); }
}

async function loadFeedback() {
    try {
        const res = await axios.get(FEEDBACK_URL);
        const container = document.getElementById("feedbackList");
        container.innerHTML = "";
        res.data.forEach(f => {
            container.innerHTML += `<div class="card p-2 mb-2"><strong>${f.name}</strong><p>${f.message}</p><small>${new Date(f.createdAt).toLocaleString()}</small></div>`;
        });
    } catch (err) { console.error(err); }
}

// ================= PAYMENT =================
async function makePayment() {
    if (!jwtToken) { alert("Login first!"); showSection("login"); return; }

    const amount = parseInt(prompt("Enter amount in ₹:"));
    if (!amount || amount <= 0) { alert("Invalid amount!"); return; }

    try {
        // 1️⃣ Create Razorpay order
        const orderRes = await axios.post(`${PAYMENT_URL}/single`, { amount, category: "general" }, { headers: authHeaders() });

        const options = {
            key: orderRes.data.key,
            amount: orderRes.data.amount * 100,
            currency: orderRes.data.currency,
            name: "HopeHarbor",
            description: "Donation",
            order_id: orderRes.data.orderId,
            handler: async function (response) {
                // 2️⃣ Verify payment
                try {
                    await axios.post(`${PAYMENT_URL}/verify`, {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        amount,
                        category: "general"
                    }, { headers: authHeaders() });
                    alert("Payment successful!");
                } catch (err) {
                    console.error(err);
                    alert("Payment verification failed!");
                }
            },
            theme: { color: "#00c6ff" }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error("Payment error:", err);
        alert("Payment failed!");
    }
}

// ================= ADMIN =================
async function loadAdmin() {
    if (!userRole || userRole !== "admin") { alert("Access denied!"); showSection("home"); return; }
    await loadAdminReport(); // Add loadAdminFeedback() if exists
}

async function loadAdminReport() {
    try {
        const res = await axios.get(`${PAYMENT_URL}/report`, { headers: authHeaders() });
        document.getElementById("totalPayments").innerText = `₹${res.data.totalCollection || 0}`;
        document.getElementById("zakatData").innerText = `₹${res.data.zakatCollection || 0}`;
        document.getElementById("dailyMonthlyData").innerText = `₹${res.data.generalCollection || 0}`;
    } catch (err) { console.error("Admin report error:", err); }
}