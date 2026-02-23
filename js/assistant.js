// Assistant Logic
var assistantModal = document.getElementById('assistant-modal');
var chatContainer = document.getElementById('chat-container');
var chatInput = document.getElementById('chat-input');
var chatFileInput = document.getElementById('chat-file-input');
var chatImagePreviewContainer = document.getElementById('chat-image-preview-container');
var chatImagePreview = document.getElementById('chat-image-preview');
var chatSendBtn = document.getElementById('chat-send-btn');
var chatImageBtn = document.getElementById('chat-image-btn');
var voiceMicBtn = document.getElementById('voice-mic-btn');
var voiceUi = document.getElementById('voice-ui');
var voiceOrb = document.getElementById('voice-orb');
var voiceStatus = document.getElementById('voice-status');
var voiceStatusText = document.getElementById('voice-status-text');
var voiceStatusIcon = document.getElementById('voice-status-icon');
// Audio Objects
var aiResponseAudio = new Audio('https://cdn.jsdelivr.net/gh/karyawaktuluang/magic.fitri@main/assets/chat.mp3');
var currentChatImage = null; // Store File object
var currentMode = null; // 'chat' or 'image'
var voiceRecognizer = null;
var isVoiceListening = false;
var isVoiceStarting = false;
var ttsAudio = null;
var CHAT_HISTORY_KEY = 'sulapfitri_sufi_history';
var CHAT_HISTORY_LIMIT = 24;

function loadChatHistory() {
  try {
    var raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function (item) {
      return item && typeof item === 'object' && typeof item.text === 'string' && item.text.trim() !== '';
    });
  } catch (e) {
    return [];
  }
}

function saveChatHistory(items) {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(items));
  } catch (e) {
  }
}

function addChatHistory(role, text) {
  var normalized = (text || '').trim();
  if (!normalized) return;
  var items = loadChatHistory();
  items.push({
    role: role === 'user' ? 'user' : 'assistant',
    text: normalized,
    mode: currentMode || 'unknown',
    ts: Date.now()
  });
  if (items.length > CHAT_HISTORY_LIMIT) {
    items = items.slice(items.length - CHAT_HISTORY_LIMIT);
  }
  saveChatHistory(items);
}

function buildContextLines(currentText) {
  var items = loadChatHistory();
  if (items.length && currentText) {
    var last = items[items.length - 1];
    if (last && last.role === 'user' && last.text === currentText) {
      items = items.slice(0, -1);
    }
  }
  return items.map(function (item) {
    var label = item.role === 'user' ? 'User' : 'Assistant';
    return label + ': ' + item.text;
  });
}

function buildChatPrompt(currentText) {
  var lines = buildContextLines(currentText);
  var contextBlock = lines.length ? 'Riwayat percakapan:\n' + lines.join('\n') + '\n\n' : '';
  var systemPrompt = "Anda adalah Sufi, asisten AI yang cerdas dan ramah yang dibuat oleh IchsanLabs. Gunakan Bahasa Indonesia yang sopan. Batasi jawaban maksimal 50 kata. Tidak perlu menjelaskan itu semua kecuali ditanya\n\n";
  return systemPrompt + contextBlock + 'User: ' + currentText;
}

function buildRefinePrompt(template, currentText) {
  var lines = buildContextLines(currentText);
  var contextBlock = lines.length ? 'Context percakapan:\n' + lines.join('\n') + '\n\n' : '';
  return contextBlock + template.replace('{text}', currentText);
}

