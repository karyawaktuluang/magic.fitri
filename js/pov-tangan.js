window.initPovTangan = function ({
                                   document,
                                   setupImageUpload,
                                   setupOptionButtons,
                                   updateSliderProgress,
                                   getAspectRatioClass,
                                   lucide,
                                   API_KEY,
                                   GENERATE_URL,
                                   getApiErrorMessage,
                                   doneSound,
                                   errorSound
                                 }) {
  const ptImageInput = document.getElementById('pt-image-input');
  const ptUploadBox = document.getElementById('pt-upload-box');
  const ptPreview = document.getElementById('pt-preview');
  const ptPlaceholder = document.getElementById('pt-placeholder');
  const ptRemoveBtn = document.getElementById('pt-remove-btn');
  const ptInstructionInput = document.getElementById('pt-instruction-input');
  const ptCountSlider = document.getElementById('pt-count-slider');
  const ptCountDisplay = document.getElementById('pt-count-display');
  const ptRatioOptions = document.getElementById('pt-ratio-options');
  const ptGenerateBtn = document.getElementById('pt-generate-btn');
  const ptResultsContainer = document.getElementById('pt-results-container');
  const ptResultsGrid = document.getElementById('pt-results-grid');
  let ptImageData = null;

  function ptUpdateButtons() {
    const hasImage = !!ptImageData;
    ptGenerateBtn.disabled = !hasImage;
  }

  setupImageUpload(ptImageInput, ptUploadBox, (data) => {
    ptImageData = data;
    ptPreview.src = data.dataUrl;
    ptPlaceholder.classList.add('hidden');
    ptPreview.classList.remove('hidden');
    ptRemoveBtn.classList.remove('hidden');
    ptUpdateButtons();
  });
  ptRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ptImageData = null;
    ptImageInput.value = '';
    ptInstructionInput.value = '';
    ptPreview.src = '#';
    ptPreview.classList.add('hidden');
    ptPlaceholder.classList.remove('hidden');
    ptRemoveBtn.classList.add('hidden');
    document.getElementById('pt-results-placeholder').classList.remove('hidden');
    ptResultsContainer.classList.add('hidden');
    ptResultsGrid.innerHTML = '';
    ptUpdateButtons();
  });
  ptCountSlider.addEventListener('input', () => {
    ptCountDisplay.textContent = ptCountSlider.value;
    updateSliderProgress(ptCountSlider);
  });
  updateSliderProgress(ptCountSlider);
  setupOptionButtons(ptRatioOptions);
  ptGenerateBtn.addEventListener('click', async () => {
    const originalBtnHTML = ptGenerateBtn.innerHTML;
    ptGenerateBtn.disabled = true;
    const count = parseInt(ptCountSlider.value);
    ptGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Membuat Konsep (0/${count})</span>`;
    document.getElementById('pt-results-placeholder').classList.add('hidden');
    const aspectRatio = ptRatioOptions.querySelector('.selected').dataset.value;
    const aspectClass = getAspectRatioClass(aspectRatio);
    ptResultsContainer.classList.remove('hidden');
    ptResultsGrid.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      const card = document.createElement('div');
      card.id = `pt-card-${i}`;
      card.className = `card overflow-hidden bg-gray-100 flex items-center justify-center ${aspectClass}`;
      card.innerHTML = `
                        <div class="text-center p-2">
                            <div class="loader-icon w-8 h-8 rounded-full mx-auto"></div>
                            <p class="text-xs mt-2 text-gray-600">Membuat Konsep...</p>
                        </div>
                    `;
      ptResultsGrid.appendChild(card);
    }
    lucide.createIcons();
    setTimeout(async () => {
      try {
        const concepts = await getHandPovConcepts(count);
        const generationPromises = concepts.map((concept, index) =>
          generateSingleHandPovImage(index + 1, concept.prompt, aspectRatio)
          .then(() => {
            ptGenerateBtn.querySelector('span').textContent = `Membuat Foto (${index + 1}/${count})`;
          })
        );
        await Promise.allSettled(generationPromises);
      } catch (error) {
        console.error("Error during POV Tangan generation:", error);
        ptResultsGrid.innerHTML = `<div class="col-span-1 md:col-span-2 text-center py-10 text-red-500"><p class="break-all">Terjadi kesalahan: ${error.message}</p></div>`;
      } finally {
        ptGenerateBtn.disabled = false;
        ptGenerateBtn.innerHTML = originalBtnHTML;
        lucide.createIcons();
      }
    }, 100);
  });

  async function getHandPovConcepts(count) {
    const concepts = [];
    const handTypes = ['male hand', 'female hand', 'child hand', 'rough worker hand', 'manicured hand'];
    const actions = ['holding it naturally', 'using it', 'showing it to camera', 'placing it on a surface'];
    const backgrounds = ['blurred outdoor background', 'cozy indoor setting', 'wooden table', 'bright studio background', 'nature background'];
    for (let i = 0; i < count; i++) {
      const hand = handTypes[i % handTypes.length];
      const action = actions[i % actions.length];
      const bg = backgrounds[i % backgrounds.length];
      concepts.push({
        prompt: `A POV shot of a ${hand} ${action} with a ${bg}.`
      });
    }
    return concepts;
  }

  async function generateSingleHandPovImage(id, conceptData, aspectRatio) {
    const card = document.getElementById(`pt-card-${id}`);
    const conceptPrompt = conceptData.prompt || conceptData;
    try {
      card.innerHTML = `
                        <div class="text-center p-2">
                            <div class="loader-icon w-8 h-8 rounded-full mx-auto"></div>
                            <p class="text-xs mt-2 text-gray-600">Menyusun Gambar...</p>
                        </div>
                    `;
      lucide.createIcons();
      let finalPrompt = `Create a photorealistic point-of-view image. The main subject is the product from the provided image.
                    - Scene: ${conceptPrompt}.
                    - Additional Instructions: ${ptInstructionInput.value.trim() || 'None'}.
                    CRITICAL: The product in the final image must look identical to the one in the provided source image. The hands must look realistic. This is variation ${id}.`;
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
      formData.append('images[]', base64ToBlob(ptImageData.base64, ptImageData.mimeType));
      formData.append('instruction', finalPrompt);
      formData.append('aspectRatio', aspectRatio || 'IMAGE_ASPECT_RATIO_SQUARE');
      if (aspectRatio && aspectRatio !== 'Auto') {
        // already set
      } else {
        formData.append('aspectRatio', '1:1');
      }
      const response = await fetch(`${GENERATE_URL}`, {
        method: 'POST',
        cache: "no-store",
        headers: {
          'X-API-Key': API_KEY
        },
        body: formData
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      const result = await response.json();
      if (!result.success || !result.imageUrl) throw new Error("No image data from AI.");
      const imageUrl = result.imageUrl;
      card.innerHTML = `
                        <img src="${imageUrl}" class="w-full h-full object-cover">
                        <div class="absolute bottom-2 right-2 flex gap-1">
                            <button data-img-src="${imageUrl}" class="view-btn result-action-btn" title="Lihat Gambar"><i data-lucide="eye" class="w-4 h-4"></i></button>
                            <a href="${imageUrl}" download="pov_tangan_${id}.png" class="result-action-btn download-btn" title="Unduh Gambar">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </a>
                        </div>`;
      card.className = `card relative w-full overflow-hidden group ${getAspectRatioClass(aspectRatio)}`;
      doneSound.play();
    } catch (error) {
      errorSound.play();
      console.error(`Error for POV Tangan card ${id}:`, error);
      card.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message}</div>`;
    } finally {
      lucide.createIcons();
    }
  }
};
