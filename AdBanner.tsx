/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const AdBanner: React.FC = () => {
  useEffect(() => {
    // Only run AdMob logic on native platforms
    if (Capacitor.isNativePlatform()) {
      // Use an async function to handle the dynamic import
      const showBanner = async () => {
        try {
          const { AdMob, AdSize, AdPosition } = await import('@capacitor-community/admob');
          
          // IMPORTANT: Replace with your own Ad Unit ID from your AdMob account.
          // For testing, use the sample ID provided by Google: ca-app-pub-3940256099942544/6300978111
          const adId = 'ca-app-pub-1352679620358374/7288031910';

          const options = {
            adId: adId,
            adSize: AdSize.BANNER,
            position: AdPosition.BOTTOM_CENTER,
            margin: 0,
            // Use isTesting: true during development to avoid policy violations.
            // Set to false for production builds.
            isTesting: true,
          };
          
          await AdMob.showBanner(options);
        } catch (e) {
          console.error('Error showing banner ad', e);
        }
      };
      
      showBanner();

      // Clean up by hiding the banner when the component unmounts
      return () => {
        // Use an async IIFE for the cleanup, as it also needs a dynamic import
        (async () => {
          try {
            const { AdMob } = await import('@capacitor-community/admob');
            await AdMob.hideBanner();
          } catch(e) {
            console.error('Error hiding banner ad', e);
          }
        })();
      };
    }
  }, []);

  // This component doesn't render any visible HTML itself.
  // The AdMob plugin overlays a native UI component on top of the webview,
  // and resizes the webview to prevent content from being covered.
  return null;
};

export default AdBanner;