function selectMode(mode) {
  currentMode = mode;
  // UI Toggles
  document.getElementById('mode-selection').classList.add('hidden');
  document.getElementById('chat-messages-container').classList.remove('hidden');
  document.getElementById('input-area').classList.remove('hidden');
  document.getElementById('switch-mode-btn').classList.remove('hidden');
  // Color Updates
  const modal = document.getElementById('assistant-modal');
  modal.classList.remove('mode-chat-theme', 'mode-image-theme', 'mode-voice-theme');
  // Manage Chat Containers
  const chatChat = document.getElementById('chat-messages-chat');
  const chatImage = document.getElementById('chat-messages-image');
  if (mode === 'chat') {
    modal.classList.add('mode-chat-theme');
    chatChat.classList.remove('hidden');
    chatImage.classList.add('hidden');
    if (voiceUi) voiceUi.classList.add('hidden');
    document.getElementById('chat-messages-container').classList.remove('hidden');
    document.getElementById('input-area').classList.remove('hidden');
    chatInput.readOnly = false;
    chatInput.placeholder = "Ketik pesan...";
    chatSendBtn.classList.remove('hidden');
    chatImageBtn.classList.remove('hidden');
    chatFileInput.disabled = false;
    if (chatChat.innerHTML.trim() === '') {
      appendMessage('bot', "Assalamualaikum! Saya siap menjawab pertanyaan seputar Ramadhan. Apa yang ingin ditanyakan?");
    }
    setVoiceSpeaking(false);
  } else if (mode === 'voice') {
    modal.classList.add('mode-voice-theme');
    chatChat.classList.add('hidden');
    chatImage.classList.add('hidden');
    if (voiceUi) voiceUi.classList.remove('hidden');
    document.getElementById('chat-messages-container').classList.add('hidden');
    document.getElementById('input-area').classList.add('hidden');
    chatInput.readOnly = true;
    chatInput.placeholder = "Tekan mic lalu bicara...";
    chatSendBtn.classList.add('hidden');
    chatImageBtn.classList.add('hidden');
    chatFileInput.disabled = true;
    clearChatImage();
    setVoiceStatus('idle', 'Tekan mic untuk mulai');
    setupVoiceRecognition();
  } else {
    modal.classList.add('mode-image-theme');
    chatImage.classList.remove('hidden');
    chatChat.classList.add('hidden');
    if (voiceUi) voiceUi.classList.add('hidden');
    document.getElementById('chat-messages-container').classList.remove('hidden');
    document.getElementById('input-area').classList.remove('hidden');
    chatInput.readOnly = false;
    chatInput.placeholder = "Ketik pesan...";
    chatSendBtn.classList.remove('hidden');
    chatImageBtn.classList.remove('hidden');
    chatFileInput.disabled = false;
    // Initial Message if empty
    if (chatImage.innerHTML.trim() === '') {
      appendMessage('bot', "Mode Kreatif Aktif! Silakan tulis deskripsi gambar yang ingin dibuat atau upload foto untuk diedit.");
    }
    setVoiceSpeaking(false);
  }
  // Focus input
  if (mode !== 'voice') {
    chatInput.focus();
  }
  // Scroll to bottom of active container
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function switchMode() {
  currentMode = null;
  document.getElementById('mode-selection').classList.remove('hidden');
  document.getElementById('chat-messages-container').classList.add('hidden');
  document.getElementById('input-area').classList.add('hidden');
  document.getElementById('switch-mode-btn').classList.add('hidden');
  if (voiceUi) voiceUi.classList.add('hidden');
  // Reset Theme
  const modal = document.getElementById('assistant-modal');
  modal.classList.remove('mode-chat-theme', 'mode-image-theme', 'mode-voice-theme');
  stopVoiceRecognition();
  setVoiceSpeaking(false);
  setVoiceStatus('idle', 'Tekan mic untuk mulai');
}

function openAssistantModal() {
  window.showFeaturePage('assistant-modal');
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
  if (currentMode !== 'voice') {
    chatInput.focus();
  }
}

function closeAssistantModal() {
  stopVoiceRecognition();
  setVoiceSpeaking(false);
  setVoiceStatus('idle', 'Tekan mic untuk mulai');
  window.closeFeaturePage('assistant-modal');
}

window.openAssistantModal = openAssistantModal;
window.closeAssistantModal = closeAssistantModal;
window.selectMode = selectMode;
window.switchMode = switchMode;
window.sendChatMessage = sendChatMessage;
// Auto-resize textarea
chatInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  if (this.value === '') this.style.height = 'auto';
});
// Enter to send
chatInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (currentMode === 'voice') return;
    e.preventDefault();
    sendChatMessage();
  }
});
// File Handling
chatFileInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    currentChatImage = file;
    const reader = new FileReader();
    reader.onload = function (e) {
      chatImagePreview.src = e.target.result;
      chatImagePreviewContainer.classList.remove('hidden');
    }
    reader.readAsDataURL(file);
  }
});

function clearChatImage() {
  currentChatImage = null;
  chatFileInput.value = '';
  chatImagePreview.src = '';
  chatImagePreviewContainer.classList.add('hidden');
}

