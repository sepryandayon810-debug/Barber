/**
 * ============================================================================
 * js/firebase-config.js — KONFIGURASI FIRESTORE & FIREBASE AUTH (TERPUSAT)
 * ============================================================================
 * Cara mengaktifkan ke proyek Firebase Anda sendiri:
 * 1. Buka Firebase Console -> Project Settings -> Your apps -> Web app.
 * 2. Salin nilai firebaseConfig Anda ke objek FIREBASE_CONFIG di bawah ini.
 * 3. Aktifkan "Authentication -> Sign-in method -> Email/Password" di Firebase Console.
 * 4. Aktifkan "Firestore Database" lalu tempel aturan dari file firestore.rules.
 * 5. Ubah ENABLE_FIREBASE menjadi true.
 *
 * CATATAN KEAMANAN PENTING:
 * - firebaseConfig web (apiKey, projectId, dll.) memang boleh ada di frontend
 *   karena itu hanya pengenal proyek publik — keamanan data dijaga 100% oleh
 *   Firebase Authentication + firestore.rules di server Google.
 * - JANGAN PERNAH menaruh password akun di file JS atau di dokumen Firestore!
 */
(function (global) {
  'use strict';

  var ENABLE_FIREBASE = false; // Ubah ke true setelah FIREBASE_CONFIG diisi

  var FIREBASE_CONFIG = {
  apiKey: "AIzaSyB7e-kIDuXoMoBKBxExEdpmIA90fkPYvPc",
  authDomain: "hifzipay.firebaseapp.com",
  projectId: "hifzipay",
  storageBucket: "hifzipay.firebasestorage.app",
  messagingSenderId: "133138253573",
  appId: "1:133138253573:web:1ad9938e13f26b74c9d96c"
  };

  // Domain email virtual jika user login pakai username saja (misal: owner -> owner@barber.local)
  var USERNAME_EMAIL_DOMAIN = 'barber.local';

  function toAuthEmail(usernameOrEmail) {
    var val = String(usernameOrEmail || '').trim().toLowerCase();
    if (val.indexOf('@') !== -1) return val;
    return val + '@' + USERNAME_EMAIL_DOMAIN;
  }

  function isConfigured() {
    return Boolean(
      ENABLE_FIREBASE &&
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.projectId &&
        FIREBASE_CONFIG.authDomain
    );
  }

  var firebaseReadyPromise = null;
  var fbApp = null;
  var fbAuth = null;
  var fbDb = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Gagal memuat Firebase SDK: ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function initFirebaseIfEnabled() {
    if (!isConfigured()) return null;
    if (firebaseReadyPromise) return firebaseReadyPromise;

    firebaseReadyPromise = (async function () {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js');

      var firebase = global.firebase;
      if (!firebase) throw new Error('Firebase SDK gagal terinisialisasi.');

      fbApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
      fbAuth = firebase.auth();
      fbDb = firebase.firestore();

      // Aktifkan cache offline bawaan Firestore (IndexedDB multi-tab)
      try {
        await fbDb.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        // Abaikan jika browser/tab ganda tidak mendukung lock persistence
      }

      // Hubungkan otomatis ke antrean sinkronisasi BarberDB
      if (global.BarberDB && typeof global.BarberDB.setFirestoreAdapter === 'function') {
        global.BarberDB.setFirestoreAdapter(async function (mutation) {
          if (!fbAuth.currentUser) {
            throw new Error('User belum login ke Firebase Auth.');
          }
          var col = fbDb.collection(mutation.collection);
          if (mutation.action.indexOf('DELETE_') === 0) {
            await col.doc(mutation.docId).delete();
          } else {
            var safePayload = Object.assign({}, mutation.payload);
            // Jangan pernah kirim hash/password mentah ke dokumen Firestore
            delete safePayload.passHash;
            delete safePayload.salt;
            delete safePayload.password;
            safePayload._updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            await col.doc(mutation.docId).set(safePayload, { merge: true });
          }
        });
      }

      return { app: fbApp, auth: fbAuth, db: fbDb };
    })();

    return firebaseReadyPromise;
  }

  async function signInWithFirebase(usernameOrEmail, password) {
    var sdk = await initFirebaseIfEnabled();
    if (!sdk) return null;
    var email = toAuthEmail(usernameOrEmail);
    var cred = await sdk.auth.signInWithEmailAndPassword(email, password);
    var uid = cred.user.uid;
    var doc = await sdk.db.collection('users').doc(uid).get();
    if (!doc.exists) {
      await sdk.auth.signOut();
      throw new Error('Profil role user belum terdaftar di koleksi Firestore users/' + uid);
    }
    var profile = doc.data();
    if (profile.active === false) {
      await sdk.auth.signOut();
      throw new Error('Akun Anda sedang dinonaktifkan oleh Owner/Developer.');
    }
    return {
      id: uid,
      name: profile.name || cred.user.email,
      username: profile.username || email,
      role: profile.role || 'kasir',
      active: true,
    };
  }

  async function signOutFirebase() {
    if (fbAuth && fbAuth.currentUser) {
      await fbAuth.signOut();
    }
  }

  global.BarberFirebase = {
    isConfigured: isConfigured,
    init: initFirebaseIfEnabled,
    signIn: signInWithFirebase,
    signOut: signOutFirebase,
    toAuthEmail: toAuthEmail,
  };

  if (isConfigured()) {
    initFirebaseIfEnabled().catch(function () {});
  }
})(window);
