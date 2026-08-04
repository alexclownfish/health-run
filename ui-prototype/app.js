const stations = [
  {
    title: "肩颈舒展",
    location: "绿茵庭",
    distance: "约 320 m",
    tag: "舒展",
    motion: "抬头看天 · 肩胛骨后夹",
    heading: "打开胸腔，深呼吸",
    instruction: "双脚站稳，手臂自然抬起，肩胛骨向后轻夹，感受胸前舒展。",
    seconds: 10,
    success: "肩颈已经醒来，继续沿路线前往下一站。",
  },
  {
    title: "手腕放松",
    location: "公园入口",
    distance: "约 610 m",
    tag: "放松",
    motion: "手臂前伸 · 掌心向外",
    heading: "伸展手腕，放松指尖",
    instruction: "手臂与地面平行，另一只手轻压指尖，左右各保持 5 秒。",
    seconds: 10,
    success: "手腕得到放松，还剩最后一个活力点位。",
  },
  {
    title: "腰背激活",
    location: "公园围栏",
    distance: "约 820 m",
    tag: "激活",
    motion: "双手扶髋 · 身体侧屈",
    heading: "唤醒腰背，找回支撑",
    instruction: "双脚与肩同宽，核心微收，身体缓慢向左右侧屈，不要前倾。",
    seconds: 12,
    success: "三个点位全部完成，回到起点即可解锁完赛凭证。",
  },
];

const storedProgress = Number(localStorage.getItem("patchwalk-progress"));
const state = {
  completed: Number.isFinite(storedProgress) ? Math.min(Math.max(storedProgress, 0), 3) : 0,
  current: Number.isFinite(storedProgress) ? Math.min(Math.max(storedProgress, 0), 2) : 0,
  timer: null,
  secondsLeft: 10,
};

const screens = [...document.querySelectorAll(".screen")];
const bottomNav = document.getElementById("bottomNav");
const appViewport = document.getElementById("appViewport");
const sheetBackdrop = document.getElementById("sheetBackdrop");
const nfcSheet = document.getElementById("nfcSheet");
const successSheet = document.getElementById("successSheet");
const toast = document.getElementById("toast");

function iconRefresh() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
}

function showScreen(name) {
  screens.forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === name));
  const primaryTab = ["route", "records", "profile"].includes(name);
  bottomNav.classList.toggle("is-hidden", !primaryTab);
  document.querySelector(".phone").classList.toggle("detail-mode", !primaryTab);
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === name));
  const active = document.querySelector(`[data-screen="${name}"]`);
  if (active) active.scrollTop = 0;
  closeSheets();
  iconRefresh();
}

function renderStations() {
  const list = document.getElementById("stationList");
  list.innerHTML = stations.map((station, index) => {
    const done = index < state.completed;
    const current = index === state.completed && state.completed < 3;
    const locked = index > state.completed;
    return `
      <article class="station-card ${done ? "is-done" : ""} ${locked ? "is-locked" : ""}" data-station="${index}" ${locked ? "aria-disabled=\"true\"" : ""}>
        <span class="station-number">${done ? "✓" : String(index + 1).padStart(2, "0")}</span>
        <div class="station-info"><strong>${station.title}</strong><span>${station.location} · ${station.tag}</span></div>
        <div class="station-meta"><b>${done ? "DONE" : current ? "NEXT" : "LOCKED"}</b><span>${station.distance}</span></div>
      </article>`;
  }).join("");

  document.querySelectorAll("[data-map-point]").forEach((point, index) => {
    point.classList.toggle("is-done", index < state.completed);
    point.classList.toggle("is-current", index === state.completed && state.completed < 3);
    point.querySelector("text").textContent = index < state.completed ? "✓" : index + 1;
  });

  const progressTitle = document.getElementById("routeProgressTitle");
  const ctaLabel = document.getElementById("routeCtaLabel");
  document.getElementById("progressCount").textContent = `${state.completed} / 3 点位`;
  progressTitle.textContent = state.completed === 0 ? "准备出发" : state.completed === 3 ? "路线已完成" : `下一站 · ${stations[state.completed].title}`;
  ctaLabel.textContent = state.completed === 0 ? "开始漫步" : state.completed === 3 ? "查看完赛凭证" : `前往点位 ${state.completed + 1}`;
  updateRecords();
}

