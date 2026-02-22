window.initEditFoto = function (ctx) {
  const {
    document,
    setupOptionButtons,
    getApiKey,
    GENERATE_URL,
    getApiErrorMessage,
    lucide
  } = ctx;
  const emUploadArea = document.getElementById('em-upload-area');
  const emPlaceholder = document.getElementById('em-placeholder');
  const emCanvasContainer = document.getElementById('em-canvas-container');
  const emImageCanvas = document.getElementById('em-image-canvas');
  const emMaskCanvas = document.getElementById('em-mask-canvas');
  const emUploadInput = document.getElementById('em-upload-input');
  const emRemoveBtn = document.getElementById('em-remove-btn');
  const emToolbar = document.getElementById('em-toolbar');
  const emBrushSize = document.getElementById('em-brush-size');
  const emUndoBtn = document.getElementById('em-undo-btn');
  const emRedoBtn = document.getElementById('em-redo-btn');
  const emResetBtn = document.getElementById('em-reset-btn');
  const emRatioOptions = document.getElementById('em-ratio-options');
  const emInstruction = document.getElementById('em-instruction');
  const emGenerateBtn = document.getElementById('em-generate-btn');
  const emResultContainer = document.getElementById('em-result-container');
  const emResultActions = document.getElementById('em-result-actions');
  const emDownloadBtn = document.getElementById('em-download-btn');
  const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
  if (!emUploadArea || !emPlaceholder || !emCanvasContainer || !emImageCanvas || !emMaskCanvas || !emUploadInput || !emRemoveBtn || !emToolbar || !emBrushSize || !emUndoBtn || !emRedoBtn || !emResetBtn || !emRatioOptions || !emInstruction || !emGenerateBtn || !emResultContainer || !emResultActions || !emDownloadBtn) {
    return null;
  }
  setupOptionButtons(emRatioOptions);
  const imageCtx = emImageCanvas.getContext('2d');
  const maskCtx = emMaskCanvas.getContext('2d');
  let emImageData = null;
  let emImageElement = null;
  let isDrawing = false;
  let lastPoint = null;
  let hasMask = false;
  let maskHistory = [];
  let maskRedoStack = [];

  function emSetUploadState(hasImage) {
    if (hasImage) {
      emPlaceholder.classList.add('hidden');
      emCanvasContainer.classList.remove('hidden');
      emToolbar.classList.remove('hidden');
      emRemoveBtn.classList.remove('hidden');
    } else {
      emPlaceholder.classList.remove('hidden');
      emCanvasContainer.classList.add('hidden');
      emToolbar.classList.add('hidden');
      emRemoveBtn.classList.add('hidden');
    }
  }

  function emResetResults() {
    emResultContainer.innerHTML = '<p class="text-xs text-slate-400 text-center px-8">Hasil edit magic akan muncul di sini.</p>';
    emResultActions.classList.add('hidden');
    emDownloadBtn.setAttribute('href', '#');
  }

  function emClearMask() {
    if (!emMaskCanvas.width || !emMaskCanvas.height) return;
    maskCtx.clearRect(0, 0, emMaskCanvas.width, emMaskCanvas.height);
    const blank = maskCtx.getImageData(0, 0, emMaskCanvas.width, emMaskCanvas.height);
    maskHistory = [blank];
    maskRedoStack = [];
    hasMask = false;
  }

  function emInitHistory() {
    if (!emMaskCanvas.width || !emMaskCanvas.height) return;
    const snapshot = maskCtx.getImageData(0, 0, emMaskCanvas.width, emMaskCanvas.height);
    maskHistory = [snapshot];
    maskRedoStack = [];
    hasMask = false;
  }

  function emHasMaskPixels(imageData) {
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return true;
    }
    return false;
  }

  function emPushHistory() {
    if (!emMaskCanvas.width || !emMaskCanvas.height) return;
    const snapshot = maskCtx.getImageData(0, 0, emMaskCanvas.width, emMaskCanvas.height);
    maskHistory.push(snapshot);
    if (maskHistory.length > 30) maskHistory.shift();
    maskRedoStack = [];
    hasMask = true;
  }

  function emUndoMask() {
    if (maskHistory.length <= 1) return;
    const current = maskHistory.pop();
    if (current) maskRedoStack.push(current);
    const previous = maskHistory[maskHistory.length - 1];
    if (previous) {
      maskCtx.putImageData(previous, 0, 0);
      hasMask = emHasMaskPixels(previous);
    }
  }

  function emRedoMask() {
    if (maskRedoStack.length === 0) return;
    const next = maskRedoStack.pop();
    if (!next) return;
    maskHistory.push(next);
    maskCtx.putImageData(next, 0, 0);
    hasMask = emHasMaskPixels(next);
  }

  function emGetPointerPos(e) {
    const rect = emMaskCanvas.getBoundingClientRect();
    const isTouch = !!e.touches && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * emMaskCanvas.width,
      y: ((clientY - rect.top) / rect.height) * emMaskCanvas.height
    };
  }

  function emStartDrawing(e) {
    if (!emImageData) return;
    if (e.cancelable) e.preventDefault();
    isDrawing = true;
    lastPoint = emGetPointerPos(e);
    maskCtx.lineWidth = Number(emBrushSize.value || 30);
    maskCtx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.beginPath();
    maskCtx.moveTo(lastPoint.x, lastPoint.y);
  }

  function emDraw(e) {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const point = emGetPointerPos(e);
    maskCtx.lineTo(point.x, point.y);
    maskCtx.stroke();
    lastPoint = point;
  }

  function emEndDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    maskCtx.closePath();
    emPushHistory();
  }

  function emResizeCanvasForImage(img) {
    const rect = emUploadArea.getBoundingClientRect();
    const maxW = rect.width;
    const maxH = rect.height;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const displayWidth = Math.max(1, Math.round(img.naturalWidth * scale));
    const displayHeight = Math.max(1, Math.round(img.naturalHeight * scale));
    emImageCanvas.width = displayWidth;
    emImageCanvas.height = displayHeight;
    emMaskCanvas.width = displayWidth;
    emMaskCanvas.height = displayHeight;
    emImageCanvas.style.width = `${displayWidth}px`;
    emImageCanvas.style.height = `${displayHeight}px`;
    emMaskCanvas.style.width = `${displayWidth}px`;
    emMaskCanvas.style.height = `${displayHeight}px`;
  }

  function emRenderImage() {
    if (!emImageElement) return;
    imageCtx.clearRect(0, 0, emImageCanvas.width, emImageCanvas.height);
    imageCtx.drawImage(emImageElement, 0, 0, emImageCanvas.width, emImageCanvas.height);
  }

  function emSetImageData(dataUrl, mimeType, base64) {
    emImageData = {dataUrl, mimeType, base64};
    emImageElement = new Image();
    emImageElement.onload = () => {
      emResizeCanvasForImage(emImageElement);
      emRenderImage();
      emClearMask();
      emSelectNearestRatio(emImageElement.naturalWidth || emImageElement.width, emImageElement.naturalHeight || emImageElement.height);
      emSetUploadState(true);
    };
    emImageElement.src = dataUrl;
  }

  function emResetAll() {
    emImageData = null;
    emImageElement = null;
    emUploadInput.value = '';
    emSetUploadState(false);
    imageCtx.clearRect(0, 0, emImageCanvas.width, emImageCanvas.height);
    maskCtx.clearRect(0, 0, emMaskCanvas.width, emMaskCanvas.height);
    emResetResults();
  }

  function emGetSelectedRatio() {
    const selected = emRatioOptions.querySelector('.option-btn.selected');
    if (selected && selected.dataset.value) return selected.dataset.value;
    const first = emRatioOptions.querySelector('.option-btn');
    return first?.dataset?.value || '1:1';
  }

  function emSetSelectedRatio(value) {
    const buttons = Array.from(emRatioOptions.querySelectorAll('.option-btn'));
    if (!buttons.length) return;
    buttons.forEach((btn) => btn.classList.remove('selected'));
    const match = buttons.find((btn) => btn.dataset.value === value);
    (match || buttons[0]).classList.add('selected');
  }

  function emSelectNearestRatio(width, height) {
    if (!width || !height) return;
    const target = width / height;
    let bestValue = '1:1';
    let bestDiff = Number.POSITIVE_INFINITY;
    emRatioOptions.querySelectorAll('.option-btn').forEach((btn) => {
      const value = btn.dataset.value || '1:1';
      const parts = value.split(':').map(Number);
      if (parts.length !== 2 || !parts[0] || !parts[1]) return;
      const ratio = parts[0] / parts[1];
      const diff = Math.abs(ratio - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestValue = value;
      }
    });
    emSetSelectedRatio(bestValue);
  }

  const EM_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
  const EM_TARGET_BYTES = 14.5 * 1024 * 1024;

  function emCanvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Gagal membuat gambar kompresi.'));
          return;
        }
        resolve(blob);
      }, type, quality);
    });
  }

  function emDrawComposite(canvas, width, height) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(emImageElement, 0, 0, width, height);
    if (emMaskCanvas.width && emMaskCanvas.height) {
      ctx.drawImage(emMaskCanvas, 0, 0, width, height);
    }
  }

  async function emCreateCompositeBlob() {
    if (!emImageElement) return null;
    let scale = 1;
    let quality = 0.92;
    let attempts = 0;
    let mimeType = 'image/jpeg';
    let blob = null;
    while (attempts < 8) {
      const width = Math.max(1, Math.round(emImageElement.naturalWidth * scale));
      const height = Math.max(1, Math.round(emImageElement.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      emDrawComposite(canvas, width, height);
      blob = await emCanvasToBlob(canvas, mimeType, quality);
      if (blob.size <= EM_MAX_UPLOAD_BYTES) return blob;
      const shrinkBy = Math.sqrt(EM_TARGET_BYTES / blob.size);
      if (shrinkBy < 1) {
        scale = Math.max(0.2, scale * shrinkBy * 0.98);
      } else {
        quality = Math.max(0.7, quality - 0.08);
      }
      attempts += 1;
    }
    if (blob && blob.size <= EM_MAX_UPLOAD_BYTES) return blob;
    throw new Error('Ukuran gambar terlalu besar, coba gunakan gambar lebih kecil.');
  }

  async function emGenerate() {
    if (!emImageData || !emImageElement) {
      alert('Unggah foto dulu ya!');
      return;
    }
    const instruction = emInstruction.value.trim();
    if (!instruction) {
      alert('Masukkan instruksi edit dulu!');
      return;
    }
    const aspectRatio = emGetSelectedRatio();
    const ratioInstr = aspectRatio ? ` Ubah rasio aspek gambar menjadi ${aspectRatio}.` : '';
    const finalPrompt = hasMask
      ? `Di gambar ini, area yang ditandai dengan warna merah transparan adalah area target. Ubah HANYA area merah tersebut menjadi: ${instruction}. Pertahankan sisa gambar lainnya agar tetap sama.${ratioInstr}`
      : `${instruction}.${ratioInstr}`;
    const originalBtnHTML = emGenerateBtn.innerHTML;
    emGenerateBtn.disabled = true;
    emGenerateBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i><span>Memproses...</span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    try {
      const imageBlob = await emCreateCompositeBlob();
      const formData = new FormData();
      formData.append('images', imageBlob, 'edit-foto.png');
      formData.append('instruction', finalPrompt);
      formData.append('aspectRatio', aspectRatio);
      const response = await fetch(`${GENERATE_URL}`, {
        method: 'POST',
        headers: {
          'X-API-Key': getApiKey()
        },
        body: formData
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      const result = await response.json();
      let imageUrl = result.imageUrl;
      if (!imageUrl && Array.isArray(result.images) && result.images.length > 0) {
        imageUrl = result.images[0];
      }
      if (!imageUrl) throw new Error('Respon API tidak valid (tidak ada data gambar).');
      emResultContainer.innerHTML = `
                <img src="${imageUrl}" alt="Hasil Edit" class="w-full h-full object-contain">
            `;
      emResultActions.classList.remove('hidden');
      emDownloadBtn.setAttribute('href', imageUrl);
      emDownloadBtn.setAttribute('download', 'edit_foto.png');
      if (typeof lucide !== 'undefined') lucide.createIcons();
      if (window.innerWidth < 1024) {
        emResultContainer.scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    } catch (error) {
      emResultContainer.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message}</div>`;
      emResultActions.classList.add('hidden');
    } finally {
      emGenerateBtn.disabled = false;
      emGenerateBtn.innerHTML = originalBtnHTML;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  emUploadArea.addEventListener('click', () => {
    if (!emImageData) emUploadInput.click();
  });
  emUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      if (window.showUploadLimitPopup) window.showUploadLimitPopup();
      emUploadInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : file.type || 'image/png';
      const base64 = parts[1];
      emSetImageData(dataUrl, mimeType, base64);
    };
    reader.readAsDataURL(file);
  });
  emUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    emUploadArea.classList.add('border-teal-500', 'bg-teal-50');
  });
  emUploadArea.addEventListener('dragleave', () => {
    emUploadArea.classList.remove('border-teal-500', 'bg-teal-50');
  });
  emUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    emUploadArea.classList.remove('border-teal-500', 'bg-teal-50');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      if (window.showUploadLimitPopup) window.showUploadLimitPopup();
      emUploadInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : file.type || 'image/png';
      const base64 = parts[1];
      emSetImageData(dataUrl, mimeType, base64);
    };
    reader.readAsDataURL(file);
  });
  emRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emResetAll();
  });
  emMaskCanvas.addEventListener('mousedown', emStartDrawing);
  emMaskCanvas.addEventListener('mousemove', emDraw);
  window.addEventListener('mouseup', emEndDrawing);
  emMaskCanvas.addEventListener('touchstart', emStartDrawing, {passive: false});
  emMaskCanvas.addEventListener('touchmove', emDraw, {passive: false});
  window.addEventListener('touchend', emEndDrawing);
  emUndoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    emUndoMask();
  });
  emRedoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    emRedoMask();
  });
  emResetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    emClearMask();
  });
  emGenerateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    emGenerate();
  });
  emResetAll();
  return {
    reset: emResetAll,
    setImage: emSetImageData,
    clearMask: emClearMask
  };
};
