import { provinceOptions, schoolRecords } from "./data.js";

const rankFilter = document.querySelector("#rankFilter");
const provinceFilter = document.querySelector("#provinceFilter");
const resetFilters = document.querySelector("#resetFilters");
const resultList = document.querySelector("#resultList");
const resultMeta = document.querySelector("#resultMeta");
const activeFilters = document.querySelector("#activeFilters");
const heroStats = document.querySelector("#heroStats");

const statusLabels = {
  open: "报名进行中",
  notStarted: "报名未开始",
  ended: "报名已结束",
};

const today = new Date();
const currentDayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

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

function buildProvinceOptions() {
  provinceFilter.innerHTML = provinceOptions
    .map((option) => `<option value="${option}">${option}</option>`)
    .join("");
}

function getFilteredRecords() {
  const rank = rankFilter.value;
  const province = provinceFilter.value;

  return schoolRecords
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

function renderHeroStats(records) {
  const openCount = records.filter((record) => record.status === "open").length;
  const notStartedCount = records.filter((record) => record.status === "notStarted").length;
  const endedCount = records.filter((record) => record.status === "ended").length;

  heroStats.innerHTML = [
    [records.length, "筛选结果"],
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
  const chips = [
    `档次：${rankFilter.value}`,
    `省份：${provinceFilter.value}`,
  ]
    .map((text) => `<span class="filter-chip">${text}</span>`)
    .join("");

  activeFilters.innerHTML = chips;
}

function renderList(records) {
  if (!records.length) {
    resultList.innerHTML = `
      <div class="empty-state">
        没有匹配的学院信息，请调整筛选条件。
      </div>
    `;
    return;
  }

  resultList.innerHTML = records
    .map((record) => {
      const statusClass = `status-${record.status === "open" ? "open" : record.status === "notStarted" ? "not-started" : "ended"}`;
      const itemClass = record.status === "open"
        ? "item"
        : record.status === "notStarted"
          ? "item is-not-started"
          : "item is-ended";

      return `
        <article class="${itemClass}">
          <a class="item-link" href="${record.link}" target="_blank" rel="noreferrer noopener">
            <div class="item-top">
              <div>
                <h3 class="item-title">${record.schoolName} - ${record.collegeName}</h3>
                <p class="item-subtitle">${record.province} · ${record.rank} · ${record.comLevel} · 机试${record.hasExam}</p>
              </div>
              <span class="status ${statusClass}">${statusLabels[record.status]}</span>
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
                <span class="meta-value">点击查看</span>
              </div>
            </div>
          </a>
        </article>
      `;
    })
    .join("");
}

function render() {
  const records = getFilteredRecords();
  renderHeroStats(records);
  renderActiveFilters();
  renderList(records);
  resultMeta.textContent = `共 ${records.length} 条记录`;
}

function resetForm() {
  rankFilter.value = "全部";
  provinceFilter.value = "全部";
  render();
}

buildProvinceOptions();
provinceFilter.value = "全部";

rankFilter.addEventListener("change", render);
provinceFilter.addEventListener("change", render);
resetFilters.addEventListener("click", resetForm);

render();
