window.initPerbaikiFoto = function (ctx) {
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
    errorSound
  } = ctx;
  const efContentEnhance = document.getElementById('ef-content-enhance');
  const pfImageInput = document.getElementById('pf-image-input');
  const pfUploadBox = document.getElementById('pf-upload-box');
  const pfPreview = document.getElementById('pf-preview');
  const pfPlaceholder = document.getElementById('pf-placeholder');
  const pfRemoveBtn = document.getElementById('pf-remove-btn');
  const pfRatioOptions = document.getElementById('pf-ratio-options');
  const pfGenerateBtn = document.getElementById('pf-generate-btn');
  const pfResultsContainer = document.getElementById('pf-results-container');
  const pfResultsGrid = document.getElementById('pf-results-grid');
  const pfResultsPlaceholder = document.getElementById('pf-results-placeholder');
  const pfAdditionalInstruction = document.getElementById('pf-additional-instruction');
  if (!pfImageInput || !pfUploadBox || !pfPreview || !pfPlaceholder || !pfRemoveBtn || !pfRatioOptions || !pfGenerateBtn || !pfResultsContainer || !pfResultsGrid) {
    return null;
  }
  let pfImageData = null;

  function showEnhanceTab() {
    if (efContentEnhance) efContentEnhance.classList.remove('hidden');
  }

  function pfUpdateButtons() {
    pfGenerateBtn.disabled = !pfImageData;
  }

  function setPfImage(data) {
    pfImageData = data;
    pfPreview.src = data.dataUrl;
    pfPlaceholder.classList.add('hidden');
    pfPreview.classList.remove('hidden');
    pfRemoveBtn.classList.remove('hidden');
    pfUpdateButtons();
  }

  setupImageUpload(pfImageInput, pfUploadBox, setPfImage);
  setupOptionButtons(pfRatioOptions);
  pfRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pfImageData = null;
    pfImageInput.value = '';
    pfPreview.src = '#';
    pfPreview.classList.add('hidden');
    pfPlaceholder.classList.remove('hidden');
    pfRemoveBtn.classList.add('hidden');
    pfUpdateButtons();
    if (pfResultsPlaceholder) pfResultsPlaceholder.classList.remove('hidden');
    pfResultsContainer.classList.add('hidden');
    pfResultsGrid.innerHTML = '';
  });
  pfGenerateBtn.addEventListener('click', async () => {
    const originalBtnHTML = pfGenerateBtn.innerHTML;
    pfGenerateBtn.disabled = true;
    pfGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Memperbaiki...</span>`;
    if (pfResultsPlaceholder) pfResultsPlaceholder.classList.add('hidden');
    const aspectRatio = pfRatioOptions.querySelector('.selected').dataset.value;
    const aspectClass = getAspectRatioClass(aspectRatio);
    pfResultsContainer.classList.remove('hidden');
    pfResultsGrid.className = `grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6`;
    pfResultsGrid.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
      const card = document.createElement('div');
      card.id = `pf-card-${i}`;
      card.className = `card overflow-hidden transition-all ${aspectClass} bg-gray-100 flex items-center justify-center`;
      card.innerHTML = `<div class="loader-icon w-10 h-10"></div>`;
      pfResultsGrid.appendChild(card);
    }
    lucide.createIcons();
    const generationPromises = [1, 2, 3, 4].map(i => generateEnhancedImage(i, aspectRatio));
    await Promise.allSettled(generationPromises);
    pfGenerateBtn.disabled = false;
    pfGenerateBtn.innerHTML = originalBtnHTML;
    lucide.createIcons();
  });

  async function generateEnhancedImage(id, aspectRatio) {
    const card = document.getElementById(`pf-card-${id}`);
    if (!card) return;
    try {
      let instruction = pfAdditionalInstruction ? pfAdditionalInstruction.value.trim() : '';
      let prompt = `Enhance this image to professional studio portrait quality. Improve lighting, sharpness, and color balance. Make it look like a high-resolution photograph.`;
      if (instruction) {
        prompt += ` Additional instruction: ${instruction}.`;
      }
      prompt += ` This is variation ${id}.`;
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
      formData.append('images', base64ToBlob(pfImageData.base64, pfImageData.mimeType));
      formData.append('instruction', prompt);
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
      if (!result.success || !result.imageUrl) throw new Error("Respon tidak valid dari API.");
      const imageUrl = result.imageUrl;
      card.innerHTML = `
                    <img src="${imageUrl}" class="w-full h-full object-cover">
                    <div class="absolute bottom-2 right-2 flex gap-1">
                        <button data-img-src="${imageUrl}" class="view-btn result-action-btn" title="Lihat Gambar">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <a href="${imageUrl}" download="perbaikan_foto_${id}.png" class="result-action-btn download-btn" title="Unduh Gambar">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </a>
                    </div>`;
      card.classList.remove('bg-gray-100', 'flex', 'items-center', 'justify-center');
      card.classList.add('relative');
      doneSound.play();
    } catch (error) {
      errorSound.play();
      console.error(`Error for enhanced photo card ${id}:`, error);
      card.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message}</div>`;
    } finally {
      lucide.createIcons();
    }
  }

  return {
    setPfImageData: setPfImage,
    showEnhanceTab
  };
};
