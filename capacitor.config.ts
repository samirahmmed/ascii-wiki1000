import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.Samir.asciiwiki', // এখানে একটি ইউনিক নাম দিন
  appName: 'ASCII Wiki',
  webDir: 'dist', // আপনার প্রজেক্ট অনুযায়ী এটি সঠিক
  bundledWebRuntime: false,
  plugins: {
    AdMob: {
      appId: "ca-app-pub-1352679620358374~3486294379", // <-- এইখানে আপনার অ্যাপ আইডি দিন
    }
  }
};

export default config;
