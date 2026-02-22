window.initFotoProduk = function (ctx = {}) {
  const {
    document,
    setupImageUpload,
    setupOptionButtons,
    getAspectRatioClass,
    lucide,
    getApiKey,
    GENERATE_URL,
    getApiErrorMessage,
    doneSound,
    errorSound,
    showContentModal,
    hideModal,
    applyLogoToImage,
    getLogoData
  } = ctx;
  const psImageInput = document.getElementById('ps-image-input');
  const psUploadBox = document.getElementById('ps-upload-box');
  const psPreview = document.getElementById('ps-preview');
  const psPlaceholder = document.getElementById('ps-placeholder');
  const psRemoveBtn = document.getElementById('ps-remove-btn');
  const psLightingOptions = document.getElementById('ps-lighting-options');
  const psMoodOptions = document.getElementById('ps-mood-options');
  const psRatioOptions = document.getElementById('ps-ratio-options');
  const psLocationContainer = document.getElementById('ps-location-container');
  const psLocationOptions = document.getElementById('ps-location-options');
  const psBoosterToggle = document.getElementById('ps-booster-toggle');
  const psGenerateBtn = document.getElementById('ps-generate-btn');
  const psGenerateBtnText = document.getElementById('ps-generate-btn-text');
  const psResultsContainer = document.getElementById('ps-results-container');
  const psResultsTitle = document.getElementById('ps-results-title');
  const psResultsGrid = document.getElementById('ps-results-grid');
  if (!psImageInput || !psGenerateBtn) {
    return;
  }
  let psImageData = null;
  setupOptionButtons(psLightingOptions);
  setupOptionButtons(psMoodOptions);
  setupOptionButtons(psRatioOptions);
  setupOptionButtons(psLocationOptions);
  if (psMoodOptions && psLocationContainer) {
    psMoodOptions.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button && button.dataset.value === 'crowd') {
        psLocationContainer.classList.remove('hidden');
      } else {
        psLocationContainer.classList.add('hidden');
      }
    });
  }

  function updateBoosterUIState() {
    if (!psBoosterToggle || !psGenerateBtnText) return;
    const isBoosterOn = psBoosterToggle.checked;
    const elementsToToggle = [psLightingOptions, psMoodOptions, psLocationContainer];
    elementsToToggle.forEach(el => {
      if (!el) return;
      el.classList.toggle('opacity-50', isBoosterOn);
      el.classList.toggle('pointer-events-none', isBoosterOn);
      el.querySelectorAll('button').forEach(btn => {
        btn.disabled = isBoosterOn;
      });
    });
    psGenerateBtnText.textContent = isBoosterOn ? "Buat 10 Variasi Kreatif" : "Buat 4 Variasi";
  }

  if (psBoosterToggle) {
    psBoosterToggle.addEventListener('change', updateBoosterUIState);
    updateBoosterUIState();
  }

  function psUpdateButtons() {
    psGenerateBtn.disabled = !psImageData;
  }

  setupImageUpload(psImageInput, psUploadBox, (data) => {
    psImageData = data;
    psPreview.src = data.dataUrl;
    psPlaceholder.classList.add('hidden');
    psPreview.classList.remove('hidden');
    psRemoveBtn.classList.remove('hidden');
    psUpdateButtons();
    if (psImageData) {
      psGenerateBtn.disabled = false;
      psGenerateBtn.removeAttribute('disabled');
    }
  });
  psRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    psImageData = null;
    psImageInput.value = '';
    psPreview.src = '#';
    psPreview.classList.add('hidden');
    psPlaceholder.classList.remove('hidden');
    psRemoveBtn.classList.add('hidden');
    psUpdateButtons();
    document.getElementById('ps-results-placeholder').classList.remove('hidden');
    psResultsContainer.classList.add('hidden');
    psResultsGrid.innerHTML = '';
  });
  psGenerateBtn.addEventListener('click', () => {
    if (psBoosterToggle && psBoosterToggle.checked) {
      generateBoosterPhotoshoot();
    } else {
      generateStandardPhotoshoot();
    }
  });

  async function generateProductOnlyImage(effect, aspectRatio) {
    const cardId = `ps-card-${effect.id}`;
    const card = document.getElementById(cardId);
    if (!card || !psImageData) return;
    try {
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
      formData.append('images[]', base64ToBlob(psImageData.base64, psImageData.mimeType));
      formData.append('instruction', effect.prompt);
      formData.append('aspectRatio', aspectRatio);
      const apiHeaders = typeof getApiKey === 'function' ? {'X-API-Key': getApiKey()} : undefined;
      const response = await fetch(`${GENERATE_URL}`, {
        method: 'POST',
        headers: apiHeaders,
        body: formData
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      const result = await response.json();
      if (!result.success || !result.imageUrl) throw new Error("Respon API tidak valid (tidak ada data gambar).");
      if (result.imageUrl) {
        let imageUrl = result.imageUrl;
        const logoData = typeof getLogoData === 'function' ? getLogoData() : null;
        if (logoData && logoData.base64 && typeof applyLogoToImage === 'function') {
          const position = document.querySelector('#ps-logo-position-options .selected')?.dataset.value || 'bottom-right';
          const opacityInput = document.getElementById('ps-logo-opacity-input');
          const opacity = opacityInput ? parseInt(opacityInput.value) / 100 : 0.3;
          const sizeInput = document.getElementById('ps-logo-size-input');
          const size = sizeInput ? parseInt(sizeInput.value) : 20;
          try {
            imageUrl = await applyLogoToImage(imageUrl, logoData.base64, position, opacity, size);
          } catch (e) {
            console.error("Failed to apply logo", e);
          }
        }
        const imageTitle = effect.name || `Photoshoot Kreatif ${effect.id}`;
        card.innerHTML = `
                        <img src="${imageUrl}" class="w-full h-full object-cover">
                        <div class="absolute bottom-2 right-2 flex gap-1">
                            <button data-img-src="${imageUrl}" class="view-btn result-action-btn" title="Lihat Gambar">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                            <button data-img-src="${imageUrl}" data-img-title="${imageTitle}" data-card-id="${cardId}" class="ps-edit-btn result-action-btn" title="Edit Gambar Ini">
                                <i data-lucide="wand-2" class="w-4 h-4"></i>
                            </button>
                            <a href="${imageUrl}" download="photoshoot_produk_${effect.id}.png" class="result-action-btn download-btn" title="Unduh Gambar">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </a>
                        </div>`;
        card.classList.remove('bg-gray-100', 'flex', 'items-center', 'justify-center');
        card.classList.add('relative');
        doneSound.play();
      } else {
        throw new Error("Respon API tidak valid (tidak ada data gambar).");
      }
    } catch (error) {
      errorSound.play();
      console.error(`Error for product photoshoot card ${effect.id}:`, error);
      card.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message}</div>`;
    } finally {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  document.body.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.ps-edit-btn');
    if (editBtn) {
      const imgSrc = editBtn.dataset.imgSrc;
      const imgTitle = editBtn.dataset.imgTitle;
      const cardId = editBtn.dataset.cardId;
      if (imgSrc && imgTitle && cardId) {
        showEditModal(imgSrc, imgTitle, cardId);
      }
    }
  });

  async function generateStandardPhotoshoot() {
    const originalBtnHTML = psGenerateBtn.innerHTML;
    psGenerateBtn.disabled = true;
    psGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Memproses Gambar...</span>`;
    const aspectRatio = psRatioOptions.querySelector('.selected')?.dataset.value || '1:1';
    const aspectClass = getAspectRatioClass(aspectRatio);
    psResultsContainer.classList.remove('hidden');
    document.getElementById('ps-results-placeholder').classList.add('hidden');
    psResultsContainer.classList.add('flex-grow', 'flex', 'flex-col');
    psResultsTitle.textContent = "4 Konsep Photoshoot Produk";
    psResultsGrid.innerHTML = `<div class="col-span-1 sm:col-span-2 text-center p-4"><div class="loader-icon w-8 h-8 rounded-full mx-auto"></div><p class="mt-2 text-sm text-gray-600">Sedang memproses 4 variasi gambar...</p></div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    try {
      const lighting = psLightingOptions.querySelector('.selected').dataset.value;
      const mood = psMoodOptions.querySelector('.selected').dataset.value;
      const location = psLocationOptions.querySelector('.selected').dataset.value;
      const customInstruction = document.getElementById('ps-custom-prompt').value.trim();
      let baseSetting = `Professional product photography. Lighting: ${lighting}. Mood: ${mood}. `;
      if (mood === 'crowd') {
        let locationDescription = (location === 'indoor')
          ? 'placed on a professional shooting table inside a stylish interior, sharp focus'
          : 'placed in a scenic outdoor setting, natural light, depth of field';
        baseSetting += `Setting: ${locationDescription}. `;
      }
      if (customInstruction) {
        baseSetting += ` USER INSTRUCTION: ${customInstruction}.`;
      }
      psGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Membuat Gambar (0/4)</span>`;
      psResultsGrid.innerHTML = '';
      for (let i = 1; i <= 4; i++) {
        const card = document.createElement('div');
        card.id = `ps-card-${i}`;
        card.className = `card overflow-hidden bg-gray-100 flex items-center justify-center ${aspectClass}`;
        card.innerHTML = `<div class="loader-icon w-8 h-8 rounded-full"></div>`;
        psResultsGrid.appendChild(card);
      }
      lucide.createIcons();
      const generationPromises = [];
      const concepts = [
        {
          name: "Bayangan Artistik",
          prompt: `${baseSetting} Shadow Play: Analyze the product from the input image. Recreate it in a thematically related background with no people visible. The product must cast a prominent, artistic shadow across the surface. Maintain sharp focus on the product, controlled lighting for shadow drama, clean composition. High resolution, photorealistic. The final image MUST have an aspect ratio of ${aspectRatio}.`
        },
        {
          name: "Bokeh Lembut",
          prompt: `${baseSetting} Bokeh Bliss: Analyze the product from the input image. Recreate it in a thematically related background with no people visible. The background must feature a beautiful, soft bokeh effect while the product remains in crisp, sharp focus. Gentle highlights, pleasing color harmony, natural depth-of-field. High resolution, photorealistic. The final image MUST have an aspect ratio of ${aspectRatio}.`
        },
        {
          name: "Melayang Dinamis",
          prompt: `${baseSetting} Levitating Dynamic: Dynamic 'hero product' action photography based on the input image. Capture the product mid-air in freeze-motion style. Create a powerful, cinematic abstract background that is thematically related to the product. Add artistic splashes and particles that match the product’s material or colors, conveying motion and energy. High resolution, photorealistic. The final image MUST have an aspect ratio of ${aspectRatio}.`
        },
        {
          name: "Wildcard Kreatif",
          prompt: `${baseSetting} Creative Wildcard: A completely unique, random, and creative concept that remains relevant to the product’s nature. Explore unexpected visual storytelling (e.g., surreal materials, inventive props, or unconventional settings) while keeping the product clearly identifiable and hero-focused. High resolution, photorealistic. The final image MUST have an aspect ratio of ${aspectRatio}.`
        }
      ];
      concepts.forEach((c, idx) => {
        const id = idx + 1;
        generationPromises.push(
          generateProductOnlyImage({id, name: c.name, prompt: c.prompt}, aspectRatio)
          .then(() => {
            psGenerateBtn.querySelector('span').textContent = `Membuat Gambar (${id}/4)`;
          })
        );
      });
      await Promise.allSettled(generationPromises);
      psGenerateBtn.querySelector('span').textContent = `Selesai`;
    } catch (error) {
      console.error("Error in standard photoshoot:", error);
      psResultsGrid.innerHTML = `<div class="col-span-1 sm:col-span-2 text-center p-4 text-red-600"><p>Gagal membuat gambar: ${error.message}</p></div>`;
    } finally {
      psGenerateBtn.disabled = false;
      psGenerateBtn.innerHTML = originalBtnHTML;
      lucide.createIcons();
    }
  }

  async function generateBoosterPhotoshoot() {
    const originalBtnHTML = psGenerateBtn.innerHTML;
    psGenerateBtn.disabled = true;
    psGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Memproses Booster...</span>`;
    const aspectRatio = psRatioOptions.querySelector('.selected').dataset.value;
    const aspectClass = getAspectRatioClass(aspectRatio);
    const customInstruction = document.getElementById('ps-custom-prompt').value.trim();
    psResultsContainer.classList.remove('hidden');
    document.getElementById('ps-results-placeholder').classList.add('hidden');
    psResultsContainer.classList.add('flex-grow', 'flex', 'flex-col');
    psResultsTitle.textContent = "10 Variasi Photoshoot Kreatif (Booster)";
    psResultsGrid.innerHTML = `<div class="col-span-1 sm:col-span-2 text-center p-4"><div class="loader-icon w-8 h-8 rounded-full mx-auto"></div><p class="mt-2 text-sm text-gray-600">Sedang memproses 10 variasi gambar...</p></div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    try {
      psGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Membuat Gambar (0/10)</span>`;
      psResultsGrid.innerHTML = '';
      psResultsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
      for (let i = 1; i <= 10; i++) {
        const card = document.createElement('div');
        card.id = `ps-card-${i}`;
        card.className = `card overflow-hidden bg-gray-100 flex items-center justify-center ${aspectClass}`;
        card.innerHTML = `<div class="loader-icon w-8 h-8 rounded-full"></div>`;
        psResultsGrid.appendChild(card);
      }
      lucide.createIcons();
      const styles = [
        "Minimalist Studio", "Outdoor Nature", "Luxury Interior", "Neon City Lights", "Pastel Colors",
        "Industrial Vibe", "Vintage aesthetics", "Modern Tech", "Soft Sunlight", "Dramatic Shadows"
      ];
      const generationPromises = [];
      for (let i = 1; i <= 10; i++) {
        const style = styles[i - 1] || "Creative";
        let conceptPrompt = `Creative product photography. Style: ${style}. Variation ${i}. High quality, 8k, detailed texture.`;
        if (customInstruction) {
          conceptPrompt += ` User Request: ${customInstruction}.`;
        }
        conceptPrompt += ` The final image MUST have an aspect ratio of ${aspectRatio}.`;
        const conceptName = `Booster ${style}`;
        generationPromises.push(
          generateProductOnlyImage({id: i, name: conceptName, prompt: conceptPrompt}, aspectRatio)
          .then(() => {
            const currentText = psGenerateBtn.querySelector('span').textContent;
            const currentCount = parseInt(currentText.match(/\d+/)) || 0;
            if (currentCount < 10) {
              psGenerateBtn.querySelector('span').textContent = `Membuat Gambar (${currentCount + 1}/10)`;
            }
          })
        );
      }
      await Promise.allSettled(generationPromises);
    } catch (error) {
      console.error("Error in booster photoshoot:", error);
      psResultsGrid.innerHTML = `<div class="col-span-1 sm:col-span-2 text-center p-4 text-red-600"><p>Gagal membuat booster: ${error.message}</p></div>`;
    } finally {
      psGenerateBtn.disabled = false;
      psGenerateBtn.innerHTML = originalBtnHTML;
      lucide.createIcons();
    }
  }

  function showEditModal(imgSrc, imgTitle, cardId) {
    if (typeof showContentModal !== 'function') return;
    const bodyHTML = `
                <img src="${imgSrc}" class="w-full h-auto rounded-lg mb-4">
                <label for="edit-instruction" class="block mb-2 font-semibold">Instruksi Edit:</label>
                <textarea id="edit-instruction" class="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600" rows="3" placeholder="Contoh: ganti warna background menjadi biru..."></textarea>
                <button id="submit-edit-btn" class="mt-4 w-full bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700">
                    Edit Gambar
                </button>
            `;
    showContentModal(`Edit: ${imgTitle}`, bodyHTML);
    const submitEditBtn = document.getElementById('submit-edit-btn');
    submitEditBtn.addEventListener('click', async () => {
      const instruction = document.getElementById('edit-instruction').value.trim();
      if (!instruction) {
        document.getElementById('edit-instruction').focus();
        return;
      }
      submitEditBtn.disabled = true;
      submitEditBtn.innerHTML = '<div class="loader-icon loader-icon-light mx-auto"></div>';
      const parts = imgSrc.split(',');
      const mimeType = parts[0].match(/:(.*?);/)[1];
      const base64 = parts[1];
      const originalImageData = {base64, mimeType};
      try {
        const newBase64 = await generateEditedImage(originalImageData, instruction);
        const newImageUrl = `data:image/png;base64,${newBase64}`;
        const cardToUpdate = document.getElementById(cardId);
        if (cardToUpdate) {
          const imgElement = cardToUpdate.querySelector('img');
          const editBtnElement = cardToUpdate.querySelector('.ps-edit-btn');
          const viewBtnElement = cardToUpdate.querySelector('.view-btn');
          const downloadLinkElement = cardToUpdate.querySelector('.download-btn');
          if (imgElement) imgElement.src = newImageUrl;
          if (editBtnElement) editBtnElement.dataset.imgSrc = newImageUrl;
          if (viewBtnElement) viewBtnElement.dataset.imgSrc = newImageUrl;
          if (downloadLinkElement) downloadLinkElement.href = newImageUrl;
        }
        if (typeof hideModal === 'function') hideModal();
      } catch (error) {
        console.error('Failed to edit image:', error);
        alert(`Gagal mengedit gambar: ${error.message}`);
        if (typeof hideModal === 'function') hideModal();
      }
    }, {once: true});
  }

  async function generateEditedImage(originalImageData, instruction) {
    const prompt = `Based on the original image, edit it according to the following instruction: "${instruction}". Keep the main subject and overall style intact, only applying the requested changes.`;
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
    formData.append('images[]', base64ToBlob(originalImageData.base64, originalImageData.mimeType));
    formData.append('instruction', prompt);
    const apiHeaders = typeof getApiKey === 'function' ? {'X-API-Key': getApiKey()} : undefined;
    const response = await fetch(`${GENERATE_URL}`, {
      method: 'POST',
      headers: apiHeaders,
      body: formData
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response));
    const result = await response.json();
    if (result.success && result.imageUrl) {
      const imgResponse = await fetch(result.imageUrl);
      const blob = await imgResponse.blob();
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    throw new Error("Invalid response from API, no image data found.");
  }
};
