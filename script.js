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
  
  const years = ['2022', '2023', '2024', '2025', '2026', '2027', '2028'];

  function getFileData(filename) {
    try {
      const dataStr = localStorage.getItem(filename.replace('.json', ''));
      return dataStr ? JSON.parse(dataStr) : [];
    } catch {
      return [];
    }
  }

  function saveToFile(filename, item) {
    const items = getFileData(filename);
    items.push(item);
    localStorage.setItem(filename.replace('.json', ''), JSON.stringify(items));
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

  function loadMemories() {
    const saved = getFileData('permanent-gallery.json');
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
        modal.innerHTML = `
          <div class="upload-modal-content">
            <span class="close-modal">&times;</span>
            <h3>Add Memory 📸</h3>
            <form id="uploadForm">
              <label>Year
                <select id="memoryYear">
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
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
          </div>
        `;
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
        saveToFile('permanent-gallery.json', item);
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

  // Stars functionality
  const addStudentTrigger = document.getElementById('addStudentTrigger');
  const studentModal = document.getElementById('studentModal');
  const closeStudentModal = document.querySelector('.close-student-modal');
  const studentForm = document.getElementById('studentForm');
  const studentNameInput = document.getElementById('studentName');
  const studentPhotoInput = document.getElementById('studentPhoto');
  const studentFileName = document.getElementById('studentFileName');
  const starsGrid = document.getElementById('starsGrid');

function getStars() {
    const raw = localStorage.getItem('classStars') || JSON.stringify([
      {"name":"Demo Star 1","photoUrl":"https://ui-avatars.com/api/?name=D1&size=256&background=6a0dad&color=fff"},
      {"name":"Demo Star 2","photoUrl":"https://ui-avatars.com/api/?name=D2&size=256&background=6a0dad&color=fff"},
      {"name":"Demo Star 3","photoUrl":"https://ui-avatars.com/api/?name=D3&size=256&background=6a0dad&color=fff"}
    ]);
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function saveStar(star) {
    let stars = getStars();
    stars.push(star);
    localStorage.setItem('classStars', JSON.stringify(stars.slice(-50)));
    loadStars();
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

  function loadStars() {
    starsGrid.innerHTML = '';
    getStars().forEach(createStarCard);
  }

  // Demo stars
  const demoStars = [
    {name: "Demo Star 1", photoUrl: "https://ui-avatars.com/api/?name=D1&size=256&background=6a0dad&color=fff"},
    {name: "Demo Star 2", photoUrl: "https://ui-avatars.com/api/?name=D2&size=256&background=6a0dad&color=fff"},
    {name: "Demo Star 3", photoUrl: "https://ui-avatars.com/api/?name=D3&size=256&background=6a0dad&color=fff"}
  ];
  demoStars.forEach(saveStar);

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
        reader.onload = (event) => {
          photoUrl = event.target.result;
          saveStar({ name, photoUrl });
          studentModal.style.display = 'none';
          studentForm.reset();
        };
        reader.readAsDataURL(studentPhotoInput.files[0]);
      } else {
        saveStar({ name, photoUrl });
        studentModal.style.display = 'none';
        studentForm.reset();
      }
    });
  }

  loadStars();
});
