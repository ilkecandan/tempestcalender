// DOM Elements
const appSection = document.getElementById('appSection');
const weekDisplay = document.getElementById('weekDisplay');
const weekTable = document.getElementById('weekTable');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const todayBtn = document.getElementById('todayBtn');
const printBtn = document.getElementById('printBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const installBtn = document.getElementById('installBtn');
const emptyState = document.getElementById('emptyState');
const addSampleContentBtn = document.getElementById('addSampleContentBtn');
const contentModal = document.getElementById('contentModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const contentForm = document.getElementById('contentForm');
const contentTitle = document.getElementById('contentTitle');
const contentDate = document.getElementById('contentDate');
const contentStartTime = document.getElementById('contentStartTime');
const contentPlatform = document.getElementById('contentPlatform');
const contentType = document.getElementById('contentType');
const contentAudience = document.getElementById('contentAudience');
const contentFormat = document.getElementById('contentFormat');
const contentStatus = document.getElementById('contentStatus');
const contentDescription = document.getElementById('contentDescription');
const contentCaption = document.getElementById('contentCaption');
const contentLink = document.getElementById('contentLink');
const contentUpload = document.getElementById('contentUpload');
const cancelBtn = document.getElementById('cancelBtn');
const deleteBtn = document.getElementById('deleteBtn');
const toast = document.getElementById('toast');

// App State
let currentDate = new Date();
let contentItems = [];
let editingContentId = null;
let deferredPrompt = null;

// Time slots for the table
const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
];

// Initialize App
function initApp() {
  loadContent();
  setupEventListeners();
  setupPWA();
  appSection.style.display = 'block';
  renderWeekView();
}

// Event Listeners
function setupEventListeners() {
  prevWeekBtn.addEventListener('click', () => changeWeek(-1));
  nextWeekBtn.addEventListener('click', () => changeWeek(1));
  todayBtn.addEventListener('click', goToToday);
  printBtn.addEventListener('click', handlePrint);
  exportPdfBtn.addEventListener('click', exportAsPdf);
  installBtn.addEventListener('click', installPWA);
  addSampleContentBtn.addEventListener('click', addSampleContent);
  closeModal.addEventListener('click', closeContentModal);
  cancelBtn.addEventListener('click', closeContentModal);
  contentForm.addEventListener('submit', saveContent);
  deleteBtn.addEventListener('click', deleteContent);
  contentUpload.addEventListener('change', handleFileUpload);
  contentModal.addEventListener('click', (e) => {
    if (e.target === contentModal) closeContentModal();
  });
}

// Render Calendar
function renderWeekView() {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  weekDisplay.textContent = `Week of ${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  weekTable.innerHTML = '';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th>Time</th>';

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDay = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const th = document.createElement('th');
    th.innerHTML = `<div>${daysOfWeek[i]}</div><div>${formatShortDate(currentDay)}</div>`;
    headerRow.appendChild(th);
    currentDay.setDate(currentDay.getDate() + 1);
  }

  thead.appendChild(headerRow);
  weekTable.appendChild(thead);

  const tbody = document.createElement('tbody');
  let hasContent = false;

  timeSlots.forEach(time => {
    const row = document.createElement('tr');
    const timeCell = document.createElement('td');
    timeCell.className = 'time-slot';
    timeCell.textContent = time;
    row.appendChild(timeCell);

    const dayDate = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const cell = document.createElement('td');
      cell.className = 'content-cell';
      cell.dataset.date = formatDateForData(dayDate);
      cell.dataset.time = time;

      const dateStr = formatDateForData(dayDate);
      const content = contentItems.filter(item => item.date === dateStr && item.time === time);

      if (content.length > 0) {
        hasContent = true;
        content.forEach(item => {
          const contentEl = createContentElement(item);
          cell.appendChild(contentEl);
        });
      }

      const addBtn = document.createElement('button');
      addBtn.className = 'add-content-btn';
      addBtn.innerHTML = '+';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        openContentModal(dayDate, time);
      };

      cell.appendChild(addBtn);
      cell.onclick = () => openContentModal(dayDate, time);
      row.appendChild(cell);
      dayDate.setDate(dayDate.getDate() + 1);
    }

    tbody.appendChild(row);
  });

  weekTable.appendChild(tbody);
  emptyState.style.display = hasContent ? 'none' : 'flex';
}

// Load & Save
function loadContent() {
  try {
    const data = localStorage.getItem('contentCalendarData');
    contentItems = data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading content:', e);
    contentItems = [];
  }
}

function saveContentToStorage() {
  try {
    localStorage.setItem('contentCalendarData', JSON.stringify(contentItems));
  } catch (e) {
    console.error('Error saving content:', e);
  }
}

// Content Modal
function openContentModal(date, time) {
  editingContentId = null;
  modalTitle.textContent = 'Add Content';
  deleteBtn.style.display = 'none';
  contentForm.reset();
  contentDate.value = formatDateForInput(date);
  contentStartTime.value = convertTo24Hour(time);
  contentModal.style.display = 'flex';
}

function openEditContentModal(contentId) {
  const content = contentItems.find(item => item.id === contentId);
  if (!content) return;

  editingContentId = contentId;
  modalTitle.textContent = 'Edit Content';
  deleteBtn.style.display = 'block';

  contentTitle.value = content.title;
  contentDate.value = content.date;
  contentStartTime.value = content.time;
  contentPlatform.value = content.platform;
  contentType.value = content.type;
  contentAudience.value = content.audience;
  contentFormat.value = content.format || 'Post';
  contentStatus.value = content.status || 'Draft';
  contentDescription.value = content.description || '';
  contentCaption.value = content.caption || '';
  contentLink.value = content.link || '';

  contentModal.style.display = 'flex';
}

function closeContentModal() {
  contentModal.style.display = 'none';
}

function saveContent(e) {
  e.preventDefault();

  if (!contentTitle.value || !contentDate.value || !contentStartTime.value) {
    showToast('Please fill in all required fields');
    return;
  }

  const content = {
    id: editingContentId || Date.now(),
    title: contentTitle.value,
    date: contentDate.value,
    time: contentStartTime.value,
    platform: contentPlatform.value,
    type: contentType.value,
    audience: contentAudience.value,
    format: contentFormat.value,
    status: contentStatus.value,
    description: contentDescription.value,
    caption: contentCaption.value,
    link: contentLink.value,
    createdAt: new Date().toISOString()
  };

  if (editingContentId) {
    contentItems = contentItems.map(item => item.id === editingContentId ? content : item);
  } else {
    contentItems.push(content);
  }

  saveContentToStorage();
  renderWeekView();
  closeContentModal();
  showToast('Content saved');
}

function deleteContent() {
  if (!editingContentId) return;

  if (confirm('Are you sure you want to delete this content?')) {
    contentItems = contentItems.filter(item => item.id !== editingContentId);
    saveContentToStorage();
    renderWeekView();
    closeContentModal();
    showToast('Content deleted');
  }
}

// Other Features
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  showToast(`File "${file.name}" uploaded successfully`);
  contentUpload.value = '';
}

function changeWeek(direction) {
  currentDate.setDate(currentDate.getDate() + direction * 7);
  renderWeekView();
}

function goToToday() {
  currentDate = new Date();
  renderWeekView();
}

function addSampleContent() {
  const platforms = ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'YouTube'];
  const types = ['Image Post', 'Video', 'Carousel', 'Story', 'Article'];
  const audiences = ['Awareness', 'Consideration', 'Decision', 'Retention'];

  for (let i = 0; i < 8; i++) {
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 14));

    contentItems.push({
      id: Date.now() + i,
      title: `Sample Content ${i + 1}`,
      date: formatDateForData(randomDate),
      time: timeSlots[Math.floor(Math.random() * timeSlots.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      type: types[Math.floor(Math.random() * types.length)],
      audience: audiences[Math.floor(Math.random() * audiences.length)],
      description: 'Sample content for demonstration.',
      caption: 'This is a sample caption.'
    });
  }

  saveContentToStorage();
  renderWeekView();
  showToast('Sample content added');
}

// Install PWA
function setupPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
  });
}

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choiceResult => {
    if (choiceResult.outcome === 'accepted') {
      installBtn.style.display = 'none';
    }
    deferredPrompt = null;
  });
}

// Utility Functions
function handlePrint() {
  window.print();
}

function exportAsPdf() {
  showToast('PDF export is preparing...');
}

function showToast(message) {
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatShortDate(date) {
  return formatDate(date);
}

function formatDateForData(date) {
  return date.toISOString().split('T')[0];
}

function formatDateForInput(date) {
  return formatDateForData(date);
}

function convertTo24Hour(time12h) {
  if (!time12h.includes(' ')) return time12h;
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
  return `${hours}:${minutes}`;
}

function createContentElement(item) {
  const contentEl = document.createElement('div');
  contentEl.className = 'content-item';
  contentEl.dataset.id = item.id;
  contentEl.innerHTML = `
    <div class="content-title">${item.title}</div>
    <div class="content-meta">
      <span class="content-tag"><i class="fas fa-${getPlatformIcon(item.platform)}"></i> ${item.platform}</span>
      <span class="content-tag">${item.type}</span>
      <span class="content-tag">${item.audience}</span>
    </div>
  `;
  contentEl.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditContentModal(item.id);
  });
  return contentEl;
}

function getPlatformIcon(platform) {
  const icons = {
    Instagram: 'camera',
    Facebook: 'facebook',
    Twitter: 'twitter',
    LinkedIn: 'linkedin',
    YouTube: 'youtube',
    Pinterest: 'pinterest',
    Blog: 'blog',
    Email: 'envelope'
  };
  return icons[platform] || 'globe';
}

// Initialize
window.addEventListener('DOMContentLoaded', initApp);