// Simple Markdown Parser
function parseMarkdown(text) {
  if (!text) return '';
  let html = text
  // Code blocks
  .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  // Inline code
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  // Bold **text**
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic *text*
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Bullet points
  .replace(/(?:^|\n)- (.*)/g, '<br>• $1')
  // Convert remaining newlines to <br>
  .replace(/\n/g, '<br>');
  return html;
}

function appendMessage(role, text, imageUrl = null) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${role}`;
  // Parse Markdown for bot messages only (security + feature)
  let contentHtml = role === 'bot' ? parseMarkdown(text) : text.replace(/\n/g, '<br>');
  if (imageUrl) {
    const safeUrl = String(imageUrl);
    const safeAttrUrl = safeUrl.replace(/"/g, '&quot;');
    const safeOnclickUrl = safeUrl.replace(/'/g, "\\'");
    if (role === 'bot' && currentMode === 'image') {
      const downloadName = `sufi-image-${Date.now()}.png`;
      contentHtml += `
                <div style="position: relative; display: inline-block; margin-top: 8px;">
                    <img src="${safeAttrUrl}" class="chat-image-attachment" onclick="window.openImagePreview('${safeOnclickUrl}')" style="cursor:pointer;">
                    <a href="${safeAttrUrl}" download="${downloadName}" style="position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px; border-radius: 999px; background: rgba(0,0,0,0.6); color: white; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                        <i class="fas fa-download" style="font-size: 0.85rem;"></i>
                    </a>
                </div>
            `;
    } else {
      contentHtml += `<br><img src="${safeAttrUrl}" class="chat-image-attachment" onclick="window.openImagePreview('${safeOnclickUrl}')" style="cursor:pointer;">`;
    }
  }
  // Play AI sound for bot messages
  if (role === 'bot' && currentMode !== 'voice') {
    aiResponseAudio.currentTime = 0;
    aiResponseAudio.play().catch(e => console.log('Audio play blocked:', e));
  }
  msgDiv.innerHTML = `<div class="message-content">${contentHtml}</div>`;
  // Append to correct container based on mode
  const targetContainerId = currentMode === 'image' ? 'chat-messages-image' : 'chat-messages-chat';
  const targetContainer = document.getElementById(targetContainerId);
  if (targetContainer) {
    targetContainer.appendChild(msgDiv);
  }
  chatContainer.scrollTop = chatContainer.scrollHeight;
  if (role === 'user' || role === 'bot') {
    addChatHistory(role === 'user' ? 'user' : 'assistant', text);
  }
}

function showTypingIndicator(text = null) {
  const id = 'typing-' + Date.now();
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message bot`;
  msgDiv.id = id;
  let content = '';
  if (text) {
    content = `<div style="display:flex; align-items:center; gap:8px;"><span>${text}</span><div class="typing-indicator" style="display:inline-flex; margin:0;"><span></span><span></span><span></span></div></div>`;
  } else {
    content = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
  }
  msgDiv.innerHTML = `<div class="message-content">${content}</div>`;
  // Append to correct container based on mode
  const targetContainerId = currentMode === 'image' ? 'chat-messages-image' : 'chat-messages-chat';
  const targetContainer = document.getElementById(targetContainerId);
  if (targetContainer) {
    targetContainer.appendChild(msgDiv);
  }
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return id;
}

