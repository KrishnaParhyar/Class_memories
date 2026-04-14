document.addEventListener('DOMContentLoaded', function () {
  // Smooth scrolling for nav links
  document.querySelectorAll('.nav-menu a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  // Memories functionality
  const memoriesUploadBtn = document.querySelector('#memoriesUploadBtn');
  const uploadModal = document.getElementById('uploadModal');
  const closeModal = document.querySelector('.close-modal');
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('photoFile');
  const captionInput = document.getElementById('photoCaption');
  const yearSelect = document.getElementById('memoryYear');
  const typeSelect = document.getElementById('memoryType');
  const fileName = document.getElementById('photoFileName');
  const memoryFolders = document.getElementById('memoryFolders');
  
const years = ['2022', '2023', '2024', '2025', '2026'];

  async function getMemories() {
    try {
      const response = await fetch('permanent-gallery.json');
      const dataStr = await response.text();
      return JSON.parse(dataStr);
    } catch {
      try {
        const localData = localStorage.getItem('permanent-gallery');
        return localData ? JSON.parse(localData) : [];
      } catch {
        return [];
      }
    }
  }

  async function downloadMemories() {
    const memories = await getMemories();
    const dataStr = JSON.stringify(memories, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `permanent-gallery-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveMemory(item) {
    try {
      let memories = await getMemories();
      memories.push(item);
      localStorage.setItem('permanent-gallery', JSON.stringify(memories));
      await downloadMemories();
    } catch(e) {
      console.warn('Save failed:', e);
    }
  }

  function createYearFolders() {
    memoryFolders.innerHTML = '';
    years.forEach((year) => {
      const yearFolder = document.createElement('div');
      yearFolder.className = 'year-folder';
      yearFolder.innerHTML = `
        <div class="year-folder-header">
          <h3>${year}</h3>
        </div>
        <div class="year-folders-row">
          <div class="folder-block">
            <h4>Photos</h4>
            <div class="year-media-grid" data-year="${year}" data-type="photo"></div>
          </div>
          <div class="folder-block">
            <h4>Videos</h4>
            <div class="year-media-grid" data-year="${year}" data-type="video"></div>
          </div>
        </div>
      `;
      memoryFolders.appendChild(yearFolder);
    });
  }

  function createMemoryItem(item) {
    const target = document.querySelector(`.year-media-grid[data-year="${item.year}"][data-type="${item.type}"]`);
    if (!target) return;

    if (item.type === 'photo') {
      const img = document.createElement('img');
      img.src = item.dataUrl;
      img.alt = item.caption;
      img.className = 'memory-photo';
      img.title = item.caption;
      target.appendChild(img);
    } else {
      const video = document.createElement('video');
      video.src = item.dataUrl;
      video.controls = true;
      video.className = 'memory-video';
      target.appendChild(video);
    }
  }

  async function loadMemories() {
    const saved = await getMemories();
    saved.forEach(createMemoryItem);
  }

  // Memories upload modal
  if (memoriesUploadBtn) {
    memoriesUploadBtn.addEventListener('click', () => {
      let modal = document.getElementById('uploadModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'uploadModal';
        modal.className = 'upload-modal';
        let html = `
          <div class="upload-modal-content">
            <span class="close-modal">&times;</span>
            <h3>Add Memory 📸</h3>
            <form id="uploadForm">
              <label>Year
                <select id="memoryYear">`;
        for(let y of years) {
          html += `<option value="${y}">${y}</option>`;
        }
        html += `
                </select>
              </label>
              <label>Caption
                <input type="text" id="photoCaption" placeholder="Add caption" required>
              </label>
              <label>Photo/Video
                <input type="file" id="photoFile" accept="image/*,video/*" required>
                <small id="photoFileName">Choose file</small>
              </label>
              <button type="submit" class="submit-btn">Save Memory</button>
            </form>
          </div>`;
        modal.innerHTML = html;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
    });
  }


  // Upload form handling
  document.addEventListener('change', (e) => {
    if (e.target.id === 'photoFile') {
      document.getElementById('photoFileName').textContent = e.target.files[0]?.name || 'Choose file';
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'uploadForm') {
      e.preventDefault();
      const file = fileInput.files[0];
      const caption = captionInput.value.trim();
      const year = yearSelect.value;
      const type = file.type.startsWith('video') ? 'video' : 'photo';

      if (!file || !caption) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        const item = { year, type, caption, dataUrl: event.target.result };
        createMemoryItem(item);
        saveMemory(item);
        uploadModal.style.display = 'none';
        e.target.reset();
      };
      reader.readAsDataURL(file);
    }
  });

  // Close modals
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('upload-modal') || e.target.classList.contains('close-modal')) {
      uploadModal.style.display = 'none';
    }
  });

  createYearFolders();
  loadMemories();

  // Memories download button
  const memoriesDownloadBtn = document.createElement('button');
  memoriesDownloadBtn.textContent = 'Download Memories (Permanent Save)';
  memoriesDownloadBtn.onclick = downloadMemories;
  memoriesDownloadBtn.className = 'download-btn';
  memoryFolders.parentNode.insertBefore(memoriesDownloadBtn, memoryFolders);

  // Stars functionality
  const addStudentTrigger = document.getElementById('addStudentTrigger');
  const studentModal = document.getElementById('studentModal');
  const closeStudentModal = document.querySelector('.close-student-modal');
  const studentForm = document.getElementById('studentForm');
  const studentNameInput = document.getElementById('studentName');
  const studentPhotoInput = document.getElementById('studentPhoto');
  const studentFileName = document.getElementById('studentFileName');
  const starsGrid = document.getElementById('starsGrid');

async function loadDemoIfNeeded() {
    try {
      const demoText = await (await fetch('stars-demo.json')).text();
      const demo = JSON.parse(demoText);
      try {
        let stars = JSON.parse(localStorage.getItem('classStars') || '[]');
        localStorage.setItem('classStars', JSON.stringify([...new Set([...demo, ...stars])].slice(-50)));
      } catch(quota) {
        console.warn('Quota full, skipping demo merge');
      }
    } catch(e) {
      console.warn('Demo load failed', e);
    }
  }

async function getStars() {
    try {
      const localData = localStorage.getItem('students');
      if (localData) return JSON.parse(localData);
      const response = await fetch('students.json');
      const dataStr = await response.text();
      return JSON.parse(dataStr);
    } catch {
      return [];
    }
  }

// Removed duplicate loadDemoIfNeeded function

async function saveStar(star) {
    try {
      let stars = await getStars();  // Always load fresh from file first
      stars.push(star);
      // Don't use localStorage - rely on file persistence only
      await downloadStudents();  // Auto-save to permanent students.json
      await loadStars();
    } catch(e) {
      console.warn('Save failed:', e);
    }
  }

async function downloadStudents() {
    const stars = await getStars();
    const dataStr = JSON.stringify(stars, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

async function downloadStars() {
    const stars = JSON.parse(localStorage.getItem('classStars') || '[]');
    const dataStr = JSON.stringify(stars, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class-stars-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function createStarCard(star) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
      <img src="${star.photoUrl}" alt="${star.name}" class="student-img">
      <h3 class="student-name">${star.name}</h3>
    `;
    starsGrid.appendChild(card);
  }

async function loadStars() {
    starsGrid.innerHTML = '';
    const stars = await getStars();
    stars.forEach(createStarCard);
  }

// Permanent storage: Download button added for students.json export
  // Click download to save permanent copy. LocalStorage syncs with it.
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download Students (Permanent Save)';
  downloadBtn.onclick = downloadStudents;
  downloadBtn.className = 'download-btn';
  starsGrid.parentNode.insertBefore(downloadBtn, starsGrid);

  if (addStudentTrigger) {
    addStudentTrigger.addEventListener('click', () => {
      studentModal.style.display = 'flex';
    });
  }

  if (closeStudentModal) {
    closeStudentModal.addEventListener('click', () => {
      studentModal.style.display = 'none';
    });
  }

  if (studentModal) {
    studentModal.addEventListener('click', (e) => {
      if (e.target === studentModal) studentModal.style.display = 'none';
    });
  }

  if (studentPhotoInput) {
    studentPhotoInput.addEventListener('change', () => {
      studentFileName.textContent = studentPhotoInput.files[0]?.name || 'Auto-avatar used';
    });
  }

  if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = studentNameInput.value.trim();
      let photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=6a0dad&color=fff`;

      if (studentPhotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          photoUrl = event.target.result;
          await saveStar({ name, photoUrl });
          studentModal.style.display = 'none';
          studentForm.reset();
        };
        reader.readAsDataURL(studentPhotoInput.files[0]);
      } else {
        saveStar({ name, photoUrl }).then(() => {
          studentModal.style.display = 'none';
          studentForm.reset();
        });
      }
    });
  }

  // Student card click for full image
  starsGrid.addEventListener('click', (e) => {
    if (e.target.closest('.student-card')) {
      const card = e.target.closest('.student-card');
      const img = card.querySelector('.student-img');
      const name = card.querySelector('.student-name')?.textContent || '';
      
      let lightbox = document.getElementById('imageLightbox');
      if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'imageLightbox';
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
          <span class="lightbox-close">&times;</span>
          <div class="lightbox-content">
            <img id="lightboxImg" src="" alt="">
            <h3 id="lightboxName"></h3>
          </div>
        `;
        document.body.appendChild(lightbox);
      }
      
      document.getElementById('lightboxImg').src = img.src;
      document.getElementById('lightboxName').textContent = name;
      lightbox.style.display = 'flex';
    }
  });

  // Lightbox close handlers
  document.addEventListener('click', (e) => {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox && (e.target === lightbox || e.target.classList.contains('lightbox-close'))) {
      lightbox.style.display = 'none';
    }
  });

  loadStars();
});
