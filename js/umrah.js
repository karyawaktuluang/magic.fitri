window.initUmrah = function ({
                               document,
                               setupImageUpload,
                               setupOptionButtons,
                               generatePhotographerImage
                             }) {
  const sfUmrahInput = document.getElementById('sf-umrah-input');
  const sfUmrahUploadBox = document.getElementById('sf-umrah-upload-box');
  const sfUmrahPreview = document.getElementById('sf-umrah-preview');
  const sfUmrahPlaceholder = document.getElementById('sf-umrah-placeholder');
  const sfUmrahRemoveBtn = document.getElementById('sf-umrah-remove-btn');
  const sfUmrahGenerateBtn = document.getElementById('sf-umrah-generate-btn');
  let sfUmrahData = {data: null, isValid: false};

  function sfUmrahUpdateBtn() {
    if (sfUmrahGenerateBtn) sfUmrahGenerateBtn.disabled = !sfUmrahData.isValid;
  }

  if (sfUmrahInput && sfUmrahUploadBox) {
    setupImageUpload(sfUmrahInput, sfUmrahUploadBox, async (data) => {
      sfUmrahData.data = data;
      if (sfUmrahPreview) sfUmrahPreview.src = data.dataUrl;
      if (sfUmrahPlaceholder) sfUmrahPlaceholder.classList.add('hidden');
      if (sfUmrahPreview) sfUmrahPreview.classList.remove('hidden');
      if (sfUmrahRemoveBtn) sfUmrahRemoveBtn.classList.remove('hidden');
      sfUmrahData.isValid = true;
      sfUmrahUpdateBtn();
    });
  }
  if (sfUmrahRemoveBtn) {
    sfUmrahRemoveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfUmrahData = {data: null, isValid: false};
      if (sfUmrahInput) sfUmrahInput.value = '';
      if (sfUmrahPreview) {
        sfUmrahPreview.src = '#';
        sfUmrahPreview.classList.add('hidden');
      }
      if (sfUmrahPlaceholder) sfUmrahPlaceholder.classList.remove('hidden');
      sfUmrahRemoveBtn.classList.add('hidden');
      sfUmrahUpdateBtn();
      const resultsPlaceholder = document.getElementById('sf-umrah-results-placeholder');
      if (resultsPlaceholder) resultsPlaceholder.classList.remove('hidden');
      const resultsContainer = document.getElementById('sf-umrah-results-container');
      if (resultsContainer) resultsContainer.classList.add('hidden');
      const resultsGrid = document.getElementById('sf-umrah-results-grid');
      if (resultsGrid) resultsGrid.innerHTML = '';
    });
  }
  setupOptionButtons(document.getElementById('sf-umrah-gender-options'));
  setupOptionButtons(document.getElementById('sf-umrah-attire-options'));
  setupOptionButtons(document.getElementById('sf-umrah-ratio-options'));
  setupOptionButtons(document.getElementById('sf-umrah-theme-options'));
  if (sfUmrahGenerateBtn) {
    sfUmrahGenerateBtn.addEventListener('click', () => {
      const resultsPlaceholder = document.getElementById('sf-umrah-results-placeholder');
      if (resultsPlaceholder) resultsPlaceholder.classList.add('hidden');
      let gender = 'Laki-laki';
      const genderSelected = document.querySelector('#sf-umrah-gender-options .selected');
      if (genderSelected) gender = genderSelected.dataset.value;
      let attire = 'pakaian Ihram putih yang sesuai';
      const attireSelected = document.querySelector('#sf-umrah-attire-options .selected');
      if (attireSelected) attire = attireSelected.dataset.value;
      let aspectRatio = '1:1';
      const ratioSelected = document.querySelector('#sf-umrah-ratio-options .selected');
      if (ratioSelected) aspectRatio = ratioSelected.dataset.value;
      let theme = 'Gaya pemotretan modern & profesional...';
      const themeSelected = document.querySelector('#sf-umrah-theme-options .selected');
      if (themeSelected) theme = themeSelected.dataset.value;
      let prompt = `Create a professional photo of the person from the image, placed into an Umrah/Hajj setting. CRITICAL: Preserve the person's exact face and features. The person is a ${gender} and should be wearing ${attire}. Scene: ${theme}. The final photo should be high-quality, realistic, and respectful.`;
      generatePhotographerImage('umrah', prompt, sfUmrahData.data, aspectRatio);
    });
  }

  function setUmrahImageData(data) {
    sfUmrahData.data = data;
    if (sfUmrahPreview) sfUmrahPreview.src = data.dataUrl;
    if (sfUmrahPlaceholder) sfUmrahPlaceholder.classList.add('hidden');
    if (sfUmrahPreview) sfUmrahPreview.classList.remove('hidden');
    if (sfUmrahRemoveBtn) sfUmrahRemoveBtn.classList.remove('hidden');
    sfUmrahData.isValid = true;
    sfUmrahUpdateBtn();
  }

  return {setUmrahImageData};
};
