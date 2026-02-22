(function () {
  // Inject Modal HTML
  const modalHTML = `
    <div id="boost-topup-modal" class="fixed inset-0 z-[110] hidden flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 transition-all duration-300">
        <div class="relative w-full max-w-xs bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden transform transition-all scale-100 flex flex-col max-h-[85vh]">

            <!-- Header (Status Server Theme) -->
            <div class="px-4 py-3 text-white flex justify-between items-center relative overflow-hidden"
                 style="background: linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%); border-bottom: 1px solid rgba(255,255,255,0.05);">

                 <!-- Decorative glow -->
                 <div class="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <div class="flex items-center gap-3 relative z-10">
                    <div class="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 text-yellow-400 flex items-center justify-center shadow-lg shadow-black/20">
                        <i data-lucide="zap" class="w-4 h-4 fill-yellow-400"></i>
                    </div>
                    <div>
                        <h2 class="text-sm font-bold text-slate-100 tracking-wide">Isi Ulang Boost</h2>
                        <p class="text-[10px] font-medium text-slate-400">Kecepatan generate maksimal!</p>
                    </div>
                </div>
                <button id="close-boost-modal" class="relative z-10 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">

                <!-- Tier Selection -->
                <div id="boost-tiers" class="space-y-2.5">
                    <!-- Tier 1 -->
                    <div class="boost-tier-card group cursor-pointer relative bg-white border border-slate-200/60 rounded-2xl p-3 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300" data-tier="100" data-price="5000">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                    <span class="text-xs font-bold">100</span>
                                </div>
                                <div>
                                    <div class="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">100 Gambar</div>
                                    <div class="text-[10px] text-slate-400">Starter Pack</div>
                                </div>
                            </div>
                            <div class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">Rp 5rb</div>
                        </div>
                        <div class="absolute inset-0 border-2 border-transparent rounded-2xl pointer-events-none group-[.selected]:border-teal-500 group-[.selected]:bg-teal-50/10"></div>
                    </div>

                    <!-- Tier 2 -->
                    <div class="boost-tier-card group cursor-pointer relative bg-white border border-slate-200/60 rounded-2xl p-3 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300" data-tier="300" data-price="10000">
                        <div class="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 border border-white">POPULER</div>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                    <span class="text-xs font-bold">300</span>
                                </div>
                                <div>
                                    <div class="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">300 Gambar</div>
                                    <div class="text-[10px] text-slate-400">Best Value</div>
                                </div>
                            </div>
                            <div class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">Rp 10rb</div>
                        </div>
                        <div class="absolute inset-0 border-2 border-transparent rounded-2xl pointer-events-none group-[.selected]:border-teal-500 group-[.selected]:bg-teal-50/10"></div>
                    </div>

                    <!-- Tier 3 -->
                    <div class="boost-tier-card group cursor-pointer relative bg-white border border-slate-200/60 rounded-2xl p-3 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300" data-tier="500" data-price="15000">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                    <span class="text-xs font-bold">500</span>
                                </div>
                                <div>
                                    <div class="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">500 Gambar</div>
                                    <div class="text-[10px] text-slate-400">Creator Choice</div>
                                </div>
                            </div>
                            <div class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">Rp 15rb</div>
                        </div>
                        <div class="absolute inset-0 border-2 border-transparent rounded-2xl pointer-events-none group-[.selected]:border-teal-500 group-[.selected]:bg-teal-50/10"></div>
                    </div>

                    <!-- Tier 4 -->
                    <div class="boost-tier-card group cursor-pointer relative bg-white border border-slate-200/60 rounded-2xl p-3 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300" data-tier="1000" data-price="25000">
                         <div class="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 border border-white">HEMAT</div>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                    <span class="text-xs font-bold">1K</span>
                                </div>
                                <div>
                                    <div class="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">1000 Gambar</div>
                                    <div class="text-[10px] text-slate-400">Long Term</div>
                                </div>
                            </div>
                            <div class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">Rp 25rb</div>
                        </div>
                        <div class="absolute inset-0 border-2 border-transparent rounded-2xl pointer-events-none group-[.selected]:border-teal-500 group-[.selected]:bg-teal-50/10"></div>
                    </div>
                </div>

                <!-- Payment View (Hidden initially) -->
                <div id="boost-payment-view" class="hidden text-center">
                    <div id="payment-success-msg" class="hidden flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in duration-300">
                        <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 ring-4 ring-emerald-50 shadow-xl">
                            <i data-lucide="check" class="w-8 h-8 stroke-[3]"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 mb-0.5">Pembayaran Berhasil!</h3>
                        <p class="text-xs text-slate-500 mb-4">Kuota boost Anda telah aktif.</p>
                        <button onclick="document.getElementById('boost-topup-modal').classList.add('hidden')" class="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 text-xs">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            Tutup
                        </button>
                    </div>

                    <div id="payment-process-view" class="animate-in slide-in-from-bottom-4 duration-300">
                        <div class="bg-white rounded-xl p-3 border border-slate-200 mb-3 shadow-sm">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-[10px] font-medium text-slate-500">Total Pembayaran</span>
                                <span id="payment-amount-display" class="text-xs font-bold text-slate-800">Rp -</span>
                            </div>
                            <div class="w-full aspect-square bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 relative group">
                                <div id="qris-container" class="w-full h-full p-2"></div>
                                <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                     <a id="btn-download-qris-overlay" href="#" download="qris-payment.png" class="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                                        Download
                                    </a>
                                </div>
                            </div>
                            <p class="text-[9px] text-slate-400 mt-1.5">Scan QRIS via E-Wallet</p>
                        </div>

                        <div class="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-3 hidden">
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="timer" class="w-3.5 h-3.5 text-amber-500"></i>
                                <span class="text-[10px] font-medium text-amber-700">Sisa Waktu</span>
                            </div>
                            <div id="payment-timer" class="text-xs font-bold text-amber-600 font-mono">15:00</div>
                        </div>

                         <a id="btn-download-qris" href="#" download="qris-payment.png" class="w-full py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs mb-3">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i> Simpan QRIS
                        </a>

                        <button id="btn-check-payment" class="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 text-xs">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                            Konfirmasi Pembayaran
                        </button>
                        <p id="payment-status-label" class="text-[10px] text-center font-bold mt-2 hidden"></p>
                    </div>
                </div>
            </div>

            <!-- Footer Action -->
            <div id="boost-footer" class="p-3 border-t border-slate-200/60 bg-white">
                <button id="btn-bayar-boost" disabled class="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed enabled:bg-slate-900 enabled:text-white enabled:shadow-lg enabled:shadow-slate-900/20 enabled:cursor-pointer enabled:hover:bg-slate-800 text-xs">
                    <span>Pilih Paket</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5 transition-transform enabled:group-hover:translate-x-1"></i>
                </button>
            </div>
        </div>
    </div>
    `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  // Variables
  let selectedTier = null;
  let paymentInterval = null;
  let checkStatusInterval = null;
  let currentReference = null;

  // Functions
  function showBoostTopUpModal() {
    const modal = document.getElementById('boost-topup-modal');
    modal.classList.remove('hidden');
    resetModal();
    if (window.lucide) window.lucide.createIcons();
    // Check for pending transaction
    checkPendingTransaction();
  }

  async function checkPendingTransaction() {
    const email = localStorage.getItem('sulapfoto_verified_email');
    if (!email) return;
    try {
      const response = await fetch('/server/duitku_payment.php', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
          action: 'check_pending', email: email
        })
      });
      const result = await response.json();
      if (result.success && result.has_pending) {
        // Restore transaction view
        showPaymentView(result.transaction);
      }
    } catch (e) {
      console.error('Failed to check pending transaction', e);
    }
  }

  function hideBoostTopUpModal() {
    const modal = document.getElementById('boost-topup-modal');
    modal.classList.add('hidden');
    stopTimers();
  }

  function resetModal() {
    document.getElementById('boost-tiers').classList.remove('hidden');
    document.getElementById('boost-footer').classList.remove('hidden');
    document.getElementById('boost-payment-view').classList.add('hidden');
    // Reset button
    const btn = document.getElementById('btn-bayar-boost');
    btn.classList.remove('hidden');
    btn.disabled = true;
    btn.innerHTML = `<span>Pilih Paket</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5 transition-transform enabled:group-hover:translate-x-1"></i>`;
    // Reset cards
    document.querySelectorAll('.boost-tier-card').forEach(card => {
      card.classList.remove('selected');
    });
    currentReference = null;
    window.currentPaymentReference = null;
    stopTimers();
    if (window.lucide) window.lucide.createIcons();
  }

  function stopTimers() {
    if (paymentInterval) clearInterval(paymentInterval);
    if (checkStatusInterval) clearInterval(checkStatusInterval);
  }

  // Event Listeners
  document.getElementById('close-boost-modal').addEventListener('click', hideBoostTopUpModal);
  document.querySelectorAll('.boost-tier-card').forEach(card => {
    card.addEventListener('click', function () {
      // Select logic
      document.querySelectorAll('.boost-tier-card').forEach(c => {
        c.classList.remove('selected');
      });
      this.classList.add('selected');
      selectedTier = this.dataset.tier;
      const btn = document.getElementById('btn-bayar-boost');
      btn.disabled = false;
      btn.innerHTML = `
                <span>Bayar Rp ${parseInt(this.dataset.price).toLocaleString('id-ID')}</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 transition-transform enabled:group-hover:translate-x-1"></i>
            `;
      if (window.lucide) window.lucide.createIcons();
    });
  });
  document.getElementById('btn-bayar-boost').addEventListener('click', async function () {
    if (!selectedTier) return;
    const email = localStorage.getItem('sulapfoto_verified_email');
    if (!email) {
      alert('Silakan login ulang.');
      return;
    }
    this.disabled = true;
    this.innerHTML = `<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Memproses...</span>`;
    try {
      const response = await fetch('/server/duitku_payment.php', {
        method: 'POST', headers: {
          'Content-Type': 'application/json'
        }, body: JSON.stringify({
          action: 'create_transaction', email: email, tier: parseInt(selectedTier)
        })
      });
      const result = await response.json();
      if (result.success) {
        showPaymentView(result);
      } else {
        alert('Gagal membuat transaksi: ' + (result.message || 'Unknown error'));
        this.disabled = false;
        this.innerHTML = `<span>Bayar</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan koneksi.');
      this.disabled = false;
      this.innerHTML = `<span>Bayar</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  function showPaymentView(data) {
    document.getElementById('boost-tiers').classList.add('hidden');
    document.getElementById('boost-footer').classList.add('hidden');
    document.getElementById('boost-payment-view').classList.remove('hidden');
    // Ensure success msg is hidden and process view is shown
    document.getElementById('payment-success-msg').classList.add('hidden');
    document.getElementById('payment-process-view').classList.remove('hidden');
    // Update amount display
    document.getElementById('payment-amount-display').textContent = `Rp ${parseInt(data.amount).toLocaleString('id-ID')}`;
    // Render QR
    const qrContainer = document.getElementById('qris-container');
    qrContainer.innerHTML = ''; // Clear previous
    // Use QR Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qrString)}`;
    const img = document.createElement('img');
    img.src = qrUrl;
    img.alt = 'QRIS Payment';
    img.className = 'w-full h-full object-contain';
    qrContainer.appendChild(img);
    document.getElementById('btn-download-qris').href = qrUrl;
    document.getElementById('btn-download-qris-overlay').href = qrUrl;
    // Timer
    const expiry = data.remaining_seconds || (15 * 60);
    const timerEl = document.getElementById('payment-timer');
    if (timerEl && timerEl.parentElement) {
      timerEl.parentElement.classList.remove('hidden');
    }
    startTimer(expiry);
    // Start polling (via checkAppConfig)
    currentReference = data.reference;
    window.currentPaymentReference = currentReference; // Expose to script.js
    if (typeof checkAppConfig === 'function') {
      checkAppConfig(false); // Trigger immediate check
    }
  }

  // Handle payment status update from script.js
  window.handlePaymentStatusUpdate = function (status) {
    if (!status || !currentReference) return;
    if (status === 'success') {
      clearInterval(paymentInterval);
      currentReference = null;
      window.currentPaymentReference = null;
      // Show success UI inside modal
      document.getElementById('payment-process-view').classList.add('hidden');
      document.getElementById('payment-success-msg').classList.remove('hidden');
      // Refresh quota
      if (window.fetchBoostQuota) {
        window.fetchBoostQuota();
      }
    }
  };
  // Add manual check event listener
  document.getElementById('btn-check-payment').addEventListener('click', async function () {
    if (!currentReference) return;
    const btn = this;
    const originalContent = btn.innerHTML;
    const statusLabel = document.getElementById('payment-status-label');
    if (statusLabel) statusLabel.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = `<div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Cek...`;
    try {
      const response = await fetch('/server/duitku_payment.php', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
          action: 'check_status', reference: currentReference
        })
      });
      const result = await response.json();
      if (result.success && result.status === 'success') {
        clearInterval(paymentInterval);
        // Show success UI inside modal
        document.getElementById('payment-process-view').classList.add('hidden');
        document.getElementById('payment-success-msg').classList.remove('hidden');
        // Refresh quota
        if (window.fetchBoostQuota) {
          window.fetchBoostQuota();
        }
      } else {
        // If pending or failed
        if (statusLabel) {
          statusLabel.textContent = 'Pembayaran belum terkonfirmasi. Silakan tunggu beberapa saat lagi.';
          statusLabel.className = 'text-[10px] text-center font-bold mt-2 text-amber-600 animate-pulse';
          statusLabel.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.error('Manual check error', e);
      if (statusLabel) {
        statusLabel.textContent = 'Gagal mengecek status. Periksa koneksi Anda.';
        statusLabel.className = 'text-[10px] text-center font-bold mt-2 text-red-500';
        statusLabel.classList.remove('hidden');
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalContent;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('payment-timer');
    if (paymentInterval) clearInterval(paymentInterval);
    paymentInterval = setInterval(function () {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      display.textContent = minutes + ":" + seconds;
      if (--timer < 0) {
        clearInterval(paymentInterval);
        display.textContent = "EXPIRED";
        if (checkStatusInterval) clearInterval(checkStatusInterval);
        alert('Waktu pembayaran habis. Silakan ulangi.');
        hideBoostTopUpModal();
      }
    }, 1000);
  }

  function startPolling() {
    if (checkStatusInterval) clearInterval(checkStatusInterval);
    checkStatusInterval = setInterval(async () => {
      try {
        const response = await fetch('/server/duitku_payment.php', {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
            action: 'check_status', reference: currentReference
          })
        });
        const result = await response.json();
        if (result.success && result.status === 'success') {
          clearInterval(checkStatusInterval);
          clearInterval(paymentInterval);
          // Show success UI inside modal
          document.getElementById('payment-process-view').classList.add('hidden');
          document.getElementById('payment-success-msg').classList.remove('hidden');
          // Refresh quota
          if (window.fetchBoostQuota) {
            window.fetchBoostQuota();
          }
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 3000); // Check every 3 seconds
  }

  // Expose globally
  window.showBoostTopUpModal = showBoostTopUpModal;
})();