function prepareStation(index = state.current) {
  state.current = Math.min(index, 2);
  const station = stations[state.current];
  document.getElementById("actionTitle").textContent = `点位 ${state.current + 1} · ${station.title}`;
  document.querySelector(".sub-title p").textContent = `NFC 已识别 · ${station.location}`;
  document.getElementById("headerStep").textContent = `${state.current + 1}/3`;
  document.getElementById("motionTagText").textContent = station.motion;
  document.getElementById("instructionTitle").textContent = station.heading;
  document.getElementById("instructionText").textContent = station.instruction;
  document.getElementById("uploadSubtitle").textContent = `点位 ${state.current + 1} · ${station.title}`;
  document.getElementById("uploadStep").textContent = `${state.current + 1}/3`;
  resetTimer(station.seconds);

  const person = document.getElementById("motionPerson");
  person.dataset.motion = state.current;
}

function openSheet(sheet) {
  sheetBackdrop.classList.add("is-open");
  sheet.classList.add("is-open");
  iconRefresh();
}

function closeSheets() {
  sheetBackdrop.classList.remove("is-open");
  nfcSheet.classList.remove("is-open");
  successSheet.classList.remove("is-open");
}

function startRoute() {
  if (state.completed >= 3) {
    renderCertificate();
    showScreen("certificate");
    return;
  }
  state.current = state.completed;
  const station = stations[state.current];
  document.getElementById("nfcTitle").textContent = `点位 ${state.current + 1} · ${station.title}`;
  document.getElementById("nfcDescription").textContent = `已到达${station.location}。将手机顶部靠近 NFC 感应区，保持 1–2 秒。`;
  openSheet(nfcSheet);
}

function resetTimer(seconds) {
  clearInterval(state.timer);
  state.timer = null;
  state.secondsLeft = seconds;
  document.getElementById("timerDisplay").textContent = `00:${String(seconds).padStart(2, "0")}`;
  const button = document.querySelector('[data-action="toggle-timer"]');
  button.innerHTML = '<i data-lucide="play"></i><span>开始计时</span>';
  iconRefresh();
}

function toggleTimer() {
  const button = document.querySelector('[data-action="toggle-timer"]');
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
    button.innerHTML = '<i data-lucide="play"></i><span>继续计时</span>';
    iconRefresh();
    return;
  }
  if (state.secondsLeft <= 0) resetTimer(stations[state.current].seconds);
  button.innerHTML = '<i data-lucide="pause"></i><span>暂停</span>';
  iconRefresh();
  state.timer = setInterval(() => {
    state.secondsLeft -= 1;
    document.getElementById("timerDisplay").textContent = `00:${String(Math.max(state.secondsLeft, 0)).padStart(2, "0")}`;
    if (state.secondsLeft <= 0) {
      clearInterval(state.timer);
      state.timer = null;
      button.innerHTML = '<i data-lucide="check"></i><span>计时完成</span>';
      iconRefresh();
      showToast("动作计时完成");
    }
  }, 1000);
}

function submitPoint() {
  if (!document.getElementById("privacyCheck").checked) {
    showToast("请先确认照片隐私设置", "alert-circle");
    return;
  }
  state.completed = Math.max(state.completed, state.current + 1);
  localStorage.setItem("patchwalk-progress", state.completed);
  renderStations();
  const station = stations[state.current];
  document.getElementById("successTitle").textContent = `点位 ${state.current + 1} 已完成`;
  document.getElementById("successDescription").textContent = station.success;
  document.getElementById("successProgressBar").style.width = `${state.completed / 3 * 100}%`;
  document.getElementById("continueLabel").textContent = state.completed === 3 ? "生成完赛凭证" : "查看下一站";
  openSheet(successSheet);
}

function continueRoute() {
  if (state.completed >= 3) {
    renderCertificate();
    showScreen("certificate");
  } else {
    state.current = state.completed;
    showScreen("route");
    showToast(`点位 ${state.completed} 已完成`);
  }
}

