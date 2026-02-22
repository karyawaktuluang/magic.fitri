window.initAutoRapi = function ({
                                  document,
                                  setupImageUpload,
                                  setupOptionButtons,
                                  lucide,
                                  API_KEY,
                                  GENERATE_URL,
                                  CHAT_URL,
                                  getApiErrorMessage,
                                  doneSound,
                                  errorSound,
                                  initBeforeAfterSlider,
                                  switchTab
                                }) {
  const arImageInput = document.getElementById('ar-image-input');
  const arUploadBox = document.getElementById('ar-upload-box');
  const arPreview = document.getElementById('ar-preview');
  const arPlaceholder = document.getElementById('ar-placeholder');
  const arRemoveBtn = document.getElementById('ar-remove-btn');
  const arRatioOptions = document.getElementById('ar-ratio-options');
  const arGenerateBtn = document.getElementById('ar-generate-btn');
  const arResultsContainer = document.getElementById('ar-results-container');
  const arDownloadLink = document.getElementById('ar-download-link');
  const arDownloadSection = document.getElementById('ar-download-section');
  const arAnalysisOptions = document.getElementById('ar-analysis-options');
  const arAnalysisStatus = document.getElementById('ar-analysis-status');
  const arAnalysisRefresh = document.getElementById('ar-analysis-refresh');
  const arExtraInput = document.getElementById('ar-extra-input');
  let arImageData = null;
  let arAnalysisList = [];
  let arSelectedAnalysis = [];
  let arAnalysisSummary = '';
  let arAnalysisBusy = false;

  function arUpdateButtons() {
    if (arGenerateBtn) arGenerateBtn.disabled = !arImageData;
  }

  function setArAnalysisStatus(text) {
    if (arAnalysisStatus) arAnalysisStatus.textContent = text;
  }

  function setArAnalysisStatusHtml(html) {
    if (arAnalysisStatus) arAnalysisStatus.innerHTML = html;
  }

  function limitAnalysisWords(text, maxWords) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    return words.slice(0, maxWords).join(' ');
  }

  function renderArAnalysisOptions(list) {
    if (!arAnalysisOptions) return;
    arAnalysisOptions.innerHTML = '';
    arAnalysisList = list || [];
    arSelectedAnalysis = arAnalysisList.length ? [arAnalysisList[0]] : [];
    if (!arAnalysisList.length) {
      setArAnalysisStatus('Tidak ada hasil analisa.');
      return;
    }
    setArAnalysisStatus('Pilih fokus perapihan.');
    arAnalysisList.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn text-xs py-2.5';
      btn.textContent = item;
      if (index === 0) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        if (btn.classList.contains('selected')) {
          btn.classList.remove('selected');
          arSelectedAnalysis = arSelectedAnalysis.filter(value => value !== item);
        } else {
          btn.classList.add('selected');
          arSelectedAnalysis = [...new Set([...arSelectedAnalysis, item])];
        }
      });
      arAnalysisOptions.appendChild(btn);
    });
  }

  function parseArAnalysisText(text) {
    if (!text) return [];
    const trimmed = text.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
      }
    }
    const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
      }
    }
    const lines = trimmed
    .split('\n')
    .map(line => line.replace(/^[\-\*\d\.\)\s]+/, '').trim())
    .filter(Boolean);
    return lines;
  }

  async function analyzeAutoRapi(imageData) {
    if (!imageData || arAnalysisBusy) return;
    arAnalysisBusy = true;
    if (arAnalysisRefresh) arAnalysisRefresh.disabled = true;
    setArAnalysisStatusHtml('<div class="flex items-center gap-2"><div class="loader-icon w-4 h-4 rounded-full"></div><span>Menganalisa kekacauan...</span></div>');
    if (arAnalysisOptions) arAnalysisOptions.innerHTML = '';
    arAnalysisSummary = '';
    try {
      const prompt = `Analisa kekacauan pada gambar ruangan ini. Berikan 4-6 opsi tindakan perapihan singkat dalam bahasa Indonesia.
Return JSON array of strings only, contoh: ["Rapikan ...","Singkirkan ..."].`;
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
      formData.append('prompt', prompt);
      formData.append('images[]', base64ToBlob(imageData.base64, imageData.mimeType), 'ruangan.jpg');
      const response = await fetch(`${CHAT_URL}`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY
        },
        body: formData
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      const result = await response.json();
      const text = (result.success && result.response ? result.response : (result.response || result.candidates?.[0]?.content?.parts?.[0]?.text || '')).trim();
      const suggestions = parseArAnalysisText(text)
      .map(item => limitAnalysisWords(item, 5))
      .slice(0, 6);
      arAnalysisSummary = suggestions.join(' | ');
      renderArAnalysisOptions(suggestions);
    } catch (error) {
      setArAnalysisStatus('Gagal menganalisa kekacauan.');
    } finally {
      arAnalysisBusy = false;
      if (arAnalysisRefresh) arAnalysisRefresh.disabled = false;
    }
  }

  function arSetImage(data) {
    arImageData = data;
    arPreview.onload = () => {
      const width = arPreview.naturalWidth;
      const height = arPreview.naturalHeight;
      const ratio = width / height;
      const ratios = [
        {name: '1:1', value: 1.0},
        {name: '3:4', value: 0.75},
        {name: '4:3', value: 1.3333},
        {name: '9:16', value: 0.5625},
        {name: '16:9', value: 1.7778}
      ];
      let closest = ratios[0];
      let minDiff = Math.abs(ratio - closest.value);
      for (let i = 1; i < ratios.length; i++) {
        const diff = Math.abs(ratio - ratios[i].value);
        if (diff < minDiff) {
          minDiff = diff;
          closest = ratios[i];
        }
      }
      const buttons = arRatioOptions.querySelectorAll('.option-btn');
      buttons.forEach(btn => {
        if (btn.dataset.value === closest.name) {
          btn.classList.add('selected');
        } else {
          btn.classList.remove('selected');
        }
      });
    };
    arPreview.src = data.dataUrl;
    arPlaceholder.classList.add('hidden');
    arPreview.classList.remove('hidden');
    arRemoveBtn.classList.remove('hidden');
    arUpdateButtons();
    analyzeAutoRapi(data);
  }

  if (arImageInput) {
    setupImageUpload(arImageInput, arUploadBox, arSetImage);
  }
  if (arRemoveBtn) {
    arRemoveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      arImageData = null;
      arImageInput.value = '';
      arPreview.src = '#';
      arPreview.classList.add('hidden');
      arPlaceholder.classList.remove('hidden');
      arRemoveBtn.classList.add('hidden');
      arUpdateButtons();
      renderArAnalysisOptions([]);
      arAnalysisSummary = '';
      setArAnalysisStatus('Belum dianalisa.');
    });
  }
  setupOptionButtons(arRatioOptions);
  if (arAnalysisRefresh) {
    arAnalysisRefresh.addEventListener('click', () => analyzeAutoRapi(arImageData));
  }
  const arRefineBtn = document.getElementById('ar-refine-btn');

  async function generateTidyImage(imageData, isRefinement = false) {
    const originalText = isRefinement ? arRefineBtn.innerHTML : arGenerateBtn.innerHTML;
    const btnToDisable = isRefinement ? arRefineBtn : arGenerateBtn;
    btnToDisable.disabled = true;
    btnToDisable.innerHTML = `<div class="loader-icon w-5 h-5 rounded-full"></div><span class="ml-2">${isRefinement ? 'Merapikan Lagi...' : 'Merapikan...'}</span>`;
    try {
      const aspectRatio = arRatioOptions.querySelector('.selected').dataset.value;
      const extraRequest = arExtraInput ? arExtraInput.value.trim() : '';
      const analysisParts = [];
      if (arAnalysisSummary) analysisParts.push(`Analysis insights: ${arAnalysisSummary}.`);
      if (arSelectedAnalysis.length) analysisParts.push(`Focus: ${arSelectedAnalysis.join('; ')}.`);
      if (extraRequest) analysisParts.push(`Additional request: ${extraRequest}.`);
      const analysisText = analysisParts.length ? `\nANALYSIS CONTEXT:\n${analysisParts.join(' ')}` : '';
      const prompt = `Transform this room image into a perfectly clean, tidy, and organized version.${analysisText}
            Task: Perform a deep cleaning and organization.
            ${isRefinement ? 'Focus on FIXING any remaining clutter or weird artifacts from the previous edit. Make it even cleaner and more natural.' : ''}

            CRITICAL EXECUTION STEPS:
            1. AGGRESSIVELY REMOVE loose clutter, trash, clothes, and scattered items.
            2. STRAIGHTEN furniture and bedding.
            3. KEEP key room structure and major furniture identical.
            4. Output a highly photorealistic "After" photo.`;
      let mimeType = imageData.mimeType;
      let base64 = imageData.base64;
      if (!mimeType && imageData.dataUrl) {
        const matches = imageData.dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64 = matches[2];
        }
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
      formData.append('images[]', base64ToBlob(base64, mimeType));
      formData.append('instruction', prompt);
      if (aspectRatio !== 'Auto') {
        formData.append('aspectRatio', aspectRatio);
      }
      const response = await fetch(`${GENERATE_URL}`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY
        },
        body: formData
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      const result = await response.json();
      if (!result.success || !result.imageUrl) throw new Error("Gagal membuat gambar.");
      const resultUrl = result.imageUrl;
      document.getElementById('ar-results-placeholder').classList.add('hidden');
      arResultsContainer.classList.remove('hidden');
      if (aspectRatio && aspectRatio !== 'Auto') {
        arResultsContainer.style.height = 'auto';
        arResultsContainer.style.aspectRatio = aspectRatio.replace(':', '/');
        arResultsContainer.classList.remove('h-[500px]');
        arResultsContainer.classList.remove('flex-grow');
      } else {
        arResultsContainer.style.height = '500px';
        arResultsContainer.style.aspectRatio = 'unset';
        arResultsContainer.classList.add('h-[500px]');
        arResultsContainer.classList.add('flex-grow');
      }
      arDownloadSection.classList.remove('hidden');
      try {
        fetch(resultUrl)
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const b64 = reader.result.split(',')[1];
            arImageData = {mimeType: blob.type, base64: b64, dataUrl: resultUrl};
          };
          reader.readAsDataURL(blob);
        })
        .catch(e => {
          console.warn("Gagal fetch result image untuk refine, fallback ke input asli:", e);
          arImageData = {mimeType: mimeType, base64: base64, dataUrl: resultUrl};
        });
      } catch (e) {
        arImageData = {mimeType: mimeType, base64: base64, dataUrl: resultUrl};
      }
      initBeforeAfterSlider(arResultsContainer, imageData.dataUrl, resultUrl);
      arDownloadLink.href = resultUrl;
      arDownloadLink.download = `auto_rapi_${Date.now()}.png`;
      doneSound.play();
    } catch (error) {
      errorSound.play();
      alert(`${error.message}`);
    } finally {
      btnToDisable.disabled = false;
      btnToDisable.innerHTML = originalText;
      lucide.createIcons();
    }
  }

  if (arGenerateBtn) {
    arGenerateBtn.addEventListener('click', () => {
      if (!arImageData) return;
      generateTidyImage(arImageData, false);
    });
  }
  if (arRefineBtn) {
    arRefineBtn.addEventListener('click', () => {
      if (!arImageData) return;
      generateTidyImage(arImageData, true);
    });
  }
  return {
    arSetImage
  };
}
