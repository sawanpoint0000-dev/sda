// Firebase Config & Variables
const firebaseConfig = {
  apiKey: "AIzaSyDFG6e6pFT265Hf7s_3s-hEUD8sN0IDoY0",
  authDomain: "real-ede33.firebaseapp.com",
  databaseURL: "https://real-ede33-default-rtdb.firebaseio.com",
  projectId: "real-ede33",
  storageBucket: "real-ede33.firebasestorage.app",
  messagingSenderId: "683680941443",
  appId: "1:683680941443:web:73bc1c5fcf705330ac22b6",
  measurementId: "G-G37VVQJSG3"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const FIXED_PASS = "India@123";
const firstNames = ["Rahul","Aman","Vikash","Rohan","Sachin","Arjun","Karan","Nikhil","Yash","Aditya","Sawan","Ravi","Deepak","Ankit","Prakash","Mohit","Sunny","Vivek","Ajay","Pankaj"];
const surnames = ["Kumar","Singh","Sharma","Yadav","Gupta","Verma","Mishra","Patel","Jha","Thakur","Sinha","Roy","Das","Mahto","Rai","Prasad","Mehta","Joshi","Tripathi"];
let token = null;
let currentEmail = "";
let countdownInterval = null;
let remainingSeconds = 120;
const generateBtn = document.getElementById("generateBtn");
const currentBox = document.getElementById("currentBox");
const currentEmailText = document.getElementById("currentEmailText");
const timerEl = document.getElementById("timer");
const otpBox = document.getElementById("otpBox");
const statusEl = document.getElementById("status");
const historyList = document.getElementById("historyList");
const overlay = document.getElementById("processingOverlay");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const processingMsg = document.getElementById("processingMsg");
// Processing Animation
function startProcessingAnimation() {
  overlay.classList.add("active");
  progressBar.style.strokeDashoffset = 500;
  progressPercent.textContent = "0%";
  processingMsg.textContent = "Creating secure disposable email...";
  return new Promise(resolve => {
    let percent = 0;
    const interval = setInterval(() => {
      percent += Math.random() * 7 + 4;
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        progressPercent.textContent = "100%";
        processingMsg.textContent = "Email ready!";
        setTimeout(resolve, 700);
      } else {
        progressPercent.textContent = Math.floor(percent) + "%";
        progressBar.style.strokeDashoffset = 500 - (500 * percent / 100);
      }
    }, 90);
  });
}
// Main generate function
async function generateEmail() {
  generateBtn.disabled = true;
  generateBtn.textContent = "Creating...";
  setStatus("Initializing secure session...", "loading");
  await startProcessingAnimation();
  try {
    const domRes = await fetch("https://api.mail.tm/domains");
    if (!domRes.ok) throw new Error("Cannot fetch domains");
    const domData = await domRes.json();
    const domain = domData["hydra:member"]?.[0]?.domain;
    if (!domain) throw new Error("No domain available");
    currentEmail = generateRandomUsername() + "@" + domain;
    const accRes = await fetch("https://api.mail.tm/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: currentEmail, password: FIXED_PASS })
    });
    if (!accRes.ok) throw new Error("Account creation failed");
    const tokenRes = await fetch("https://api.mail.tm/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: currentEmail, password: FIXED_PASS })
    });
    if (!tokenRes.ok) throw new Error("Authentication failed");
    const tokenData = await tokenRes.json();
    token = tokenData.token;
    const emailKey = currentEmail.replace(/[@.]/g, '_');
    await db.ref(`generated_emails/${emailKey}`).set({
      email: currentEmail,
      createdAt: new Date().toISOString()
    });
    currentEmailText.textContent = currentEmail;
    currentBox.style.display = "block";
    otpBox.textContent = "Waiting for OTP...";
    otpBox.classList.remove("has-otp");
    setStatus("Email active • OTP checking...", "success");
    addToHistory(currentEmail);
    startCountdown();
  } catch (err) {
    setStatus("Error: " + (err.message || "Something went wrong"), "error");
  } finally {
    generateBtn.textContent = "Generate New Email";
    generateBtn.disabled = false;
    setTimeout(() => overlay.classList.remove("active"), 800);
  }
}
// ─── Helper Functions ───
function copyCurrentEmail() {
  navigator.clipboard.writeText(currentEmail).then(() => {
    generateBtn.textContent = "Copied ✓";
    setTimeout(() => generateBtn.textContent = "Generate New Email", 1400);
  }).catch(() => {});
}
function startCountdown() {
  generateBtn.disabled = true;
  if (countdownInterval) clearInterval(countdownInterval);
  remainingSeconds = 120;
  updateTimerDisplay();
  countdownInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
      timerEl.textContent = "00:00";
      otpBox.textContent = "Session ended";
      otpBox.classList.remove("has-otp");
      generateBtn.disabled = false;
      setStatus("Session ended – ready for new", "success");
    }
  }, 1000);
}
function updateTimerDisplay() {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
}
function addToHistory(email) {
  const div = document.createElement("div");
  div.className = "history-item";
  div.innerHTML = `<span>${email}</span><small>${new Date().toLocaleTimeString()}</small>`;
  historyList.prepend(div);
  setTimeout(() => div.classList.add("visible"), 20);
}
function generateRandomUsername() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase();
  const last = surnames[Math.floor(Math.random() * surnames.length)].toLowerCase();
  const num = Math.floor(10000 + Math.random() * 90000);
  const styles = [
    first + last + num,
    first + num + last,
    last + first + num,
    first + last + String(num).slice(0,3) + 'x',
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}
async function checkInbox() {
  if (!token || remainingSeconds <= 0) return;
  try {
    const res = await fetch("https://api.mail.tm/messages?page=1&limit=4", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    const msg = data["hydra:member"]?.[0];
    if (!msg) return;
    const text = (msg.intro || "") + " " + (msg.text || "");
    const match = text.match(/\b\d{6}\b/);
    if (match) {
      otpBox.textContent = match[0];
      otpBox.classList.add("has-otp");
      setStatus("OTP received → " + match[0], "success");
    }
  } catch {}
}
// Event listeners & intervals
generateBtn.onclick = generateEmail;
setInterval(checkInbox, 4800);
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    [...document.querySelectorAll('.history-item')].forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 120);
    });
  }, 600);
});
function setStatus(msg, type = "loading") {
  statusEl.textContent = msg;
  statusEl.className = type;
}
