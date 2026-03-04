// ================= API CONFIG =================
const BASE_URL = "https://hopeharbor-website.onrender.com/api";
const FEEDBACK_URL = BASE_URL + "/feedback";
const PAYMENT_URL = BASE_URL + "/payment";

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

// ================= HELPER: AUTH HEADERS =================
function authHeaders() {
    if (!jwtToken) {
        alert("Please login to continue!");
        showSection("login");
        throw new Error("Unauthorized: No token");
    }
    return { Authorization: `Bearer ${jwtToken}` };
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

        ["regName", "regEmail", "regPass"].forEach(id => document.getElementById(id).value = "");
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

        ["logEmail", "logPass"].forEach(id => document.getElementById(id).value = "");
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
    ["logEmail","logPass"].forEach(id => document.getElementById(id).value = "");
    alert("Logged out successfully!");
    showSection("home");
}

// ================= FEEDBACK =================
async function submitFeedback() {
    const text = document.getElementById("feedbackText").value.trim();
    if (!text) return alert("Please write some feedback!");

    try {
        await axios.post(FEEDBACK_URL, { message: text, name: "Anonymous" });
        document.getElementById("feedbackText").value = "";
        loadFeedback();
    } catch (err) {
        console.error("Feedback error:", err);
    }
}

async function loadFeedback() {
    try {
        const res = await axios.get(FEEDBACK_URL);
        const container = document.getElementById("feedbackList");
        container.innerHTML = "";
        res.data.forEach(f => {
            const div = document.createElement("div");
            div.className = "card p-2 mb-2";
            div.innerHTML = `<h6>${f.name}</h6><p>${f.message}</p>`;
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Error loading feedback:", err);
    }
}

function toggleFeedback() {
    showSection("feedback");
}

// ================= PAYMENTS =================
async function makePayment() {
    try {
        const amount = Number(document.getElementById("amount").value);
        const category = document.getElementById("category").value;
        const msg = document.getElementById("payMsg");
        msg.innerText = "";

        if (!amount || amount <= 0) {
            msg.style.color = "orange";
            msg.innerText = "Enter a valid amount";
            return;
        }

        const res = await axios.post(`${PAYMENT_URL}/single`, { amount, category }, {
            headers: authHeaders()
        });

        const { orderId, key, currency } = res.data;
        const options = {
            key,
            order_id: orderId,
            currency,
            amount: amount * 100,
            name: "HopeHarbor Donation",
            description: `Donation for ${category}`,
            handler: function (response) {
                msg.style.color = "green";
                msg.innerText = `Payment successful! Payment ID: ${response.razorpay_payment_id}`;
                loadProfileData();
            },
        };
        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error("Payment error:", err);
        document.getElementById("payMsg").style.color = "red";
        document.getElementById("payMsg").innerText = err.response?.data?.message || "Payment failed";
    }
}

async function autoPayment() {
    try {
        const res = await axios.post(`${PAYMENT_URL}/auto`, {}, { headers: authHeaders() });
        document.getElementById("payMsg").style.color = "green";
        document.getElementById("payMsg").innerText = res.data.message;
        loadProfileData();
    } catch (err) {
        console.error("Auto payment error:", err);
        document.getElementById("payMsg").style.color = "red";
        document.getElementById("payMsg").innerText = err.response?.data?.message || "Auto payment failed";
    }
}

// ================= PROFILE =================
async function loadProfileData() {
    try {
        const res = await axios.get(`${PAYMENT_URL}/history`, { headers: authHeaders() });

        const historyContainer = document.getElementById("historyData");
        const totalContainer = document.getElementById("userTotalAmount");
        historyContainer.innerHTML = "";
        let total = 0;

        res.data.forEach(p => {
            total += p.amount;
            const div = document.createElement("div");
            div.className = "card p-2 mb-2";
            div.innerHTML = `<strong>₹${p.amount}</strong> - ${p.category} - ${new Date(p.date).toLocaleString()}`;
            historyContainer.appendChild(div);
        });

        totalContainer.innerText = `₹${total}`;
    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// ================= ADMIN =================
async function loadAdminReport() {
    try {
        const res = await axios.get(`${PAYMENT_URL}/report`, { headers: authHeaders() });
        document.getElementById("totalPayments").innerText = `₹${res.data.totalCollection}`;
        document.getElementById("zakatData").innerText = `₹${res.data.zakatCollection}`;
        document.getElementById("dailyMonthlyData").innerText = `₹${res.data.generalCollection}`;
    } catch (err) {
        console.error("Admin report error:", err);
    }
}

function loadAdmin() { loadAdminReport(); }

// ================= EXPENSE =================
async function addExpense() {
    const amt = Number(document.getElementById("expenseAmount").value);
    if (!amt || amt <= 0) return alert("Enter valid expense amount");
    alert(`Expense ₹${amt} added!`);
    document.getElementById("expenseAmount").value = "";
}