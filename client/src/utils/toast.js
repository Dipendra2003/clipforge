// Simple toast notification utility
// For production, consider using react-hot-toast or react-toastify

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full sm:w-auto px-4 sm:px-0';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `transform transition-all duration-300 ease-in-out translate-x-0 opacity-100 w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`;
    
    const colors = {
      success: 'bg-green-50 text-green-800 border-l-4 border-green-500',
      error: 'bg-red-50 text-red-800 border-l-4 border-red-500',
      warning: 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500',
      info: 'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
    };

    const icons = {
      success: `<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
      error: `<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
      warning: `<svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
      info: `<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    };

    toast.innerHTML = `
      <div class="p-4 ${colors[type]}">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            ${icons[type]}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium break-words">${message}</p>
          </div>
          <div class="flex-shrink-0">
            <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }
}

const toast = new ToastManager();
export default toast;
