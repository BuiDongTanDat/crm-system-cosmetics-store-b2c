document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    const emailInput = document.getElementById('email');
    const submitBtn = form.querySelector('.submit-btn');
    const successMessage = document.getElementById('successMessage');

    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (!validateEmail(email)) {
            showError('Vui lòng nhập địa chỉ email hợp lệ');
            return;
        }

        // Show loading state
        setLoading(true);
        
        // Simulate API call to save lead
        saveLead(email)
            .then(() => {
                showSuccess();
                form.reset();
            })
            .catch((error) => {
                showError('Có lỗi xảy ra. Vui lòng thử lại sau.');
                console.error('Error saving lead:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    });

    // Email validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Save lead function (simulate API call)
    function saveLead(email) {
        return new Promise((resolve, reject) => {
            // Simulate API delay
            setTimeout(() => {
                try {
                    // Get existing leads from localStorage
                    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                    
                    // Check if email already exists
                    if (leads.some(lead => lead.email === email)) {
                        reject(new Error('Email đã được đăng ký'));
                        return;
                    }
                    
                    // Add new lead
                    const newLead = {
                        id: Date.now(),
                        email: email,
                        timestamp: new Date().toISOString(),
                        source: 'landing-page'
                    };
                    
                    leads.push(newLead);
                    localStorage.setItem('leads', JSON.stringify(leads));
                    
                    // Log lead for analytics
                    console.log('New lead generated:', newLead);
                    
                    resolve(newLead);
                } catch (error) {
                    reject(error);
                }
            }, 1000);
        });
    }

    // Show loading state
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Đang xử lý...</span>';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Đăng ký ngay';
        }
    }

    // Show success message
    function showSuccess() {
        successMessage.classList.remove('hidden');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            hideSuccess();
        }, 3000);
        
        // Hide on click
        successMessage.addEventListener('click', hideSuccess);
    }

    // Hide success message
    function hideSuccess() {
        successMessage.classList.add('hidden');
    }

    // Show error message
    function showError(message) {
        // Create temporary error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }

    // Add CSS animation for error message
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Analytics tracking
    function trackEvent(eventName, data) {
        console.log('Analytics Event:', eventName, data);
        // Here you would integrate with Google Analytics, Facebook Pixel, etc.
    }

    // Track page view
    trackEvent('landing_page_view', {
        timestamp: new Date().toISOString(),
        page: 'landing-page'
    });

    // Track form interactions
    emailInput.addEventListener('focus', () => {
        trackEvent('form_email_focus', {
            timestamp: new Date().toISOString()
        });
    });
});
