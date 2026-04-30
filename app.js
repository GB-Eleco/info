import { provinceOptions, schoolRecords as seedRecords } from "./data.js";

const STORAGE_KEY = "school-info-records-v1";

const rankFilter = document.querySelector("#rankFilter");
const provinceFilter = document.querySelector("#provinceFilter");
const resetFilters = document.querySelector("#resetFilters");
const resultList = document.querySelector("#resultList");
const resultMeta = document.querySelector("#resultMeta");
const activeFilters = document.querySelector("#activeFilters");
const heroStats = document.querySelector("#heroStats");

const recordForm = document.querySelector("#recordForm");
const recordId = document.querySelector("#recordId");
const schoolNameInput = document.querySelector("#schoolName");
const collegeNameInput = document.querySelector("#collegeName");
const recordProvince = document.querySelector("#recordProvince");
const startDateInput = document.querySelector("#startDate");
const endDateInput = document.querySelector("#endDate");
const recordRank = document.querySelector("#recordRank");
const recordComLevel = document.querySelector("#recordComLevel");
const recordHasExam = document.querySelector("#recordHasExam");
const recordLink = document.querySelector("#recordLink");
const submitRecord = document.querySelector("#submitRecord");
const clearForm = document.querySelector("#clearForm");

const statusLabels = {
  open: "报名进行中",
  notStarted: "报名未开始",
  ended: "报名已结束",
};

const today = new Date();
const currentDayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let records = loadRecords();

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseDate(dateText) {
  return new Date(`${dateText}T00:00:00`);
}

function getStatus(record) {
  const startDate = parseDate(record.startDate);
  const endDate = parseDate(record.endDate);

  if (currentDayStart < startDate) {
    return "notStarted";
  }

  if (currentDayStart > endDate) {
    return "ended";
  }

  return "open";
}

