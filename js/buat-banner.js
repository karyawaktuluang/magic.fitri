window.initBuatBanner = function ({
                                    document,
                                    setupImageUpload,
                                    setupOptionButtons,
                                    getAspectRatioClass,
                                    lucide,
                                    getApiKey,
                                    GENERATE_URL,
                                    CHAT_URL,
                                    getApiErrorMessage,
                                    doneSound,
                                    errorSound
                                  }) {
  // DOM Elements
  const imageInput = document.getElementById('bnr-image-input');
  const imageUploadBox = document.getElementById('bnr-upload-box');
  const imagePreview = document.getElementById('bnr-preview');
  const imagePlaceholder = document.getElementById('bnr-placeholder');
  const removeImageBtn = document.getElementById('bnr-remove-btn');
  const descInput = document.getElementById('bnr-desc-input');
  const autoTextBtn = document.getElementById('bnr-auto-text-btn');
  const autoTextLoading = document.getElementById('bnr-auto-text-loading');
  const styleOptions = document.getElementById('bnr-style-options');
  const customStyleContainer = document.getElementById('bnr-custom-style-container');
  const customStyleInput = document.getElementById('bnr-custom-style-input');
  const ratioOptions = document.getElementById('bnr-ratio-options');
  const generateBtn = document.getElementById('bnr-generate-btn');
  const generateBtnText = document.getElementById('bnr-generate-btn-text');
  // Slider Elements
  const countSlider = document.getElementById('bnr-count-slider');
  const countValue = document.getElementById('bnr-count-value');
  const resultsContainer = document.getElementById('bnr-results-container');
  const resultsGrid = document.getElementById('bnr-results-grid');
  const resultsPlaceholder = document.getElementById('bnr-results-placeholder');
  let bannerImageData = null;
  let isGenerating = false;
  // --- Slider Logic ---
  if (countSlider && countValue) {
    countSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      countValue.textContent = val;
      if (generateBtnText) {
        generateBtnText.textContent = `Buat ${val} Banner`;
      }
    });
  }
  // --- Image Upload Handling ---
  setupImageUpload(imageInput, imageUploadBox, (data) => {
    bannerImageData = data;
    imagePreview.src = data.dataUrl;
    imagePlaceholder.classList.add('hidden');
    imagePreview.classList.remove('hidden');
    removeImageBtn.classList.remove('hidden');
    updateGenerateButton();
  });
  removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bannerImageData = null;
    imageInput.value = '';
    imagePreview.src = '#';
    imagePreview.classList.add('hidden');
    imagePlaceholder.classList.remove('hidden');
    removeImageBtn.classList.add('hidden');
    // Reset results
    resultsContainer.classList.add('hidden');
    resultsPlaceholder.classList.remove('hidden');
    resultsGrid.innerHTML = '';
    updateGenerateButton();
  });
  // --- Style Selection ---
  styleOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    // Update UI
    styleOptions.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    // Handle Custom Style
    const value = btn.dataset.value;
    if (value === 'Kustom') {
      customStyleContainer.classList.remove('hidden');
      customStyleInput.focus();
    } else {
      customStyleContainer.classList.add('hidden');
    }
  });
  // --- Ratio Selection ---
  setupOptionButtons(ratioOptions);
  // --- Auto Text Generation ---
  autoTextBtn.addEventListener('click', async () => {
    if (autoTextLoading.classList.contains('hidden') === false) return; // Already loading
    const currentText = descInput.value.trim();
    const selectedStyleBtn = styleOptions.querySelector('.selected');
    const styleValue = selectedStyleBtn ? selectedStyleBtn.dataset.value : 'Modern';
    const selectedStyle = styleValue === 'Kustom' ? (customStyleInput.value.trim() || 'Modern') : styleValue;
    const selectedRatioBtn = ratioOptions.querySelector('.selected');
    const selectedRatio = selectedRatioBtn ? selectedRatioBtn.dataset.value : '9:16';
    let prompt = "Analisa konten gambar yang diunggah, identifikasi subjek utama, suasana, dan konteks visual. Berdasarkan analisa tersebut, buat SATU kalimat teks banner iklan yang relevan dengan gambar, singkat, persuasif, dan punchy dalam Bahasa Indonesia (6–10 kata). Sertakan kata aksi atau manfaat jelas. Gaya: " + selectedStyle + ". Rasio: " + selectedRatio + ". Jika ada teks awal pengguna, gunakan sebagai konteks tambahan: \"" + (currentText || "") + "\". Balas hanya kalimat final tanpa tanda kutip.";
    // UI Loading
    autoTextLoading.classList.remove('hidden');
    autoTextBtn.disabled = true;
    autoTextBtn.classList.add('opacity-50');
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      // Append image if available
      if (bannerImageData) {
        const base64ToBlob = (base64, mimeType) => {
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new Blob([byteArray], {type: mimeType});
        };
        const blob = base64ToBlob(bannerImageData.base64, bannerImageData.mimeType);
        formData.append('images', blob, 'input-image.jpg');
      }
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        cache: "no-store",
        headers: {
          'X-API-Key': getApiKey()
        },
        body: formData
      });
      if (!response.ok) throw new Error('Gagal menghubungi server');
      const data = await response.json();
      let generatedText = "";
      if (data.response) {
        generatedText = data.response;
      } else if (data.candidates && data.candidates.length > 0) {
        generatedText = data.candidates[0].content.parts[0].text;
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        generatedText = data.choices[0].message.content;
      }
      if (generatedText) {
        generatedText = generatedText.trim();
        // Remove quotes if any
        generatedText = generatedText.replace(/^["']|["']$/g, '');
        descInput.value = generatedText;
        updateGenerateButton();
      }
    } catch (error) {
      console.error('Auto text error:', error);
    } finally {
      autoTextLoading.classList.add('hidden');
      autoTextBtn.disabled = false;
      autoTextBtn.classList.remove('opacity-50');
    }
  });
  // --- Generate Button Logic ---
  descInput.addEventListener('input', updateGenerateButton);

  function updateGenerateButton() {
    const hasImage = !!bannerImageData;
    // Requirement: Must have image. Text is optional but recommended.
    generateBtn.disabled = !hasImage;
  }

  generateBtn.addEventListener('click', async () => {
    if (isGenerating) return;
    // Final Validation
    if (!bannerImageData) {
      alert('Mohon unggah gambar terlebih dahulu.');
      return;
    }
    const text = descInput.value.trim();
    const selectedStyleBtn = styleOptions.querySelector('.selected');
    const styleValue = selectedStyleBtn ? selectedStyleBtn.dataset.value : 'Modern';
    const style = styleValue === 'Kustom' ? customStyleInput.value.trim() : styleValue;
    const selectedRatioBtn = ratioOptions.querySelector('.selected');
    const ratio = selectedRatioBtn ? selectedRatioBtn.dataset.value : '9:16';
    const count = parseInt(countSlider.value) || 1;
    // UI Loading
    isGenerating = true;
    generateBtn.disabled = true;
    const originalBtnContent = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 mr-2 animate-spin"></i><span>Sedang Memproses...</span>';
    resultsContainer.classList.add('hidden');
    resultsPlaceholder.classList.remove('hidden');
    resultsPlaceholder.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="loader-icon w-12 h-12 mb-4 animate-spin text-teal-500"></div>
                <p class="text-slate-600 font-medium">Sedang meracik ${count} banner ajaib...</p>
                <p class="text-slate-400 text-sm mt-1">Estimasi waktu: ${count * 10} detik</p>
            </div>
        `;
    const base64ToBlob = (base64, mimeType) => {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], {type: mimeType});
    };
    const imageBlob = base64ToBlob(bannerImageData.base64, bannerImageData.mimeType);
    let allImages = [];
    let errors = [];
    const fullPrompt = `Create a professional advertisement banner.
        - Text: "${text}"
        - Style: ${style}
        - Ensure text is clear and readable.`;
    try {
      // Loop for multiple generations
      for (let i = 0; i < count; i++) {
        // Update loading status if multiple
        if (count > 1) {
          const statusText = document.querySelector('#bnr-results-placeholder p.text-slate-600');
          if (statusText) statusText.textContent = `Sedang meracik banner ${i + 1} dari ${count}...`;
        }
        const formData = new FormData();
        formData.append('feature', 'buat-banner');
        // Construct prompt with variation if needed
        let variationPrompt = fullPrompt;
        if (i > 0) variationPrompt += ` (Variasi unik ke-${i + 1})`;
        formData.append('instruction', variationPrompt);
        formData.append('aspectRatio', ratio);
        formData.append('images[]', imageBlob, 'input-image.jpg');
        try {
          const response = await fetch(GENERATE_URL, {
            method: 'POST',
            cache: "no-store",
            headers: {
              'X-API-Key': getApiKey()
            },
            body: formData
          });
          if (!response.ok) throw new Error(await getApiErrorMessage(response));
          const data = await response.json();
          if (data.imageUrl) {
            allImages.push(data.imageUrl);
          } else if (data.images && Array.isArray(data.images)) {
            allImages.push(...data.images);
          }
        } catch (err) {
          console.error(`Generation ${i + 1} failed:`, err);
          errors.push(err.message);
        }
      }
      if (allImages.length === 0) {
        throw new Error(errors.length > 0 ? errors[0] : 'Tidak ada gambar yang dihasilkan');
      }
      // Display Results
      displayResults(allImages);
      doneSound.play();
    } catch (error) {
      errorSound.play();
      console.error('Generate error:', error);
      resultsPlaceholder.innerHTML = `
                <div class="flex flex-col items-center text-red-500">
                    <i data-lucide="alert-circle" class="w-12 h-12 mb-2"></i>
                    <p class="font-medium">Terjadi Kesalahan</p>
                    <p class="text-sm text-slate-400 mt-1 text-center max-w-xs">${error.message}</p>
                    <button id="bnr-retry-btn" class="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors">Coba Lagi</button>
                </div>
            `;
      document.getElementById('bnr-retry-btn').addEventListener('click', () => {
        generateBtn.click();
      });
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } finally {
      isGenerating = false;
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnContent;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  function displayResults(images) {
    if (!images || images.length === 0) {
      resultsPlaceholder.innerHTML = '<p>Tidak ada gambar yang dihasilkan.</p>';
      return;
    }
    resultsPlaceholder.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultsGrid.innerHTML = '';
    images.forEach((imgUrl, index) => {
      const card = document.createElement('div');
      card.className = 'relative rounded-2xl overflow-hidden bg-white border border-slate-200 w-full';
      card.innerHTML = `
                <img src="${imgUrl}" alt="Hasil Banner ${index + 1}" class="w-full h-full object-cover">
                <div class="absolute bottom-2 right-2 flex gap-1">
                    <button data-img-src="${imgUrl}" class="view-btn result-action-btn" title="Lihat Gambar">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                    <a href="${imgUrl}" download="banner_${index + 1}.png" class="result-action-btn download-btn" title="Unduh Gambar">
                        <i data-lucide="download" class="w-4 h-4"></i>
                    </a>
                </div>
            `;
      resultsGrid.appendChild(card);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
    // Scroll to results on mobile
    if (window.innerWidth < 1024) {
      resultsContainer.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }

  // --- Expose API ---
  return {
    setBannerImageData: (data) => {
      bannerImageData = data;
      imagePreview.src = data.dataUrl;
      imagePlaceholder.classList.add('hidden');
      imagePreview.classList.remove('hidden');
      removeImageBtn.classList.remove('hidden');
      updateGenerateButton();
    }
  };
};