function renderCertificate() {
  const now = new Date();
  const dateCode = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  document.getElementById("certificateId").textContent = dateCode;
  document.getElementById("completeTime").textContent = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  document.getElementById("certificateStations").innerHTML = stations.map((station, index) => `
    <div class="certificate-station"><b>${index + 1}</b><span>${station.title} · ${station.location}</span><span>完成</span></div>
  `).join("");
}

function updateRecords() {
  const factor = Math.max(state.completed, 1);
  document.getElementById("weeklyEnergy").textContent = state.completed === 3 ? "260" : String(60 + factor * 20);
  document.getElementById("ringValue").textContent = state.completed === 3 ? "86%" : `${40 + factor * 10}%`;
  document.querySelector(".energy-ring").style.setProperty("--p", state.completed === 3 ? "86%" : `${40 + factor * 10}%`);
  document.getElementById("totalDistance").textContent = state.completed === 3 ? "1.0" : (state.completed * 0.3).toFixed(1);
  document.getElementById("totalCalories").textContent = state.completed === 3 ? "68" : String(state.completed * 18);
  document.getElementById("totalPoints").textContent = state.completed;
}

function showToast(message, icon = "check-circle-2") {
  toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  toast.classList.add("is-visible");
  iconRefresh();
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function resetProgress() {
  state.completed = 0;
  state.current = 0;
  localStorage.setItem("patchwalk-progress", "0");
  renderStations();
  showScreen("route");
  showToast("演示进度已重置");
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) {
    showScreen(tab.dataset.tab);
    return;
  }

  const stationCard = event.target.closest("[data-station]");
  if (stationCard && !stationCard.classList.contains("is-locked")) {
    const index = Number(stationCard.dataset.station);
    if (index < state.completed) {
      showToast("该点位已完成");
    } else {
      state.current = index;
      startRoute();
    }
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  const actions = {
    profile: () => showScreen("profile"),
    "back-route": () => showScreen("route"),
    "back-action": () => showScreen("action"),
    "start-route": startRoute,
    "close-sheet": closeSheets,
    "simulate-nfc": () => {
      const button = document.querySelector('[data-action="simulate-nfc"]');
      button.innerHTML = '<span>识别中...</span><i data-lucide="loader-circle"></i>';
      iconRefresh();
      button.querySelector("svg")?.classList.add("spin");
      setTimeout(() => {
        prepareStation(state.current);
        showScreen("action");
        showToast("NFC 点位识别成功");
        button.innerHTML = '<span>模拟碰一碰</span><i data-lucide="radio-tower"></i>';
        iconRefresh();
      }, 700);
    },
    "open-action-manual": () => { prepareStation(state.current); showScreen("action"); },
    "toggle-timer": toggleTimer,
    "finish-action": () => { resetTimer(stations[state.current].seconds); showScreen("upload"); },
    "submit-point": submitPoint,
    "continue-route": continueRoute,
    "demo-complete": () => {
      state.completed = 3;
      state.current = 2;
      localStorage.setItem("patchwalk-progress", "3");
      renderStations();
      renderCertificate();
      showScreen("certificate");
    },
    share: () => {
      if (navigator.share) {
        navigator.share({ title: "轻跑完赛凭证", text: "我完成了午间漫步健康路线，3/3 点位全部打卡！" }).catch(() => {});
      } else {
        showToast("分享文案已准备");
      }
    },
    download: () => showToast("凭证已保存到相册（原型演示）", "download"),
    "reset-progress": resetProgress,
  };
  actions[action]?.();
});

sheetBackdrop.addEventListener("click", closeSheets);

document.getElementById("photoInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    showToast("照片不能超过 10MB", "alert-circle");
    return;
  }
  const preview = document.getElementById("photoPreview");
  preview.src = URL.createObjectURL(file);
  document.getElementById("photoStage").classList.add("has-photo");
  showToast("照片已就绪");
});

function setStatusTime() {
  document.getElementById("statusTime").textContent = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

renderStations();
renderCertificate();
setStatusTime();
iconRefresh();
setInterval(setStatusTime, 30000);

const previewScreen = new URLSearchParams(window.location.search).get("screen");
if (["route", "action", "upload", "certificate", "records", "profile"].includes(previewScreen)) {
  if (previewScreen === "action" || previewScreen === "upload") prepareStation(0);
  if (previewScreen === "certificate") renderCertificate();
  showScreen(previewScreen);
}
