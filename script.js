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
  const fileInput = document.getElementById('photoFile');
  const captionInput = document.getElementById('photoCaption');
  const yearSelect = document.getElementById('memoryYear');
  const fileName = document.getElementById('photoFileName');
  const memoryFolders = document.getElementById('memoryFolders');
  
  const years = ['First Sem', 'Second Sem', 'Third Sem', 'Fourth Sem', 'Fifth Sem', 'Sixth Sem', 'Seventh Sem', 'Eighth Sem'];
  const canUseFetch = ['http:', 'https:'].includes(window.location.protocol);
  const landingScreen = document.getElementById('landingScreen');
  const enterWebsiteBtn = document.getElementById('enterWebsiteBtn');

  if (enterWebsiteBtn && landingScreen) {
    enterWebsiteBtn.addEventListener('click', () => {
      landingScreen.classList.add('landing-hidden');
      setTimeout(() => {
        landingScreen.style.display = 'none';
      }, 500);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  const canUseIndexedDB = 'indexedDB' in window;
  const DB_NAME = 'ClassMemoriesDB';
  const DB_VERSION = 2;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!canUseIndexedDB) return reject(new Error('IndexedDB not supported'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('memories')) {
          db.createObjectStore('memories', { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('stars')) {
          db.createObjectStore('stars', { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllFromStore(storeName) {
    if (!canUseIndexedDB) return [];
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result || []);
        db.close();
      };
      request.onerror = () => {
        reject(request.error);
        db.close();
      };
    });
  }

  async function saveNote(note) {
    try {
      await addToStore('notes', note);
    } catch (e) {
      console.warn('Save note failed:', e);
    }
  }

  async function deleteNote(id) {
    if (!canUseIndexedDB) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('notes', 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);
      request.onsuccess = () => {
        resolve();
        db.close();
      };
      request.onerror = () => {
        reject(request.error);
        db.close();
      };
    });
  }

  async function addToStore(storeName, item) {
    if (!canUseIndexedDB) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);
      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };
      request.onerror = () => {
        reject(request.error);
        db.close();
      };
    });
  }

  async function clearStore(storeName) {
    if (!canUseIndexedDB) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => {
        resolve();
        db.close();
      };
      request.onerror = () => {
        reject(request.error);
        db.close();
      };
    });
  }

  async function getMemories() {
    try {
      const stored = await getAllFromStore('memories');
      if (stored.length) {
        return stored;
      }
    } catch (e) {
      console.warn('IndexedDB memories read failed:', e);
    }

    if (canUseFetch) {
      try {
        const response = await fetch('permanent-gallery.json');
        if (!response.ok) throw new Error('Fetch failed');
        const dataStr = await response.text();
        const memories = JSON.parse(dataStr);
        await clearStore('memories');
        for (const item of memories) {
          await addToStore('memories', item);
        }
        return memories;
      } catch (e) {
        console.warn('Fetch memories failed:', e);
      }
    }

    return [];
  }

  async function saveMemory(item) {
    try {
      await addToStore('memories', item);
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

    const handleFullscreen = (element) => {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    };

    if (item.type === 'photo') {
      const img = document.createElement('img');
      img.src = item.dataUrl;
      img.alt = item.caption;
      img.className = 'memory-photo';
      img.title = item.caption;
      img.addEventListener('click', () => handleFullscreen(img));
      target.appendChild(img);
    } else {
      const video = document.createElement('video');
      video.src = item.dataUrl;
      video.controls = true;
      video.className = 'memory-video';
      video.addEventListener('click', () => handleFullscreen(video));
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

  // Stars functionality
  const addStudentTrigger = document.getElementById('addStudentTrigger');
  const studentModal = document.getElementById('studentModal');
  const closeStudentModal = document.querySelector('.close-student-modal');
  const studentForm = document.getElementById('studentForm');
  const studentNameInput = document.getElementById('studentName');
  const studentPhotoInput = document.getElementById('studentPhoto');
  const studentFileName = document.getElementById('studentFileName');
  const starsGrid = document.getElementById('starsGrid');
  const noteModal = document.getElementById('noteModal');
  const closeNoteModal = document.querySelector('.close-note-modal');
  const noteForm = document.getElementById('noteForm');
  const noteRecipientLabel = document.getElementById('noteRecipient');
  const noteText = document.getElementById('noteText');
  const adminAccessLink = document.getElementById('adminAccessLink');
  const adminModal = document.getElementById('adminModal');
  const closeAdminModal = document.querySelector('.close-admin-modal');
  const adminNotesList = document.getElementById('adminNotesList');
  let activeNoteRecipient = null;

async function getStars() {
    try {
      const stored = await getAllFromStore('stars');
      if (stored.length) {
        return stored;
      }
    } catch (e) {
      console.warn('IndexedDB stars read failed:', e);
    }

    if (canUseFetch) {
      try {
        const response = await fetch('students.json');
        if (!response.ok) throw new Error('Fetch failed');
        const dataStr = await response.text();
        const stars = JSON.parse(dataStr);
        await clearStore('stars');
        for (const item of stars) {
          await addToStore('stars', item);
        }
        return stars;
      } catch (e) {
        console.warn('Fetch students failed:', e);
      }
    }

    return [];
  }

async function saveStar(star) {
    try {
      await addToStore('stars', star);
      await loadStars();
    } catch(e) {
      console.warn('Save failed:', e);
    }
  }

  function createStarCard(star, noteCount = 0) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
      <img src="${star.photoUrl}" alt="${star.name}" class="student-img">
      <h3 class="student-name">${star.name}</h3>
      <div class="student-meta">
        <span class="note-count">${noteCount} anonymous note${noteCount === 1 ? '' : 's'}</span>
        <button type="button" class="note-button" data-recipient="${star.name}">✉️ Leave anonymous note</button>
      </div>
    `;
    starsGrid.appendChild(card);
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

async function loadStars() {
    starsGrid.innerHTML = '';
    const stars = await getStars();
    const notes = await getAllFromStore('notes');
    const noteCounts = notes.reduce((acc, note) => {
      acc[note.recipient] = (acc[note.recipient] || 0) + 1;
      return acc;
    }, {});
    shuffleArray(stars).forEach(star => createStarCard(star, noteCounts[star.name] || 0));
  }

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

  // Student card and note button click handling
  starsGrid.addEventListener('click', (e) => {
    const noteBtn = e.target.closest('.note-button');
    if (noteBtn) {
      e.preventDefault();
      activeNoteRecipient = noteBtn.getAttribute('data-recipient');
      if (noteRecipientLabel) {
        noteRecipientLabel.textContent = `To: ${activeNoteRecipient}`;
      }
      if (noteModal) {
        noteText.value = '';
        noteModal.style.display = 'flex';
      }
      return;
    }

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

  if (noteForm) {
    noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const noteTextValue = noteText.value.trim();
      if (!noteTextValue || !activeNoteRecipient) return;
      await saveNote({ recipient: activeNoteRecipient, text: noteTextValue, createdAt: new Date().toISOString() });
      noteModal.style.display = 'none';
      activeNoteRecipient = null;
      if (noteForm) noteForm.reset();
      await loadStars();
    });
  }

  if (closeNoteModal) {
    closeNoteModal.addEventListener('click', () => {
      if (noteModal) noteModal.style.display = 'none';
    });
  }

  if (noteModal) {
    noteModal.addEventListener('click', (e) => {
      if (e.target === noteModal) noteModal.style.display = 'none';
    });
  }

  async function renderAdminNotes() {
    if (!adminNotesList) return;
    const notes = await getAllFromStore('notes');
    adminNotesList.innerHTML = notes.length ? notes.map(note => `
      <div class="admin-note-item">
        <div><strong>${note.recipient}</strong> • ${new Date(note.createdAt).toLocaleString()}</div>
        <p>${note.text}</p>
        <button class="delete-note-btn" data-id="${note.id}">Delete</button>
      </div>
    `).join('') : '<p>No anonymous notes yet.</p>';
  }

  if (adminNotesList) {
    adminNotesList.addEventListener('click', async (e) => {
      const button = e.target.closest('.delete-note-btn');
      if (!button) return;
      const id = Number(button.getAttribute('data-id'));
      if (!Number.isFinite(id)) return;
      await deleteNote(id);
      await renderAdminNotes();
      await loadStars();
    });
  }

  async function requestAdminAccess() {
    const passcode = prompt('Enter admin passcode to manage anonymous notes:');
    if (passcode === 'krishna') {
      if (adminModal) adminModal.style.display = 'flex';
      await renderAdminNotes();
    } else if (passcode !== null) {
      alert('Passcode incorrect.');
    }
  }

  if (adminAccessLink) {
    adminAccessLink.addEventListener('click', (e) => {
      e.preventDefault();
      requestAdminAccess();
    });
  }

  if (closeAdminModal) {
    closeAdminModal.addEventListener('click', () => {
      if (adminModal) adminModal.style.display = 'none';
    });
  }

  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) adminModal.style.display = 'none';
    });
  }

  loadStars();
});
