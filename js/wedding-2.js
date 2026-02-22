window.initWedding2 = function ({
                                  document,
                                  setupImageUpload,
                                  setupOptionButtons,
                                  getAspectRatioClass,
                                  lucide,
                                  API_KEY,
                                  GENERATE_URL,
                                  getApiErrorMessage,
                                  doneSound,
                                  errorSound,
                                  base64ToBlob,
                                  showContentModal,
                                  hideAndClearModal
                                }) {
  // --- Elements ---
  const manInput = document.getElementById('w2-man-input');
  const manUploadBox = document.getElementById('w2-man-upload-box');
  const manPreview = document.getElementById('w2-man-preview');
  const manPlaceholder = document.getElementById('w2-man-placeholder');
  const removeManBtn = document.getElementById('w2-remove-man-btn');
  const womanInput = document.getElementById('w2-woman-input');
  const womanUploadBox = document.getElementById('w2-woman-upload-box');
  const womanPreview = document.getElementById('w2-woman-preview');
  const womanPlaceholder = document.getElementById('w2-woman-placeholder');
  const removeWomanBtn = document.getElementById('w2-remove-woman-btn');
  const cameraSelect = document.getElementById('w2-camera-select');
  const clothingSelect = document.getElementById('w2-clothing-select');
  const clothingCustomContainer = document.getElementById('w2-clothing-custom-container');
  const clothingText = document.getElementById('w2-clothing-text');
  // Clothing Man
  const clothingManImageInput = document.getElementById('w2-clothing-man-image-input');
  const clothingManPreviewContainer = document.getElementById('w2-clothing-man-preview-container');
  const clothingManPreview = document.getElementById('w2-clothing-man-preview');
  const removeClothingManBtn = document.getElementById('w2-remove-clothing-man');
  // Clothing Woman
  const clothingWomanImageInput = document.getElementById('w2-clothing-woman-image-input');
  const clothingWomanPreviewContainer = document.getElementById('w2-clothing-woman-preview-container');
  const clothingWomanPreview = document.getElementById('w2-clothing-woman-preview');
  const removeClothingWomanBtn = document.getElementById('w2-remove-clothing-woman');
  const locationSelect = document.getElementById('w2-location-select');
  const locationCustomContainer = document.getElementById('w2-location-custom-container');
  const locationText = document.getElementById('w2-location-text');
  const locationImageInput = document.getElementById('w2-location-image-input');
  const locationImagePreviewContainer = document.getElementById('w2-location-image-preview-container');
  const locationImagePreview = document.getElementById('w2-location-image-preview');
  const removeLocationImageBtn = document.getElementById('w2-remove-location-image');
  const wmTypeTextBtn = document.getElementById('w2-wm-type-text');
  const wmTypeLogoBtn = document.getElementById('w2-wm-type-logo');
  const watermarkText = document.getElementById('w2-watermark-text');
  const watermarkLogoContainer = document.getElementById('w2-watermark-logo-container');
  const logoInput = document.getElementById('w2-logo-input');
  const logoPreviewContainer = document.getElementById('w2-logo-preview-container');
  const logoPreview = document.getElementById('w2-logo-preview');
  const removeLogoBtn = document.getElementById('w2-remove-logo');
  const ratioOptions = document.getElementById('w2-ratio-options');
  const additionalPrompt = document.getElementById('w2-additional-prompt');
  const resultSlider = document.getElementById('w2-result-slider');
  const sliderValue = document.getElementById('w2-slider-value');
  const generateBtn = document.getElementById('w2-generate-btn');
  const resultsContainer = document.getElementById('w2-results-container');
  const resultsGrid = document.getElementById('w2-results-grid');
  const resultsPlaceholder = document.getElementById('w2-results-placeholder');
  // --- State ---
  let manData = null;
  let womanData = null;
  let clothingManRefData = null;
  let clothingWomanRefData = null;
  let locationRefData = null;
  let logoData = null;
  let watermarkType = 'text'; // 'text' or 'logo'
  // --- Helpers ---
  function updateGenerateButton() {
    if (manData && womanData) {
      generateBtn.disabled = false;
      generateBtn.classList.remove('bg-slate-200', 'text-slate-400', 'cursor-not-allowed');
      generateBtn.classList.add('bg-gradient-to-r', 'from-teal-500', 'to-emerald-500', 'text-white', 'hover:from-teal-600', 'hover:to-emerald-600', 'cursor-pointer');
    } else {
      generateBtn.disabled = true;
      generateBtn.classList.add('bg-slate-200', 'text-slate-400', 'cursor-not-allowed');
      generateBtn.classList.remove('bg-gradient-to-r', 'from-teal-500', 'to-emerald-500', 'text-white', 'hover:from-teal-600', 'hover:to-emerald-600', 'cursor-pointer');
    }
  }

  // --- Event Listeners: Man Photo ---
  setupImageUpload(manInput, manUploadBox, (data) => {
    manData = data;
    manPreview.src = data.dataUrl;
    manPreview.classList.remove('hidden');
    manPlaceholder.classList.add('hidden');
    removeManBtn.classList.remove('hidden');
    updateGenerateButton();
  });
  removeManBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    manData = null;
    manInput.value = '';
    manPreview.src = '';
    manPreview.classList.add('hidden');
    manPlaceholder.classList.remove('hidden');
    removeManBtn.classList.add('hidden');
    updateGenerateButton();
  });
  // --- Event Listeners: Woman Photo ---
  setupImageUpload(womanInput, womanUploadBox, (data) => {
    womanData = data;
    womanPreview.src = data.dataUrl;
    womanPreview.classList.remove('hidden');
    womanPlaceholder.classList.add('hidden');
    removeWomanBtn.classList.remove('hidden');
    updateGenerateButton();
  });
  removeWomanBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    womanData = null;
    womanInput.value = '';
    womanPreview.src = '';
    womanPreview.classList.add('hidden');
    womanPlaceholder.classList.remove('hidden');
    removeWomanBtn.classList.add('hidden');
    updateGenerateButton();
  });
  // --- Event Listeners: Clothing ---
  clothingSelect.addEventListener('change', () => {
    if (clothingSelect.value === 'custom') {
      clothingCustomContainer.classList.remove('hidden');
    } else {
      clothingCustomContainer.classList.add('hidden');
    }
  });
  // Clothing Man
  setupImageUpload(clothingManImageInput, null, (data) => {
    clothingManRefData = data;
    clothingManPreview.src = data.dataUrl;
    clothingManPreviewContainer.classList.remove('hidden');
  });
  removeClothingManBtn.addEventListener('click', () => {
    clothingManRefData = null;
    clothingManImageInput.value = '';
    clothingManPreview.src = '';
    clothingManPreviewContainer.classList.add('hidden');
  });
  // Clothing Woman
  setupImageUpload(clothingWomanImageInput, null, (data) => {
    clothingWomanRefData = data;
    clothingWomanPreview.src = data.dataUrl;
    clothingWomanPreviewContainer.classList.remove('hidden');
  });
  removeClothingWomanBtn.addEventListener('click', () => {
    clothingWomanRefData = null;
    clothingWomanImageInput.value = '';
    clothingWomanPreview.src = '';
    clothingWomanPreviewContainer.classList.add('hidden');
  });
  // --- Event Listeners: Location ---
  locationSelect.addEventListener('change', () => {
    if (locationSelect.value === 'custom') {
      locationCustomContainer.classList.remove('hidden');
    } else {
      locationCustomContainer.classList.add('hidden');
    }
  });
  setupImageUpload(locationImageInput, null, (data) => {
    locationRefData = data;
    locationImagePreview.src = data.dataUrl;
    locationImagePreviewContainer.classList.remove('hidden');
  });
  removeLocationImageBtn.addEventListener('click', () => {
    locationRefData = null;
    locationImageInput.value = '';
    locationImagePreview.src = '';
    locationImagePreviewContainer.classList.add('hidden');
  });
  // --- Event Listeners: Watermark ---
  wmTypeTextBtn.addEventListener('click', () => {
    watermarkType = 'text';
    wmTypeTextBtn.classList.add('active-option', 'bg-slate-100', 'border-teal-500');
    wmTypeLogoBtn.classList.remove('active-option', 'bg-slate-100', 'border-teal-500');
    watermarkText.classList.remove('hidden');
    watermarkLogoContainer.classList.add('hidden');
  });
  wmTypeLogoBtn.addEventListener('click', () => {
    watermarkType = 'logo';
    wmTypeLogoBtn.classList.add('active-option', 'bg-slate-100', 'border-teal-500');
    wmTypeTextBtn.classList.remove('active-option', 'bg-slate-100', 'border-teal-500');
    watermarkText.classList.add('hidden');
    watermarkLogoContainer.classList.remove('hidden');
  });
  setupImageUpload(logoInput, null, (data) => {
    logoData = data;
    logoPreview.src = data.dataUrl;
    logoPreviewContainer.classList.remove('hidden');
  });
  removeLogoBtn.addEventListener('click', () => {
    logoData = null;
    logoInput.value = '';
    logoPreview.src = '';
    logoPreviewContainer.classList.add('hidden');
  });
  // --- Event Listeners: Ratio ---
  setupOptionButtons(ratioOptions);
  // --- Event Listeners: Slider ---
  resultSlider.addEventListener('input', () => {
    sliderValue.textContent = `${resultSlider.value} Gambar`;
  });
  // --- Generate ---
  generateBtn.addEventListener('click', async () => {
    if (!manData || !womanData) return;
    const originalBtnText = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = `<div class="loader-icon w-5 h-5 animate-spin"></div><span>Sedang Memproses...</span>`;
    generateBtn.classList.add('opacity-75');
    resultsContainer.classList.add('hidden');
    resultsGrid.innerHTML = '';
    resultsPlaceholder.classList.remove('hidden');
    try {
      const selectedRatioBtn = ratioOptions.querySelector('.selected');
      const ratio = selectedRatioBtn ? selectedRatioBtn.dataset.ratio : '9:16';
      const outputCount = Math.max(1, parseInt(resultSlider.value, 10) || 1);
      const baseStyle = clothingSelect.value === 'custom' ? (clothingText.value || 'Custom') : clothingSelect.value;
      const baseLocation = locationSelect.value === 'custom' ? (locationText.value || 'Custom') : locationSelect.value;
      const aspectClass = getAspectRatioClass(ratio);
      resultsPlaceholder.classList.add('hidden');
      resultsContainer.classList.remove('hidden');
      resultsGrid.innerHTML = '';
      for (let i = 1; i <= outputCount; i++) {
        const card = document.createElement('div');
        card.id = `w2-card-${i}`;
        card.className = `relative group rounded-2xl overflow-hidden border border-slate-100 shadow-md bg-slate-50 flex flex-col items-center justify-center ${aspectClass}`;
        card.innerHTML = `
                    <div class="loader-icon w-8 h-8 rounded-full mb-2"></div>
                    <p class="text-xs text-slate-500 font-medium animate-pulse" id="w2-status-${i}">Menyiapkan...</p>
                `;
        resultsGrid.appendChild(card);
      }
      if (lucide) lucide.createIcons();
      const modeEndpoint = String(window.MODE_ENDPOINT || 'BACKEND').toUpperCase();
      const useFrontendEndpoint = modeEndpoint === 'FRONTEND' || modeEndpoint === 'FRONTED';
      const rawBaseUrl = window.BASE_URL || '';
      const baseUrls = rawBaseUrl.split(',').map(u => u.trim()).filter(Boolean);
      const randomBase = baseUrls.length > 0 ? baseUrls[Math.floor(Math.random() * baseUrls.length)] : rawBaseUrl;
      const baseUrlClean = randomBase.replace(/\/$/, '');
      const endpoint = useFrontendEndpoint ? `${baseUrlClean}/nanobananapro` : '/server/proxy.php/nanobananapro';
      const apiHeaders = API_KEY ? {'X-API-Key': API_KEY} : {};
      if (useFrontendEndpoint && typeof ensureFrontendToken === 'function') {
        const token = await ensureFrontendToken(baseUrlClean);
        if (token) {
          apiHeaders['X-Authorization'] = `Bearer ${token}`;
        }
        apiHeaders['X-Server'] = MONITOR_URL;
      }
      const buildInstruction = (variation) => {
        let prompt = `Create a photorealistic wedding photograph. You are given two source images containing the faces of the couple to be depicted.
CRITICAL RULE: You MUST use the exact faces from the source images. Preserve their facial identity, structure, and likeness perfectly. Do NOT generate new or different faces.
Place this couple in the following scene:
- Scene Description: A romantic pose together.
- Camera Shot: ${cameraSelect.value}.
- Location: ${baseLocation}.
- Style & Attire: ${baseStyle}. The couple's clothing should match this theme.
- Quality: High-resolution, sharp, and flawlessly blended.`;
        if (watermarkType === 'text' && watermarkText.value.trim()) {
          prompt += `\n- Watermark: Add the text "${watermarkText.value.trim()}" subtly and elegantly in a corner.`;
        }
        if (additionalPrompt.value.trim()) {
          prompt += `\n- Additional Instruction: ${additionalPrompt.value.trim()}`;
        }
        if (clothingManRefData) {
          prompt += `\n- Reference Image: One of the provided images is for the Man's clothing style. Use it as a reference for the groom's attire.`;
        }
        if (clothingWomanRefData) {
          prompt += `\n- Reference Image: One of the provided images is for the Woman's clothing style. Use it as a reference for the bride's attire.`;
        }
        if (locationRefData) {
          prompt += `\n- Reference Image: The next image provided is for location reference ONLY. Do NOT copy faces from it.`;
        }
        if (watermarkType === 'logo' && logoData) {
          prompt += `\n- Reference Image: The last image provided is the logo for the watermark. Place it subtly in a corner.`;
        }
        prompt += `\nThis is variation ${variation}.`;
        return prompt;
      };
      const createFormData = (instruction) => {
        const formData = new FormData();
        if (base64ToBlob) {
          formData.append('images[]', base64ToBlob(manData.base64, manData.mimeType));
          formData.append('images[]', base64ToBlob(womanData.base64, womanData.mimeType));
          if (clothingManRefData) formData.append('images[]', base64ToBlob(clothingManRefData.base64, clothingManRefData.mimeType));
          if (clothingWomanRefData) formData.append('images[]', base64ToBlob(clothingWomanRefData.base64, clothingWomanRefData.mimeType));
          if (locationRefData) formData.append('images[]', base64ToBlob(locationRefData.base64, locationRefData.mimeType));
          if (watermarkType === 'logo' && logoData) {
            formData.append('images[]', base64ToBlob(logoData.base64, logoData.mimeType));
          }
        } else {
          formData.append('images[]', manData.dataUrl);
          formData.append('images[]', womanData.dataUrl);
          if (clothingManRefData) formData.append('images[]', clothingManRefData.dataUrl);
          if (clothingWomanRefData) formData.append('images[]', clothingWomanRefData.dataUrl);
          if (locationRefData) formData.append('images[]', locationRefData.dataUrl);
          if (watermarkType === 'logo' && logoData) {
            formData.append('images[]', logoData.dataUrl);
          }
        }
        formData.append('instruction', instruction);
        if (ratio) formData.append('aspectRatio', ratio);
        return formData;
      };
      const extractImageUrl = (result) => {
        if (Array.isArray(result) && result[0]) return result[0];
        if (result?.imageUrl) return result.imageUrl;
        if (result?.images?.[0]) return result.images[0];
        if (result?.output?.[0]) return result.output[0];
        if (result?.image) return result.image;
        return null;
      };
      const generateSingleWeddingImage = async (id) => {
        const card = document.getElementById(`w2-card-${id}`);
        const statusEl = document.getElementById(`w2-status-${id}`);
        try {
          if (statusEl) statusEl.textContent = "Mengunggah...";
          const instruction = buildInstruction(id);
          const formData = createFormData(instruction);
          if (statusEl) statusEl.textContent = "Memproses AI...";
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: apiHeaders,
            body: formData
          });
          if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
          }
          if (statusEl) statusEl.textContent = "Mengunduh Hasil...";
          const contentType = response.headers.get('content-type') || '';
          let result;
          if (contentType.includes('application/json')) {
            result = await response.json();
          } else {
            const rawText = await response.text();
            try {
              result = rawText ? JSON.parse(rawText) : {};
            } catch (error) {
              throw new Error('Respon server tidak valid.');
            }
          }
          const imgUrl = extractImageUrl(result);
          if (!imgUrl) {
            throw new Error("Tidak ada gambar yang dihasilkan.");
          }
          card.innerHTML = `
                        <img src="${imgUrl}" class="w-full h-full object-cover cursor-pointer view-btn" data-img-src="${imgUrl}" alt="Wedding Result ${id}">
                        <div class="absolute bottom-2 right-2 flex gap-2">
                            <button class="view-btn shadow-md bg-white text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all" data-img-src="${imgUrl}" title="Lihat">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                            <a href="${imgUrl}" download="wedding-ai-${Date.now()}-${id}.png" class="download-btn shadow-md bg-white text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all" title="Unduh">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </a>
                        </div>
                    `;
        } catch (error) {
          console.error(error);
          card.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message || 'Gagal membuat gambar.'}</div>`;
        } finally {
          if (lucide) lucide.createIcons();
        }
      };
      const generationPromises = Array.from({length: outputCount}, (_, index) => generateSingleWeddingImage(index + 1));
      await Promise.allSettled(generationPromises);
      if (doneSound) doneSound.play();
    } catch (error) {
      console.error(error);
      if (errorSound) errorSound.play();
      alert(error.message || "Terjadi kesalahan saat generate.");
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnText;
      generateBtn.classList.remove('opacity-75');
    }
  });
  // Initial check
  updateGenerateButton();
};
