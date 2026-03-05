// ================= API CONFIG =================
const BASE_URL = "https://hopeharbor-website.onrender.com/api";
const FEEDBACK_URL = BASE_URL + "/feedback";
const PAYMENT_URL = BASE_URL + "/payment";

let jwtToken = localStorage.getItem("jwtToken") || null;
let userRole = localStorage.getItem("role") || null;


// ================= SPA NAVIGATION =================
function showSection(id) {
    document.querySelectorAll(".spa-section")
        .forEach(sec => sec.classList.remove("active"));

    const section = document.getElementById(id);
    if (section) section.classList.add("active");
}

function toggleMenu() {
    document.getElementById("navLinks").classList.toggle("show");
}


// ================= AUTH HEADER =================
function authHeaders() {
    if (!jwtToken) {
        alert("Please login first!");
        showSection("login");
        throw new Error("No token found");
    }
    return { Authorization: `Bearer ${jwtToken}` };
}


// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {
    showSection("home");
    loadFeedback();

    const adminNav = document.getElementById("adminNav");
    if (adminNav) adminNav.style.display = "none";

    // ✅ Show admin if role exists
    if (userRole === "admin" && adminNav) {
        adminNav.style.display = "inline-block";
    }
});


// ================= REGISTER =================
async function register() {
    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPass.value.trim();
    const msg = regMsg;

    if (!name || !email || !password) {
        msg.style.color = "orange";
        msg.innerText = "Please fill all fields!";
        return;
    }

    try {
        await axios.post(`${BASE_URL}/auth/register`, { name, email, password });

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
    const email = logEmail.value.trim();
    const password = logPass.value.trim();
    const msg = logMsg;

    if (!email || !password) {
        msg.style.color = "orange";
        msg.innerText = "Fill all fields!";
        return;
    }

    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });

        jwtToken = res.data.token;
        userRole = res.data.user.role;

        localStorage.setItem("jwtToken", jwtToken);
        localStorage.setItem("role", userRole);

        if (userRole === "admin") {
            document.getElementById("adminNav").style.display = "inline-block";
        }

        msg.style.color = "green";
        msg.innerText = "Login successful!";
        setTimeout(() => showSection("home"), 1000);

    } catch (err) {
        msg.style.color = "red";
        msg.innerText = err.response?.data?.message || "Invalid credentials";
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

    alert("Logged out successfully!");
    showSection("home");
}


// ================= FEEDBACK =================
async function submitFeedback() {
    const text = feedbackText.value.trim();
    if (!text) return alert("Write feedback first!");

    try {
        const userRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: authHeaders()
        });

        await axios.post(FEEDBACK_URL, {
            message: text,
            name: userRes.data.name
        });

        feedbackText.value = "";
        loadAdminFeedback();

    } catch (err) {
        console.error(err);
    }
}

async function loadAdminFeedback() {
    try {
        const res = await axios.get(FEEDBACK_URL);

        const container = document.getElementById("adminFeedbackList");
        container.innerHTML = "";

        res.data.forEach(f => {
            container.innerHTML += `
                <div class="card p-2 mb-2">
                    <strong>${f.name}</strong>
                    <p>${f.message}</p>
                    <small>${new Date(f.date).toLocaleString()}</small>
                </div>`;
        });

    } catch (err) {
        console.error("Admin feedback error:", err);
    }
}

// ================= PAYMENT =================
async function makePayment() {
    try {
        const amount = Number(document.getElementById("amount").value);
        const category = document.getElementById("category").value;
        const msg = document.getElementById("payMsg");

        if (!amount || amount <= 0) {
            msg.style.color = "orange";
            msg.innerText = "Enter valid amount";
            return;
        }

        const res = await axios.post(`${PAYMENT_URL}/single`,
            { amount, category },
            { headers: authHeaders() }
        );

        const { orderId, key } = res.data;

        const options = {
            key,
            order_id: orderId,
            amount: amount * 100,
            currency: "INR",
            name: "HopeHarbor Donation",
            description: `Donation for ${category}`,

            handler: async function (response) {

                await axios.post(`${PAYMENT_URL}/verify`, {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    amount,
                    category
                }, { headers: authHeaders() });

                msg.style.color = "green";
                msg.innerText = "Payment successful!";
                loadProfileData();
            }
        };

        new Razorpay(options).open();

    } catch (err) {
        payMsg.style.color = "red";
        payMsg.innerText = "Payment failed";
    }
}


// ================= PROFILE =================
async function loadProfileData() {
    try {
        const userRes = await axios.get(`${BASE_URL}/auth/me`,
            { headers: authHeaders() });

        profileName.innerText = userRes.data.name;

        const savedPhoto = localStorage.getItem("profilePhoto");
        if (savedPhoto) profileImage.src = savedPhoto;

        const payRes = await axios.get(`${PAYMENT_URL}/history`,
            { headers: authHeaders() });

        historyData.innerHTML = "";
        let total = 0;

        if (!Array.isArray(payRes.data) || payRes.data.length === 0) {
            historyData.innerHTML = "<p>No payments yet.</p>";
            userTotalAmount.innerText = "₹0";
            return;
        }

        payRes.data.forEach(p => {
            total += p.amount;
            historyData.innerHTML += `
                <div class="card p-2 mb-2">
                    <strong>₹${p.amount}</strong>
                    - ${p.category}
                    - ${new Date(p.date).toLocaleString()}
                </div>`;
        });

        userTotalAmount.innerText = `₹${total}`;

    } catch (err) {
        console.error("Profile load error:", err);
    }
}


// ================= ADMIN =================
function loadAdmin() {
    if (userRole !== "admin") {
        alert("Access denied!");
        showSection("home");
        return;
    }
    loadAdminReport();
}

async function loadAdminReport() {
    try {
        const res = await axios.get(`${PAYMENT_URL}/report`,
            { headers: authHeaders() });

        totalPayments.innerText = `₹${res.data.totalCollection}`;
        zakatData.innerText = `₹${res.data.zakatCollection}`;
        dailyMonthlyData.innerText = `₹${res.data.generalCollection}`;

    } catch (err) {
        console.error("Admin report error:", err);
    }
}