function updateTypingIndicator(id, text) {
  const el = document.getElementById(id);
  if (el) {
    const contentDiv = el.querySelector('.message-content');
    if (contentDiv) {
      contentDiv.innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><span>${text}</span><div class="typing-indicator" style="display:inline-flex; margin:0;"><span></span><span></span><span></span></div></div>`;
    }
  }
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showAnsweredStatus(id) {
  if (!id) return;
  updateTypingIndicator(id, "SuFi sudah mendapatkan jawaban...");
  await wait(700);
  removeTypingIndicator(id);
}

function setInputState(disabled) {
  chatInput.disabled = disabled;
  chatSendBtn.disabled = disabled;
  chatFileInput.disabled = disabled;
  if (voiceMicBtn) voiceMicBtn.disabled = disabled;
  // Optional: Visual feedback
  if (disabled) {
    chatInput.parentElement.style.opacity = '0.5';
    chatSendBtn.style.opacity = '0.5';
  } else {
    chatInput.parentElement.style.opacity = '1';
    chatSendBtn.style.opacity = '1';
    chatInput.focus();
  }
}

function setupVoiceRecognition() {
  if (voiceRecognizer) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendMessage('bot', "Browser tidak mendukung fitur mic. Coba gunakan Chrome.");
    if (voiceMicBtn) voiceMicBtn.disabled = true;
    return;
  }
  voiceRecognizer = new SpeechRecognition();
  voiceRecognizer.lang = 'id-ID';
  voiceRecognizer.interimResults = false;
  voiceRecognizer.continuous = false;
  voiceRecognizer.onstart = function () {
    isVoiceStarting = false;
    setVoiceListening(true);
  };
  voiceRecognizer.onend = function () {
    isVoiceStarting = false;
    setVoiceListening(false);
  };
  voiceRecognizer.onerror = function () {
    isVoiceStarting = false;
    setVoiceListening(false);
    appendMessage('bot', "Mic bermasalah. Coba izinkan akses mikrofon.");
  };
  voiceRecognizer.onresult = function (event) {
    const result = event.results && event.results[0] && event.results[0][0];
    const transcript = result ? result.transcript.trim() : '';
    if (transcript) {
      stopVoiceRecognition();
      chatInput.value = transcript;
      sendVoiceMessage(transcript);
    }
  };
}

function setVoiceListening(listening) {
  isVoiceListening = listening;
  if (voiceOrb) {
    if (listening) {
      voiceOrb.classList.add('is-listening');
    } else {
      voiceOrb.classList.remove('is-listening');
    }
  }
  if (!voiceMicBtn) return;
  const icon = voiceMicBtn.querySelector('i');
  if (icon) {
    icon.className = listening ? 'fas fa-stop' : 'fas fa-microphone';
  }
}

function setVoiceStatus(state, text) {
  if (!voiceStatus || !voiceStatusText || !voiceStatusIcon) return;
  if (currentMode !== 'voice') return;
  const stateClasses = ['is-idle', 'is-thinking', 'is-answered', 'is-starting', 'is-speaking'];
  voiceStatus.classList.remove(...stateClasses);
  const nextState = state ? `is-${state}` : 'is-idle';
  voiceStatus.classList.add(nextState);
  if (text) {
    voiceStatusText.textContent = text;
  }
  let iconClass = 'fas fa-microphone';
  if (state === 'thinking') iconClass = 'fas fa-brain';
  if (state === 'answered') iconClass = 'fas fa-check-circle';
  if (state === 'starting') iconClass = 'fas fa-circle-notch';
  if (state === 'speaking') iconClass = 'fas fa-volume-up';
  voiceStatusIcon.className = `voice-status-icon ${iconClass}`;
}

function setVoiceSpeaking(speaking) {
  if (!voiceOrb) return;
  if (currentMode !== 'voice') {
    voiceOrb.classList.remove('is-speaking');
    return;
  }
  if (speaking) {
    voiceOrb.classList.add('is-speaking');
  } else {
    voiceOrb.classList.remove('is-speaking');
  }
  if (voiceMicBtn) {
    voiceMicBtn.disabled = speaking;
  }
  if (!voiceMicBtn || isVoiceListening) return;
  const icon = voiceMicBtn.querySelector('i');
  if (!icon) return;
  icon.className = speaking ? 'fas fa-volume-up' : 'fas fa-microphone';
}

function bindTtsEvents(audio, onStop, onPlay) {
  if (!audio) return;
  const stop = function () {
    setVoiceSpeaking(false);
    if (onStop) onStop();
  };
  audio.addEventListener('ended', stop);
  audio.addEventListener('error', stop);
  audio.addEventListener('pause', stop);
  audio.addEventListener('playing', function () {
    setVoiceSpeaking(true);
    if (onPlay) onPlay();
  });
}

function stopVoiceRecognition() {
  if (voiceRecognizer && isVoiceListening) {
    voiceRecognizer.stop();
  }
  isVoiceStarting = false;
  setVoiceListening(false);
}

if (voiceMicBtn) {
  voiceMicBtn.addEventListener('click', function () {
    if (!voiceRecognizer) setupVoiceRecognition();
    if (!voiceRecognizer) return;
    if (isVoiceListening) {
      voiceRecognizer.stop();
    } else {
      if (isVoiceStarting) return;
      try {
        isVoiceStarting = true;
        setVoiceStatus('starting', 'User menyalakan mikrofon...');
        voiceRecognizer.start();
      } catch (e) {
        isVoiceStarting = false;
      }
    }
  });
}

function playTtsAudio(audioUrl, onStop, onPlay) {
  if (!audioUrl) return;
  if (ttsAudio) {
    ttsAudio.pause();
    ttsAudio.currentTime = 0;
  }
  ttsAudio = new Audio(audioUrl);
  bindTtsEvents(ttsAudio, onStop, onPlay);
  setVoiceSpeaking(true);
  ttsAudio.play().catch(function () {
  });
}

function playTtsBlob(blob, onStop, onPlay) {
  if (!blob) return;
  if (ttsAudio) {
    ttsAudio.pause();
    ttsAudio.currentTime = 0;
  }
  const audioUrl = URL.createObjectURL(blob);
  ttsAudio = new Audio(audioUrl);
  bindTtsEvents(ttsAudio, onStop, onPlay);
  setVoiceSpeaking(true);
  const revoke = function () {
    URL.revokeObjectURL(audioUrl);
  };
  ttsAudio.addEventListener('ended', revoke);
  ttsAudio.addEventListener('error', revoke);
  ttsAudio.play().catch(function () {
  });
}

function playTtsBase64(base64, mimeType, onStop, onPlay) {
  if (!base64) return;
  try {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], {type: mimeType || 'audio/mpeg'});
    playTtsBlob(blob, onStop, onPlay);
  } catch (e) {
  }
}

function isPcmMimeType(mimeType) {
  if (!mimeType) return false;
  return /audio\/l16/i.test(mimeType) || /codec=pcm/i.test(mimeType);
}

function parsePcmDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  if (!dataUrl.startsWith('data:')) return null;
  const parts = dataUrl.split(',');
  if (parts.length < 2) return null;
  const meta = parts[0];
  const base64 = parts.slice(1).join(',');
  const rateMatch = meta.match(/rate=(\d+)/i);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  const mimeType = meta.slice(5).split(';')[0];
  return {base64, sampleRate, mimeType};
}

function buildWavBlobFromPcm(pcmBytes, sampleRate) {
  if (!pcmBytes || !pcmBytes.length) return null;
  const rate = sampleRate || 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = rate * blockAlign;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const writeString = function (offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  return new Blob([buffer, pcmBytes], {type: 'audio/wav'});
}

function playPcmBase64AsWav(base64, sampleRate, onStop, onPlay) {
  if (!base64) return;
  try {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = buildWavBlobFromPcm(bytes, sampleRate);
    if (blob) playTtsBlob(blob, onStop, onPlay);
  } catch (e) {
  }
}

function playPcmBufferAsWav(arrayBuffer, sampleRate, onStop, onPlay) {
  if (!arrayBuffer) return;
  const bytes = new Uint8Array(arrayBuffer);
  const blob = buildWavBlobFromPcm(bytes, sampleRate);
  if (blob) playTtsBlob(blob, onStop, onPlay);
}

function resolveBaseUrl(value) {
  if (!value || typeof value !== 'string') return '';
  let next = value.trim();
  if (!next) return '';
  if (!/^https?:\/\//i.test(next)) {
    next = `https://${next}`;
  }
  return next.replace(/\/+$/, '');
}

async function requestTtsAudio(text) {
  if (!text) return;
  const ttsUrl = 'server/tts.php';
  const isVoiceMode = currentMode === 'voice';
  const ttsStatusId = isVoiceMode ? null : showTypingIndicator("SuFi sedang menyalakan mikrofon...");
  if (isVoiceMode) {
    setVoiceStatus('starting', 'SuFi menyalakan mikrofon...');
  }
  let ttsRes = null;
  try {
    ttsRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        prompt: text,
        voiceName: 'Fenrir'
      })
    });
  } catch (error) {
    if (ttsStatusId) removeTypingIndicator(ttsStatusId);
    setVoiceStatus('idle', 'Tekan mic untuk mulai');
    appendMessage('bot', "Maaf, suara belum tersedia.");
    return;
  }
  const contentType = (ttsRes.headers.get('content-type') || '').toLowerCase();
  if (ttsRes.ok && (contentType.includes('audio/') || contentType.includes('application/octet-stream'))) {
    if (isPcmMimeType(contentType)) {
      const arrayBuffer = await ttsRes.arrayBuffer();
      const rateMatch = contentType.match(/rate=(\d+)/i);
      const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      playPcmBufferAsWav(arrayBuffer, sampleRate, function () {
        if (ttsStatusId) removeTypingIndicator(ttsStatusId);
        setVoiceStatus('idle', 'Tekan mic untuk mulai');
      }, function () {
        if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
        if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      });
      return;
    }
    const blob = await ttsRes.blob();
    if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
    if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
    playTtsBlob(blob, function () {
      if (ttsStatusId) removeTypingIndicator(ttsStatusId);
      setVoiceStatus('idle', 'Tekan mic untuk mulai');
    }, function () {
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
    });
    return;
  }
  let ttsData = null;
  try {
    ttsData = await ttsRes.json();
  } catch (e) {
  }
  if (!ttsRes.ok) {
    if (ttsStatusId) removeTypingIndicator(ttsStatusId);
    setVoiceStatus('idle', 'Tekan mic untuk mulai');
    appendMessage('bot', "Maaf, suara belum tersedia.");
    return;
  }
  if (ttsData && ttsData.audioUrl) {
    const parsedPcm = parsePcmDataUrl(ttsData.audioUrl);
    if (parsedPcm && isPcmMimeType(parsedPcm.mimeType)) {
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      playPcmBase64AsWav(parsedPcm.base64, parsedPcm.sampleRate, function () {
        if (ttsStatusId) removeTypingIndicator(ttsStatusId);
        setVoiceStatus('idle', 'Tekan mic untuk mulai');
      }, function () {
        if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
        if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      });
      return;
    }
    if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
    if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
    playTtsAudio(ttsData.audioUrl, function () {
      if (ttsStatusId) removeTypingIndicator(ttsStatusId);
      setVoiceStatus('idle', 'Tekan mic untuk mulai');
    }, function () {
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
    });
    return;
  }
  const nestedAudioUrl = ttsData && ttsData.audio && ttsData.audio.url;
  if (nestedAudioUrl) {
    const parsedNested = parsePcmDataUrl(nestedAudioUrl);
    if (parsedNested && isPcmMimeType(parsedNested.mimeType)) {
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      playPcmBase64AsWav(parsedNested.base64, parsedNested.sampleRate, function () {
        if (ttsStatusId) removeTypingIndicator(ttsStatusId);
        setVoiceStatus('idle', 'Tekan mic untuk mulai');
      }, function () {
        if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
        if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      });
      return;
    }
    if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
    if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
    playTtsAudio(nestedAudioUrl, function () {
      if (ttsStatusId) removeTypingIndicator(ttsStatusId);
      setVoiceStatus('idle', 'Tekan mic untuk mulai');
    }, function () {
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
    });
    return;
  }
  const base64Audio = ttsData && (ttsData.audioContent || (ttsData.audio && ttsData.audio.data));
  const base64Mime = (ttsData && ttsData.audio && ttsData.audio.mimeType) || 'audio/mpeg';
  if (base64Audio) {
    if (isPcmMimeType(base64Mime)) {
      const rateMatch = base64Mime.match(/rate=(\d+)/i);
      const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      playPcmBase64AsWav(base64Audio, sampleRate, function () {
        if (ttsStatusId) removeTypingIndicator(ttsStatusId);
        setVoiceStatus('idle', 'Tekan mic untuk mulai');
      }, function () {
        if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
        if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      });
    } else {
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      playTtsBase64(base64Audio, base64Mime, function () {
        if (ttsStatusId) removeTypingIndicator(ttsStatusId);
        setVoiceStatus('idle', 'Tekan mic untuk mulai');
      }, function () {
        if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
        if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      });
    }
    return;
  }
  const inlineData = ttsData && ttsData.candidates && ttsData.candidates[0] && ttsData.candidates[0].content && ttsData.candidates[0].content.parts && ttsData.candidates[0].content.parts[0] && ttsData.candidates[0].content.parts[0].inlineData;
  if (inlineData && inlineData.data) {
    const inlineMime = inlineData.mimeType || 'audio/mpeg';
    if (isPcmMimeType(inlineMime)) {
      const rateMatch = inlineMime.match(/rate=(\d+)/i);
      const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      playPcmBase64AsWav(inlineData.data, sampleRate, function () {
        if (ttsStatusId) removeTypingIndicator(ttsStatusId);
        setVoiceStatus('idle', 'Tekan mic untuk mulai');
      }, function () {
        if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
        if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      });
    } else {
      if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
      if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      playTtsBase64(inlineData.data, inlineMime, function () {
        if (ttsStatusId) removeTypingIndicator(ttsStatusId);
        setVoiceStatus('idle', 'Tekan mic untuk mulai');
      }, function () {
        if (ttsStatusId) updateTypingIndicator(ttsStatusId, "SuFi sedang berbicara...");
        if (isVoiceMode) setVoiceStatus('speaking', 'SuFi menjawab...');
      });
    }
    return;
  }
  if (ttsStatusId) removeTypingIndicator(ttsStatusId);
  setVoiceStatus('idle', 'Tekan mic untuk mulai');
  appendMessage('bot', "Maaf, suara belum tersedia.");
}