function formatDate(dateText) {
  return dateText.replaceAll("-", ".");
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `record-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeRecord(record) {
  return {
    id: record.id ?? createId(),
    schoolName: record.schoolName,
    collegeName: record.collegeName,
    province: record.province,
    startDate: record.startDate,
    endDate: record.endDate,
    rank: record.rank,
    comLevel: record.comLevel,
    hasExam: record.hasExam,
    link: record.link,
  };
}

function loadRecords() {
  const cachedValue = window.localStorage.getItem(STORAGE_KEY);

  if (cachedValue) {
    try {
      const parsedRecords = JSON.parse(cachedValue);

      if (Array.isArray(parsedRecords) && parsedRecords.length) {
        return parsedRecords.map((record) => normalizeRecord(record));
      }
    } catch {
      // Fallback to seed data below.
    }
  }

  const initialRecords = seedRecords.map((record) => normalizeRecord(record));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRecords));
  return initialRecords;
}

function saveRecords(nextRecords) {
  records = nextRecords.map((record) => normalizeRecord(record));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function buildProvinceOptions() {
  const optionsMarkup = provinceOptions
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join("");

  provinceFilter.innerHTML = optionsMarkup;
  recordProvince.innerHTML = provinceOptions
    .filter((option) => option !== "全部")
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join("");
}

function getFilteredRecords() {
  const rank = rankFilter.value;
  const province = provinceFilter.value;

  return records
    .filter((record) => (rank === "全部" ? true : record.rank === rank))
    .filter((record) => (province === "全部" ? true : record.province === province))
    .map((record) => ({ ...record, status: getStatus(record) }))
    .sort((left, right) => {
      const statusOrder = { open: 0, notStarted: 1, ended: 2 };
      const leftScore = statusOrder[left.status];
      const rightScore = statusOrder[right.status];

      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      return parseDate(left.endDate) - parseDate(right.endDate);
    });
}

function renderHeroStats(filteredRecords) {
  const openCount = filteredRecords.filter((record) => record.status === "open").length;
  const notStartedCount = filteredRecords.filter((record) => record.status === "notStarted").length;
  const endedCount = filteredRecords.filter((record) => record.status === "ended").length;

  heroStats.innerHTML = [
    [filteredRecords.length, "筛选结果"],
    [openCount, "进行中"],
    [notStartedCount + endedCount, "非进行中"],
  ]
    .map(
      ([value, label]) => `
        <div class="stat-card">
          <span class="stat-value">${value}</span>
          <span class="stat-label">${label}</span>
        </div>
      `,
    )
    .join("");
}

function renderActiveFilters() {
  activeFilters.innerHTML = [
    `档次：${escapeHtml(rankFilter.value)}`,
    `省份：${escapeHtml(provinceFilter.value)}`,
    `数据：本地缓存`,
  ]
    .map((text) => `<span class="filter-chip">${text}</span>`)
    .join("");
}

function renderList(filteredRecords) {
  if (!filteredRecords.length) {
    resultList.innerHTML = `
      <div class="empty-state">
        没有匹配的学院信息，请调整筛选条件或新增数据。
      </div>
    `;
    return;
  }

  resultList.innerHTML = filteredRecords
    .map((record) => {
      const statusClass = `status-${record.status === "open" ? "open" : record.status === "notStarted" ? "not-started" : "ended"}`;
      const itemClass = record.status === "open"
        ? "item"
        : record.status === "notStarted"
          ? "item is-not-started"
          : "item is-ended";

      return `
        <article class="${itemClass}" data-id="${escapeHtml(record.id)}">
          <div class="item-top">
            <div class="item-copy">
              <a class="item-link" href="${escapeHtml(record.link)}" target="_blank" rel="noreferrer noopener">
                <h3 class="item-title">${escapeHtml(record.schoolName)} - ${escapeHtml(record.collegeName)}</h3>
              </a>
              <p class="item-subtitle">${escapeHtml(record.province)} · ${escapeHtml(record.rank)} · ${escapeHtml(record.comLevel)} · 机试${escapeHtml(record.hasExam)}</p>
            </div>

            <div class="item-side">
              <span class="status ${statusClass}">${statusLabels[record.status]}</span>
              <div class="item-actions">
                <button class="action-button" type="button" data-action="edit" data-id="${escapeHtml(record.id)}">编辑</button>
                <button class="action-button danger" type="button" data-action="delete" data-id="${escapeHtml(record.id)}">删除</button>
              </div>
            </div>
          </div>

          <div class="item-grid">
            <div class="meta-box">
              <span class="meta-label">报名开始</span>
              <span class="meta-value">${formatDate(record.startDate)}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">报名截止</span>
              <span class="meta-value">${formatDate(record.endDate)}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">学院链接</span>
              <span class="meta-value">点击标题查看</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function render() {
  const filteredRecords = getFilteredRecords();
  renderHeroStats(filteredRecords);
  renderActiveFilters();
  renderList(filteredRecords);
  resultMeta.textContent = `共 ${filteredRecords.length} 条记录`;
}

function resetFiltersForm() {
  rankFilter.value = "全部";
  provinceFilter.value = "全部";
  render();
}

function clearRecordForm() {
  recordId.value = "";
  recordForm.reset();
  recordProvince.value = provinceOptions[1];
  recordRank.value = "华五";
  recordComLevel.value = "强com";
  recordHasExam.value = "是";
  submitRecord.textContent = "保存条目";
}

function fillRecordForm(record) {
  recordId.value = record.id;
  schoolNameInput.value = record.schoolName;
  collegeNameInput.value = record.collegeName;
  recordProvince.value = record.province;
  startDateInput.value = record.startDate;
  endDateInput.value = record.endDate;
  recordRank.value = record.rank;
  recordComLevel.value = record.comLevel;
  recordHasExam.value = record.hasExam;
  recordLink.value = record.link;
  submitRecord.textContent = "更新条目";
  recordForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function upsertRecord(event) {
  event.preventDefault();

  if (parseDate(startDateInput.value) > parseDate(endDateInput.value)) {
    window.alert("报名开始时间不能晚于报名截止时间。");
    return;
  }

  const payload = normalizeRecord({
    id: recordId.value || createId(),
    schoolName: schoolNameInput.value.trim(),
    collegeName: collegeNameInput.value.trim(),
    province: recordProvince.value,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    rank: recordRank.value,
    comLevel: recordComLevel.value,
    hasExam: recordHasExam.value,
    link: recordLink.value.trim(),
  });

  const exists = records.some((record) => record.id === payload.id);
  const nextRecords = exists
    ? records.map((record) => (record.id === payload.id ? payload : record))
    : [payload, ...records];

  saveRecords(nextRecords);
  render();
  clearRecordForm();
}

function deleteRecordById(id) {
  const targetRecord = records.find((record) => record.id === id);

  if (!targetRecord) {
    return;
  }

  const confirmed = window.confirm(`确认删除 ${targetRecord.schoolName} - ${targetRecord.collegeName} 吗？`);

  if (!confirmed) {
    return;
  }

  saveRecords(records.filter((record) => record.id !== id));
  render();

  if (recordId.value === id) {
    clearRecordForm();
  }
}

function handleListClick(event) {
  const actionButton = event.target.closest("button[data-action]");

  if (!actionButton) {
    return;
  }

  const { action, id } = actionButton.dataset;
  const targetRecord = records.find((record) => record.id === id);

  if (!targetRecord) {
    return;
  }

  if (action === "edit") {
    fillRecordForm(targetRecord);
  }

  if (action === "delete") {
    deleteRecordById(id);
  }
}

buildProvinceOptions();
provinceFilter.value = "全部";
recordProvince.value = provinceOptions[1];

rankFilter.addEventListener("change", render);
provinceFilter.addEventListener("change", render);
resetFilters.addEventListener("click", resetFiltersForm);
recordForm.addEventListener("submit", upsertRecord);
clearForm.addEventListener("click", clearRecordForm);
resultList.addEventListener("click", handleListClick);

clearRecordForm();
render();
