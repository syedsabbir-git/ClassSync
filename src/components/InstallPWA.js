import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if user has already installed the app (stored in localStorage)
        const hasInstalledApp = localStorage.getItem('classsync-pwa-installed') === 'true';
        
        // Enhanced installation detection
        const checkIfInstalled = () => {
            return (
                window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://') ||
                window.matchMedia('(display-mode: minimal-ui)').matches ||
                window.matchMedia('(display-mode: fullscreen)').matches ||
                hasInstalledApp
            );
        };

        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const standalone = checkIfInstalled();

        setIsIOS(iOS);
        setIsStandalone(standalone);

        // Don't show banner if already installed
        if (standalone || hasInstalledApp) {
            return;
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsVisible(true);
        };

        const handleAppInstalled = () => {
            // Store installation state in localStorage
            localStorage.setItem('classsync-pwa-installed', 'true');
            localStorage.setItem('classsync-install-date', new Date().toISOString());
            
            setIsVisible(false);
            setInstallPrompt(null);
            setIsStandalone(true);
        };

        // Listen for display mode changes (when app gets installed)
        const handleDisplayModeChange = () => {
            const nowStandalone = checkIfInstalled();
            if (nowStandalone && !isStandalone) {
                localStorage.setItem('classsync-pwa-installed', 'true');
                setIsStandalone(true);
                setIsVisible(false);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        
        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addListener(handleDisplayModeChange);

        // Show install banner for non-installed users after a short delay
        const showBannerTimer = setTimeout(() => {
            if (!standalone && !checkIfInstalled() && !hasInstalledApp) {
                setIsVisible(true);
            }
        }, 3000);

        return () => {
            clearTimeout(showBannerTimer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            mediaQuery.removeListener(handleDisplayModeChange);
        };
    }, [isStandalone]);

    const handleInstallClick = async () => {
        if (!installPrompt) return;

        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;

            if (outcome === 'accepted') {
                // Mark as installed immediately when user accepts
                localStorage.setItem('classsync-pwa-installed', 'true');
                localStorage.setItem('classsync-install-date', new Date().toISOString());
                
                setIsVisible(false);
                setIsStandalone(true);
            } else {
                // User dismissed the install prompt
                setIsVisible(false);
                
                // Store dismissal to prevent immediate re-showing
                localStorage.setItem('classsync-install-dismissed', new Date().toISOString());
                
                setTimeout(() => {
                    if (!localStorage.getItem('classsync-pwa-installed')) {
                        setIsVisible(true);
                    }
                }, 600000); // Show again after 5 minutes if dismissed
            }
        } catch (error) {
            console.error('Error during installation:', error);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        
        // Store dismissal timestamp
        localStorage.setItem('classsync-install-dismissed', new Date().toISOString());
        
        // Show banner again after 2 minutes if dismissed manually
        setTimeout(() => {
            const isInstalled = localStorage.getItem('classsync-pwa-installed') === 'true';
            const isCurrentlyStandalone = window.matchMedia('(display-mode: standalone)').matches;
            
            if (!isInstalled && !isCurrentlyStandalone) {
                setIsVisible(true);
            }
        }, 120000*6); // 2 hours
    };

    // Don't show banner if app is already installed
    const hasInstalledApp = localStorage.getItem('classsync-pwa-installed') === 'true';
    
    if (isStandalone || hasInstalledApp) {
        return null;
    }

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center space-x-3">
                        {/* App Icon */}
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-200">
                            <img
                                src="/logo192.png"
                                alt="ClassSync Logo"
                                className="w-10 h-10 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="w-10 h-10 bg-blue-600 rounded-lg items-center justify-center hidden">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">Install ClassSync</h4>
                            <p className="text-gray-600 text-xs">
                                {isIOS
                                    ? "Tap Share → Add to Home Screen"
                                    : "Get quick access and work offline"
                                }
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center space-x-2">
                            {!isIOS && installPrompt && (
                                <button
                                    onClick={handleInstallClick}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Install
                                </button>
                            )}
                            <button
                                onClick={handleDismiss}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                                aria-label="Dismiss"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
