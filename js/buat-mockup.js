window.initBuatMockup = function ({
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
                                  }) {
  const dmImageInput = document.getElementById('dm-image-input');
  const dmUploadBox = document.getElementById('dm-upload-box');
  const dmPreview = document.getElementById('dm-preview');
  const dmPlaceholder = document.getElementById('dm-placeholder');
  const dmRemoveBtn = document.getElementById('dm-remove-btn');
  const dmTypeOptions = document.getElementById('dm-type-options');
  const dmSpecificOptionsContainer = document.getElementById('dm-specific-options-container');
  const dmSpecificSelect = document.getElementById('dm-specific-select');
  const dmCustomContainer = document.getElementById('dm-custom-container');
  const dmCustomInput = document.getElementById('dm-custom-input');
  const dmRefInput = document.getElementById('dm-ref-input');
  const dmRefUploadBox = document.getElementById('dm-ref-upload-box');
  const dmRefPreview = document.getElementById('dm-ref-preview');
  const dmRefPlaceholder = document.getElementById('dm-ref-placeholder');
  const dmRefRemoveBtn = document.getElementById('dm-ref-remove-btn');
  const dmRatioOptions = document.getElementById('dm-ratio-options');
  const dmGenerateBtn = document.getElementById('dm-generate-btn');
  const dmResultsContainer = document.getElementById('dm-results-container');
  const dmResultsGrid = document.getElementById('dm-results-grid');
  let dmImageData = null;
  let dmRefData = null;
  const mockupCategories = {
    produk: {
      label: "Mockup Produk",
      options: ["T-shirt (Kaos)", "Hoodie", "Topi Baseball", "Smartphone Screen", "Laptop Screen"]
    },
    kemasan: {
      label: "Mockup Kemasan",
      options: ["Kotak Produk (Product Box)", "Kantong Kopi (Coffee Pouch)", "Botol Minuman", "Kaleng Soda", "Paper Cup"]
    },
    cetak: {
      label: "Mockup Cetak",
      options: ["Poster di Dinding", "Kartu Nama", "Brosur/Flyer", "Halaman Majalah", "Buku (Book Cover)"]
    },
    branding: {
      label: "Mockup Branding",
      options: ["Mug Keramik", "Tote Bag", "Pena (Ballpoint)", "Stempel di Kertas", "Logo di Dinding Kantor"]
    },
    digital: {
      label: "Mockup Digital",
      options: ["Tampilan Website di iMac", "Tampilan Aplikasi di iPhone", "Tampilan Website di Tablet", "Tampilan UI di beberapa perangkat (Responsive)"]
    },
    sosmed: {
      label: "Mockup Media Sosial",
      options: ["Postingan Instagram di Layar HP", "Profil Facebook di Laptop", "Iklan Cerita (Story Ad)", "Thumbnail Video YouTube"]
    },
    lingkungan: {
      label: "Mockup Lingkungan",
      options: ["Papan Iklan (Billboard) di Kota", "Poster di Halte Bus", "Logo 3D di Fasad Gedung", "Spanduk di Jalan Raya", "Layar Iklan Digital di Perkotaan"]
    }
  };

  function populateMockupDropdown(category) {
    const categoryData = mockupCategories[category];
    if (!categoryData) {
      dmSpecificSelect.innerHTML = '<option value="">Pilih kategori valid</option>';
      return;
    }
    dmSpecificSelect.innerHTML = categoryData.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    dmUpdateButtons();
  }

  function dmUpdateButtons() {
    const hasImage = !!dmImageData;
    const category = dmTypeOptions.querySelector('.selected')?.dataset.category;
    let typeOk = false;
    if (category === 'kustom') {
      typeOk = dmCustomInput.value.trim() !== '' || !!dmRefData;
    } else {
      typeOk = !!dmSpecificSelect.value;
    }
    dmGenerateBtn.disabled = !hasImage || !typeOk;
  }

  setupImageUpload(dmImageInput, dmUploadBox, (data) => {
    dmImageData = data;
    dmPreview.src = data.dataUrl;
    dmPlaceholder.classList.add('hidden');
    dmPreview.classList.remove('hidden');
    dmRemoveBtn.classList.remove('hidden');
    dmUpdateButtons();
  });
  dmRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dmImageData = null;
    dmImageInput.value = '';
    dmPreview.src = '#';
    dmPreview.classList.add('hidden');
    dmPlaceholder.classList.remove('hidden');
    dmRemoveBtn.classList.add('hidden');
    document.getElementById('dm-results-placeholder').classList.remove('hidden');
    dmResultsContainer.classList.add('hidden');
    dmResultsGrid.innerHTML = '';
    dmUpdateButtons();
  });
  setupImageUpload(dmRefInput, dmRefUploadBox, (data) => {
    dmRefData = data;
    dmRefPreview.src = data.dataUrl;
    dmRefPlaceholder.classList.add('hidden');
    dmRefPreview.classList.remove('hidden');
    dmRefRemoveBtn.classList.remove('hidden');
    dmUpdateButtons();
  });
  dmRefRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dmRefData = null;
    dmRefInput.value = '';
    dmRefPreview.src = '#';
    dmRefPreview.classList.add('hidden');
    dmRefPlaceholder.classList.remove('hidden');
    dmRefRemoveBtn.classList.add('hidden');
    dmUpdateButtons();
  });
  dmTypeOptions.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    dmTypeOptions.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    const category = button.dataset.category;
    const isKustom = category === 'kustom';
    dmCustomContainer.classList.toggle('hidden', !isKustom);
    dmSpecificOptionsContainer.classList.toggle('hidden', isKustom);
    if (!isKustom) {
      populateMockupDropdown(category);
    }
    dmUpdateButtons();
  });
  dmSpecificSelect.addEventListener('change', dmUpdateButtons);
  dmCustomInput.addEventListener('input', dmUpdateButtons);
  setupOptionButtons(dmRatioOptions);
  populateMockupDropdown('produk');
  dmGenerateBtn.addEventListener('click', async () => {
    const originalBtnHTML = dmGenerateBtn.innerHTML;
    dmGenerateBtn.disabled = true;
    dmGenerateBtn.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">Membuat Mockup...</span>`;
    document.getElementById('dm-results-placeholder').classList.add('hidden');
    const aspectRatio = dmRatioOptions.querySelector('.selected').dataset.value;
    const aspectClass = getAspectRatioClass(aspectRatio);
    dmResultsContainer.classList.remove('hidden');
    dmResultsGrid.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
      const card = document.createElement('div');
      card.id = `dm-card-${i}`;
      card.className = `card overflow-hidden bg-gray-100 flex items-center justify-center ${aspectClass}`;
      card.innerHTML = `<div class="loader-icon w-8 h-8 rounded-full"></div>`;
      dmResultsGrid.appendChild(card);
    }
    lucide.createIcons();
    const generationPromises = [1, 2, 3, 4].map(i => generateSingleMockupImage(i, aspectRatio));
    await Promise.allSettled(generationPromises);
    dmGenerateBtn.disabled = false;
    dmGenerateBtn.innerHTML = originalBtnHTML;
    lucide.createIcons();
  });

  async function generateSingleMockupImage(id, aspectRatio) {
    const card = document.getElementById(`dm-card-${id}`);
    try {
      const category = dmTypeOptions.querySelector('.selected').dataset.category;
      let prompt;
      let images = [dmImageData];
      if (category === 'kustom') {
        if (dmRefData) {
          prompt = `Create a photorealistic mockup based on the provided reference image (the SECOND image).
                        - Design: Take the design from the FIRST image and apply it to the product shown in the reference image.
                        - CRITICAL: Replicate the style, angle, product, and background of the reference image, but replace the original design with the new one.
                        This is mockup variation number ${id}.`;
          images.push(dmRefData);
        } else {
          const customType = dmCustomInput.value.trim();
          prompt = `Create a photorealistic mockup. The FIRST image is the design to be placed.
                        - Product: The design should be placed on a ${customType}.
                        - Placement: The design must be placed naturally on the product, conforming to its shape, texture, lighting, and shadows.
                        - Scene: The product should be in a clean, professional studio setting with soft lighting, suitable for e-commerce.
                        - DO NOT change the design itself.
                        This is mockup variation number ${id}.`;
        }
      } else {
        const specificMockup = dmSpecificSelect.value;
        prompt = `Create a photorealistic mockup. The FIRST image is the design to be placed.
                        - Product: The design should be placed on a ${specificMockup}.
                        - Placement: The design must be placed naturally on the product, conforming to its shape, texture, lighting, and shadows.
                        - Scene: The product should be in a clean, professional and relevant setting with appropriate lighting.
                        - DO NOT change the design itself.
                        This is mockup variation number ${id}.`;
      }
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
      images.forEach(img => {
        formData.append('images[]', base64ToBlob(img.base64, img.mimeType));
      });
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
      if (!result.success || !result.imageUrl) throw new Error("No image data received from API.");
      const imageUrl = result.imageUrl;
      card.innerHTML = `
                    <img src="${imageUrl}" class="w-full h-full object-cover">
                    <div class="absolute bottom-2 right-2 flex gap-1">
                        <button data-img-src="${imageUrl}" class="view-btn result-action-btn" title="Lihat Gambar"><i data-lucide="eye" class="w-4 h-4"></i></button>
                        <a href="${imageUrl}" download="mockup_${id}.png" class="result-action-btn download-btn" title="Unduh Gambar">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </a>
                    </div>`;
      card.className = `relative rounded-2xl overflow-hidden bg-white border border-slate-200 w-full ${getAspectRatioClass(aspectRatio)}`;
      doneSound.play();
    } catch (error) {
      errorSound.play();
      console.error(`Error for mockup card ${id}:`, error);
      card.innerHTML = `<div class="text-xs text-red-500 p-2 text-center break-all">${error.message}</div>`;
    } finally {
      lucide.createIcons();
    }
  }

  return {
    // Expose functions if needed
  };
};
