window.initSketsaGambar = function ({
                                      document,
                                      setupImageUpload,
                                      setupOptionButtons,
                                      getAspectRatioClass,
                                      lucide,
                                      API_KEY,
                                      GENERATE_URL,
                                      getApiErrorMessage,
                                      doneSound,
                                      errorSound
                                    }) {
  const stiImageInput = document.getElementById('sti-image-input');
  const stiUploadBox = document.getElementById('sti-upload-box');
  const stiPreview = document.getElementById('sti-preview');
  const stiPlaceholder = document.getElementById('sti-placeholder');
  const stiRemoveBtn = document.getElementById('sti-remove-btn');
  const stiPurposeOptions = document.getElementById('sti-purpose-options');
  const stiCustomPurposeContainer = document.getElementById('sti-custom-purpose-container');
  const stiCustomPurposeInput = document.getElementById('sti-custom-purpose-input');
  const stiPromptInput = document.getElementById('sti-prompt-input');
  const stiRatioOptions = document.getElementById('sti-ratio-options');
  const stiGenerateBtn = document.getElementById('sti-generate-btn');
  const stiResultsContainer = document.getElementById('sti-results-container');
  const stiResultsGrid = document.getElementById('sti-results-grid');
  let stiImageData = null;

  function stiUpdateButtons() {
    const hasImage = !!stiImageData;
    stiGenerateBtn.disabled = !hasImage;
  }

  function stiSetImage(data) {
    stiImageData = data;
    stiPreview.src = data.dataUrl;
    stiPlaceholder.classList.add('hidden');
    stiPreview.classList.remove('hidden');
    stiRemoveBtn.classList.remove('hidden');
    stiUpdateButtons();
  }

  if (stiImageInput) {
    setupImageUpload(stiImageInput, stiUploadBox, stiSetImage);
  }
  if (stiRemoveBtn) {
    stiRemoveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stiImageData = null;
      stiImageInput.value = '';
      stiPreview.src = '#';
      stiPreview.classList.add('hidden');
      stiPlaceholder.classList.remove('hidden');
      stiRemoveBtn.classList.add('hidden');
      document.getElementById('sti-results-placeholder').classList.remove('hidden');
      stiResultsContainer.classList.add('hidden');
      stiResultsGrid.innerHTML = '';
      stiUpdateButtons();
    });
  }
  setupOptionButtons(stiPurposeOptions);
  if (stiPurposeOptions) {
    stiPurposeOptions.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button && button.dataset.value === 'Kustom') {
        stiCustomPurposeContainer.classList.remove('hidden');
        stiCustomPurposeInput.focus();
      } else if (button) {
        stiCustomPurposeContainer.classList.add('hidden');
      }
    });
  }
  setupOptionButtons(stiRatioOptions);
  if (stiGenerateBtn) {
    stiGenerateBtn.addEventListener('click', async () => {
      const originalBtnHTML = stiGenerateBtn.innerHTML;
      stiGenerateBtn.disabled = true;
      stiGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Menggambar...</span>`;
      document.getElementById('sti-results-placeholder').classList.add('hidden');
      const aspectRatio = stiRatioOptions.querySelector('.selected').dataset.value;
      const aspectClass = getAspectRatioClass(aspectRatio);
      stiResultsContainer.classList.remove('hidden');
      stiResultsGrid.innerHTML = '';
      for (let i = 1; i <= 4; i++) {
        const card = document.createElement('div');
        card.id = `sti-card-${i}`;
        card.className = `card overflow-hidden bg-gray-100 flex items-center justify-center ${aspectClass}`;
        card.innerHTML = `<div class="loader-icon w-8 h-8 rounded-full"></div>`;
        stiResultsGrid.appendChild(card);
      }
      lucide.createIcons();
      const generationPromises = [1, 2, 3, 4].map(i => generateSingleSketchImage(i, aspectRatio));
      await Promise.allSettled(generationPromises);
      stiGenerateBtn.disabled = false;
      stiGenerateBtn.innerHTML = originalBtnHTML;
      lucide.createIcons();
    });
  }

  async function generateSingleSketchImage(id, aspectRatio) {
    const card = document.getElementById(`sti-card-${id}`);
    try {
      let purpose = stiPurposeOptions.querySelector('.selected').dataset.value;
      if (purpose === 'Kustom') {
        purpose = stiCustomPurposeInput.value.trim() || 'sebuah gambar yang indah';
      }
      const instruction = stiPromptInput.value.trim();
      let finalPrompt = `Transform the provided sketch into a finished, high-quality, professional image. The composition and main subject of the sketch MUST be followed.
                - The intended final purpose is: "${purpose}".
                - Additional user instructions: "${instruction}".
                - The result should be photorealistic, detailed, and visually stunning. This is variation number ${id}.`;
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
      formData.append('images[]', base64ToBlob(stiImageData.base64, stiImageData.mimeType));
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
      if (!result.success || !result.imageUrl) throw new Error("No image data received from API.");
      const imageUrl = result.imageUrl;
      card.innerHTML = `
                    <img src="${imageUrl}" class="w-full h-full object-cover">
                    <div class="absolute bottom-2 right-2 flex gap-1">
                        <button data-img-src="${imageUrl}" class="view-btn result-action-btn" title="Lihat Gambar"><i data-lucide="eye" class="w-4 h-4"></i></button>
                        <a href="${imageUrl}" download="hasil_sketsa_${id}.png" class="result-action-btn download-btn" title="Unduh Gambar">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </a>
                    </div>`;
      card.className = `relative rounded-2xl overflow-hidden bg-white border border-slate-200 w-full ${getAspectRatioClass(aspectRatio)}`;
      doneSound.play();
    } catch (error) {
      errorSound.play();
      console.error(`Error for sketch-to-image card ${id}:`, error);
      card.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message}</div>`;
    } finally {
      lucide.createIcons();
    }
  }

  return {
    stiSetImage
  };
}
