window.initUbahAngle = function ({
                                   document,
                                   setupImageUpload,
                                   setupOptionButtons,
                                   updateSliderProgress,
                                   getAspectRatioClass,
                                   lucide,
                                   API_KEY,
                                   GENERATE_URL,
                                   CHAT_URL,
                                   getApiErrorMessage,
                                   doneSound,
                                   errorSound
                                 }) {
  // Angle Logic
  const caUploadBox = document.getElementById('ca-upload-box');
  const caImageInput = document.getElementById('ca-image-input');
  const caPreview = document.getElementById('ca-preview');
  const caPlaceholder = document.getElementById('ca-placeholder');
  const caRemoveBtn = document.getElementById('ca-remove-btn');
  const caGenerateBtn = document.getElementById('ca-generate-btn');
  const caResultsContainer = document.getElementById('ca-results-container');
  const caResultsGrid = document.getElementById('ca-results-grid');
  const caRotateSlider = document.getElementById('ca-rotate-slider');
  const caZoomSlider = document.getElementById('ca-zoom-slider');
  const caVerticalSlider = document.getElementById('ca-vertical-slider');
  const caRandomToggle = document.getElementById('ca-random-toggle');
  const caRatioOptions = document.getElementById('ca-ratio-options');
  const caRotateVal = document.getElementById('ca-rotate-val');
  const caZoomVal = document.getElementById('ca-zoom-val');
  const caVerticalVal = document.getElementById('ca-vertical-val');
  const caUpdateSliderVisibility = () => {
    if (!caRandomToggle) return;
    const isRandom = caRandomToggle.checked;
    const controls = [caRotateSlider, caZoomSlider, caVerticalSlider];
    controls.forEach(el => {
      if (el) {
        el.disabled = isRandom;
        el.parentElement.style.opacity = isRandom ? '0.5' : '1';
      }
    });
  };
  if (caRandomToggle) {
    caRandomToggle.addEventListener('change', caUpdateSliderVisibility);
    caRandomToggle.checked = true;
    caUpdateSliderVisibility();
  }
  if (caRatioOptions) setupOptionButtons(caRatioOptions);
  const parseRatioValue = (value) => {
    if (!value) return 1;
    const normalized = value.toString().toLowerCase().replace(/\s/g, '');
    const separator = normalized.includes(':') ? ':' : (normalized.includes('x') ? 'x' : null);
    if (!separator) return 1;
    const parts = normalized.split(separator);
    if (parts.length !== 2) return 1;
    const width = Number(parts[0]);
    const height = Number(parts[1]);
    if (!width || !height) return 1;
    return width / height;
  };
  const selectClosestRatioByImage = (dataUrl) => {
    if (!caRatioOptions || !dataUrl) return;
    const buttons = Array.from(caRatioOptions.querySelectorAll('button'));
    if (!buttons.length) return;
    const img = new Image();
    img.onload = () => {
      const imageRatio = img.naturalWidth / img.naturalHeight;
      let closestButton = buttons[0];
      let closestDiff = Math.abs(imageRatio - parseRatioValue(closestButton.dataset.value));
      buttons.forEach((button) => {
        const diff = Math.abs(imageRatio - parseRatioValue(button.dataset.value));
        if (diff < closestDiff) {
          closestDiff = diff;
          closestButton = button;
        }
      });
      buttons.forEach(button => button.classList.remove('selected'));
      closestButton.classList.add('selected');
    };
    img.src = dataUrl;
  };

  async function getAngleConcepts(imageData) {
    const formData = new FormData();
    formData.append('prompt', `You are a professional photographer. Analyze the image. Generate 4 DISTINCT and CREATIVE camera angle concepts to re-shoot this exact subject. Examples: "Extreme Low Angle", "High Angle Bird's Eye", "Dutch Tilt", "Over the Shoulder", "Wide Angle Close Up". For each, provide a specific English prompt describing the angle while maintaining the subject's identity. Respond ONLY with a valid JSON array of 4 strings (the prompts).`);
    const byteCharacters = atob(imageData.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: imageData.mimeType});
    formData.append('images[]', blob, 'image.jpg');
    const response = await fetch(`${CHAT_URL}`, {
      method: 'POST',
      headers: {'X-API-Key': API_KEY},
      body: formData
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response));
    const result = await response.json();
    if (!result.success || !result.response) {
      throw new Error("Respon tidak valid dari AI.");
    }
    let jsonStr = result.response.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error("Respon AI tidak berbentuk array.");
    }
    return parsed;
  }

  let caImageData = null;

  function caUpdateButtons() {
    if (caGenerateBtn) caGenerateBtn.disabled = !caImageData;
  }

  if (caImageInput && caUploadBox) {
    setupImageUpload(caImageInput, caUploadBox, (data) => {
      caImageData = data;
      if (caPreview) caPreview.src = data.dataUrl;
      if (caPlaceholder) caPlaceholder.classList.add('hidden');
      if (caPreview) caPreview.classList.remove('hidden');
      if (caRemoveBtn) caRemoveBtn.classList.remove('hidden');
      caUpdateButtons();
      selectClosestRatioByImage(data.dataUrl);
    });
  }
  if (caRemoveBtn) {
    caRemoveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      caImageData = null;
      if (caImageInput) caImageInput.value = '';
      if (caPreview) {
        caPreview.src = '#';
        caPreview.classList.add('hidden');
      }
      if (caPlaceholder) caPlaceholder.classList.remove('hidden');
      if (caRemoveBtn) caRemoveBtn.classList.add('hidden');
      caUpdateButtons();
      const placeholder = document.getElementById('ca-results-placeholder');
      if (placeholder) placeholder.classList.remove('hidden');
      if (caResultsContainer) caResultsContainer.classList.add('hidden');
      if (caResultsGrid) caResultsGrid.innerHTML = '';
    });
  }
  if (caRotateSlider && caRotateVal) caRotateSlider.addEventListener('input', () => {
    caRotateVal.textContent = caRotateSlider.value;
    updateSliderProgress(caRotateSlider);
  });
  if (caZoomSlider && caZoomVal) caZoomSlider.addEventListener('input', () => {
    caZoomVal.textContent = caZoomSlider.value;
    updateSliderProgress(caZoomSlider);
  });
  if (caVerticalSlider && caVerticalVal) caVerticalSlider.addEventListener('input', () => {
    caVerticalVal.textContent = caVerticalSlider.value;
    updateSliderProgress(caVerticalSlider);
  });
  if (caRotateSlider) updateSliderProgress(caRotateSlider);
  if (caZoomSlider) updateSliderProgress(caZoomSlider);
  if (caVerticalSlider) updateSliderProgress(caVerticalSlider);
  if (caGenerateBtn) {
    caGenerateBtn.addEventListener('click', async () => {
      const originalBtnHTML = caGenerateBtn.innerHTML;
      caGenerateBtn.disabled = true;
      caGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">${caRandomToggle && caRandomToggle.checked ? 'Menganalisa Gambar...' : 'Mengatur Sudut...'}</span>`;
      const placeholder = document.getElementById('ca-results-placeholder');
      if (placeholder) placeholder.classList.add('hidden');
      if (caResultsContainer) caResultsContainer.classList.remove('hidden');
      if (caResultsGrid) {
        caResultsGrid.className = `grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6`;
        caResultsGrid.innerHTML = '';
        let selectedAspectRatio = '1:1';
        if (caRatioOptions) {
          const selectedRatio = caRatioOptions.querySelector('.selected');
          if (selectedRatio && selectedRatio.dataset.value) {
            selectedAspectRatio = selectedRatio.dataset.value;
          }
        }
        const loadingAspectClass = getAspectRatioClass(selectedAspectRatio);
        for (let i = 1; i <= 4; i++) {
          const card = document.createElement('div');
          card.id = `ca-card-${i}`;
          card.className = `card overflow-hidden transition-all ${loadingAspectClass} bg-gray-100 flex flex-col items-center justify-center p-4`;
          card.innerHTML = `
                            <div class="loader-icon w-10 h-10 mb-2"></div>
                            <p class="text-xs text-gray-500 font-medium text-center">AI sedang menyusun angle...</p>
                        `;
          caResultsGrid.appendChild(card);
        }
      }
      if (lucide) lucide.createIcons();
      try {
        let prompts = [];
        if (caRandomToggle && caRandomToggle.checked) {
          const concepts = await getAngleConcepts(caImageData);
          prompts = concepts;
        } else {
          const rotate = caRotateSlider ? caRotateSlider.value : 0;
          const zoom = caZoomSlider ? caZoomSlider.value : 0;
          const vertical = caVerticalSlider ? caVerticalSlider.value : 0;
          const basePrompt = `Analyze the uploaded image first. Identify the subject, pose, clothing, and background details. Then, generate a photorealistic image recreating this EXACT subject and scene, but strictly apply this specific camera angle: Pan/Rotation ${rotate} degrees, Zoom Level ${zoom} (0-10 scale), Vertical Tilt Level ${vertical} (-1 down to 1 up). Maintain subject identity perfectly.`;
          prompts = Array(4).fill(basePrompt);
        }
        const generationPromises = prompts.map((prompt, i) => generateAngleImage(i + 1, prompt));
        await Promise.allSettled(generationPromises);
      } catch (error) {
        console.error("Error preparing prompts:", error);
        if (caResultsGrid) caResultsGrid.innerHTML = `<div class="col-span-full text-center text-red-500 p-4">Gagal menganalisa gambar: ${error.message}</div>`;
      } finally {
        caGenerateBtn.disabled = false;
        caGenerateBtn.innerHTML = originalBtnHTML;
        if (lucide) lucide.createIcons();
      }
    });
  }

  async function generateAngleImage(id, specificPrompt) {
    const card = document.getElementById(`ca-card-${id}`);
    try {
      let aspectRatio = '1:1';
      if (caRatioOptions) {
        const selectedRatio = caRatioOptions.querySelector('.selected');
        if (selectedRatio && selectedRatio.dataset.value) {
          aspectRatio = selectedRatio.dataset.value;
        }
      }
      const finalPrompt = `${specificPrompt} This is variation ${id}. Ensure high quality and photorealism. The final image MUST have an aspect ratio of ${aspectRatio}.`;
      const base64ToBlob = (base64, mimeType) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], {type: mimeType});
      };
      const formData = new FormData();
      formData.append('images[]', base64ToBlob(caImageData.base64, caImageData.mimeType));
      formData.append('instruction', finalPrompt);
      formData.append('aspectRatio', aspectRatio);
      const response = await fetch(`${GENERATE_URL}`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY
        },
        body: formData
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      const result = await response.json();
      if (result.success && result.imageUrl) {
        const imageUrl = result.imageUrl;
        card.innerHTML = `
                        <img src="${imageUrl}" class="w-full h-full object-cover rounded-lg">
                        <div class="absolute bottom-2 right-2 flex gap-1">
                            <button data-img-src="${imageUrl}" class="view-btn result-action-btn" title="Lihat Gambar">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                            <a href="${imageUrl}" download="angle_change_${id}.png" class="result-action-btn download-btn" title="Unduh Gambar">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </a>
                        </div>`;
        card.className = `card relative w-full overflow-hidden group ${getAspectRatioClass(aspectRatio)}`;
        doneSound.play();
      } else {
        throw new Error("Respon tidak valid dari API.");
      }
    } catch (error) {
      errorSound.play();
      console.error(`Error for angle card ${id}:`, error);
      card.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message}</div>`;
    } finally {
      if (lucide) lucide.createIcons();
    }
  }
};