async function sendVoiceMessage(text) {
  const transcript = (text || '').trim();
  if (!transcript) return;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  appendMessage('user', transcript);
  setVoiceStatus('thinking', 'SuFi berfikir...');
  setInputState(true);
  const typingId = currentMode === 'voice' ? null : showTypingIndicator("SuFi sedang berfikir...");
  try {
    const formData = new FormData();
    const finalPrompt = buildChatPrompt(transcript);
    formData.append('prompt', finalPrompt);
    const response = await fetch('server/chat.php', {method: 'POST', cache: 'no-store', body: formData});
    const result = await response.json();
    if (result.success || result.response) {
      const reply = result.response || result.candidates?.[0]?.content?.parts?.[0]?.text;
      const replyText = typeof reply === 'string' ? reply.trim() : '';
      if (typingId) await showAnsweredStatus(typingId);
      setVoiceStatus('answered', 'SuFi sudah mendapatkan jawaban...');
      appendMessage('bot', replyText || '');
      if (replyText) {
        await requestTtsAudio(replyText);
      }
    } else {
      if (typingId) removeTypingIndicator(typingId);
      setVoiceStatus('idle', 'Tekan mic untuk mulai');
      appendMessage('bot', "Maaf, saya sedang gangguan. Coba lagi nanti.");
    }
  } catch (error) {
    if (typingId) removeTypingIndicator(typingId);
    setVoiceStatus('idle', 'Tekan mic untuk mulai');
    appendMessage('bot', "Terjadi kesalahan koneksi.");
  } finally {
    setInputState(false);
  }
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text && !currentChatImage) return;
  // Reset Input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  // Display User Message
  let userImageDisplay = null;
  let detectedAspectRatio = '1:1'; // Default
  if (currentChatImage) {
    userImageDisplay = chatImagePreview.src;
    // Calculate Aspect Ratio from the preview image
    if (chatImagePreview.naturalWidth && chatImagePreview.naturalHeight) {
      const w = chatImagePreview.naturalWidth;
      const h = chatImagePreview.naturalHeight;
      const ratio = w / h;
      // Find closest standard ratio
      const standardRatios = {
        '1:1': 1,
        '16:9': 16 / 9,
        '9:16': 9 / 16,
        '4:3': 4 / 3,
        '3:4': 3 / 4,
        '21:9': 21 / 9,
        '9:21': 9 / 21
      };
      let minDiff = Infinity;
      for (const [key, val] of Object.entries(standardRatios)) {
        const diff = Math.abs(ratio - val);
        if (diff < minDiff) {
          minDiff = diff;
          detectedAspectRatio = key;
        }
      }
      console.log(`Detected image ratio: ${w}x${h} (${ratio.toFixed(2)}) -> Closest: ${detectedAspectRatio}`);
    }
  }
  appendMessage('user', text, userImageDisplay);
  // Clear preview but keep file for sending
  const fileToSend = currentChatImage;
  clearChatImage();
  // Disable Input
  setInputState(true);
  // Show Loading
  const typingId = showTypingIndicator();
  if (currentMode !== 'image') {
    updateTypingIndicator(typingId, "SuFi sedang berfikir...");
  }
  try {
    if (currentMode === 'image') {
      // --- IMAGE GENERATION MODE ---
      if (!fileToSend) {
        // Text-to-Image Generation
        updateTypingIndicator(typingId, "Mengoptimalkan prompt...");
        const refineFormData = new FormData();
        refineFormData.append('prompt', buildRefinePrompt('Refine this user request into a high quality image generation prompt (English). User request: "{text}". Output ONLY the prompt.', text));
        const chatRes = await fetch('server/chat.php', {method: 'POST', cache: 'no-store', body: refineFormData});
        const chatData = await chatRes.json();
        const refinedPrompt = chatData.response || text;
        // Show Refined Prompt
        removeTypingIndicator(typingId);
        appendMessage('bot', `**Prompt Teroptimasi:**\n${refinedPrompt}`);
        // Start Generation Loading
        const genTypingId = showTypingIndicator("Sedang membuat gambar...");
        const genFormData = new FormData();
        genFormData.append('instruction', refinedPrompt);
        genFormData.append('aspectRatio', '1:1');
        const genRes = await fetch('server/generate.php', {method: 'POST', cache: 'no-store', body: genFormData});
        const genResult = await genRes.json();
        removeTypingIndicator(genTypingId);
        if (genResult.success && genResult.imageUrl) {
          appendMessage('bot', `Berikut hasil gambarnya:`, genResult.imageUrl);
          if (window.playSuccessSound) window.playSuccessSound();
        } else {
          appendMessage('bot', "Maaf, saya gagal membuat gambar. Pastikan instruksi jelas atau coba upload gambar referensi.");
          if (window.playErrorSound) window.playErrorSound();
        }
      } else {
        // Image-to-Image (Edit/Style Transfer)
        updateTypingIndicator(typingId, "Mengoptimalkan instruksi...");
        const rawInstruction = text || "Enhance this image";
        const refineFormData = new FormData();
        refineFormData.append('prompt', buildRefinePrompt('Refine this user request into a precise image editing instruction (English). User request: "{text}". The user has also provided an image which you can see. Output ONLY the instruction.', rawInstruction));
        refineFormData.append('images[]', fileToSend);
        const chatRes = await fetch('server/chat.php', {method: 'POST', cache: 'no-store', body: refineFormData});
        const chatData = await chatRes.json();
        const refinedInstruction = chatData.response || rawInstruction;
        // Show Refined Instruction
        removeTypingIndicator(typingId);
        appendMessage('bot', `**Instruksi Teroptimasi:**\n${refinedInstruction}`);
        // Start Generation Loading
        const genTypingId = showTypingIndicator("Sedang memproses gambar...");
        const genFormData = new FormData();
        genFormData.append('instruction', refinedInstruction);
        genFormData.append('images[]', fileToSend);
        genFormData.append('aspectRatio', detectedAspectRatio);
        const genRes = await fetch('server/generate.php', {method: 'POST', cache: 'no-store', body: genFormData});
        const genResult = await genRes.json();
        removeTypingIndicator(genTypingId);
        if (genResult.success && genResult.imageUrl) {
          appendMessage('bot', `Selesai! Ini hasilnya:`, genResult.imageUrl);
          if (window.playSuccessSound) window.playSuccessSound();
        } else {
          appendMessage('bot', "Gagal memproses gambar. Silakan coba lagi.");
          if (window.playErrorSound) window.playErrorSound();
        }
      }
    } else {
      // --- CHAT / Q&A MODE ---
      const formData = new FormData();
      const finalPrompt = buildChatPrompt(text);
      formData.append('prompt', finalPrompt);
      if (fileToSend) {
        formData.append('images[]', fileToSend);
      }
      const response = await fetch('server/chat.php', {method: 'POST', cache: 'no-store', body: formData});
      const result = await response.json();
      if (result.success || result.response) {
        const reply = result.response || result.candidates?.[0]?.content?.parts?.[0]?.text;
        const replyText = typeof reply === 'string' ? reply.trim() : '';
        await showAnsweredStatus(typingId);
        appendMessage('bot', replyText || '');
        if (currentMode === 'voice' && replyText) {
          setVoiceStatus('answered', 'SuFi sudah mendapatkan jawaban...');
          await requestTtsAudio(replyText);
        }
      } else {
        removeTypingIndicator(typingId);
        appendMessage('bot', "Maaf, saya sedang gangguan. Coba lagi nanti.");
      }
    }
  } catch (error) {
    console.error(error);
    removeTypingIndicator(typingId);
    appendMessage('bot', "Terjadi kesalahan koneksi.");
  } finally {
    // Re-enable Input
    setInputState(false);
  }
}
