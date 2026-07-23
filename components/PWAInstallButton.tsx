"use client";
import { useEffect, useState } from "react";

const PWAInstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);

    useEffect(() => {
        setIsClient(true);
        
        // Read dismissed state from localStorage
        const dismissed = localStorage.getItem("pwa_banner_dismissed");
        if (dismissed === "true") {
            setIsBannerDismissed(true);
        }

        const checkInstalled = () => {
            if (typeof window !== 'undefined' && (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true)) {
                setIsInstalled(true);
            }
        };

        const checkIOS = () => {
            if (typeof window !== 'undefined') {
                const userAgent = window.navigator.userAgent.toLowerCase();
                setIsIOS(/iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream);
            }
        };

        checkInstalled();
        checkIOS();

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // prevent auto prompt
            setDeferredPrompt(e);
        };
        
        if (typeof window !== 'undefined') {
            window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

            const handleAppInstalled = () => {
                setIsInstalled(true);
                setDeferredPrompt(null);
            };
            window.addEventListener("appinstalled", handleAppInstalled);

            return () => {
                window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
                window.removeEventListener("appinstalled", handleAppInstalled);
            };
        }
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            console.log("User choice:", choiceResult.outcome);
            if (choiceResult.outcome === "accepted") {
                setDeferredPrompt(null);
            }
        }
    };

    const handleDismiss = () => {
        setIsBannerDismissed(true);
        localStorage.setItem("pwa_banner_dismissed", "true");
    };

    if (!isClient || isInstalled) return null;
    if (!deferredPrompt && !isIOS) return null; // Wait for prompt or iOS detection

    return (
        <>
            {/* Top Banner State */}
            {!isBannerDismissed && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                    backgroundColor: 'var(--surface-0)',
                    borderBottom: '1px solid var(--surface-2)',
                    padding: '0.75rem 1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div style={{
                            width: '40px', height: '40px', backgroundColor: 'var(--brand-500)',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, color: 'white', fontWeight: 'bold', fontSize: '1.25rem'
                        }}>
                            S
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Install Sunrise Academy</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {isIOS ? "Tap Share → Add to Home Screen" : "Learn offline, no browser needed"}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {deferredPrompt && (
                            <button onClick={handleInstall} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                Install
                            </button>
                        )}
                        <button onClick={handleDismiss} style={{
                            background: 'transparent', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem 0.5rem'
                        }}>
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Pill Chip State (if dismissed but still installable) */}
            {isBannerDismissed && deferredPrompt && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '1.5rem', zIndex: 50
                }}>
                    <button 
                        onClick={handleInstall}
                        className="btn-primary"
                        style={{
                            borderRadius: '9999px',
                            padding: '0.75rem 1.5rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <span>📥 Install App</span>
                    </button>
                </div>
            )}
        </>
    );
};

export default PWAInstallButton;
