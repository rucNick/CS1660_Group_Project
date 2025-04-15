/**
 * This is the client-side code that interacts with Firebase Auth to sign in users, updates the UI if the user is signed in,
 * and sends the user's vote to the server.
 *
 * When running on localhost, you can disable authentication by passing `auth=false` as a query parameter.
 *
 * NOTE: YOU ONLY NEED TO MODIFY THE VOTE FUNCTION AT THE BOTTOM OF THIS FILE.
 */
firebase.initializeApp(config);

function initApp() {
  firebase.auth().onAuthStateChanged(user => {
    const signInButton = document.getElementById('signInButton');
    if (user) {
      signInButton.innerText = 'Sign Out';
      document.getElementById('qrContainer').style.display = '';
    } else {
      signInButton.innerText = 'Sign In with Google';
      document.getElementById('qrContainer').style.display = 'none';
    }
  });
}

function authDisabled() {
  const urlParams = new URLSearchParams(window.location.search);
  const hostname = window.location.hostname;
  return urlParams.get('auth') === 'false' && hostname === 'localhost';
}

async function createIdToken() {
  if (authDisabled()) {
    console.warn('Auth is disabled. Returning dummy ID token.');
    return new Promise(resolve => 
      resolve('dummyToken'));
  } else {
    return await firebase.auth().currentUser.getIdToken();
  }
}

window.onload = function () {
  if (authDisabled()) {
    console.warn('Running with auth disabled.');
    document.getElementById('signInButton').innerText = '(Auth Disabled)';
    document.getElementById('form').style.display = '';
  } else {
    console.log('Running with auth enabled.');
    initApp();
  }
};

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then(result => {
      const name = result.user.displayName;
      const uid = result.user.uid;
      const qrPayload = "https://qr-attendance-1043677821736.us-central1.run.app/confirm";
      QRCode.toCanvas(document.getElementById('qrCanvas'), qrPayload, function (error) {
        if (error) console.error(error);
        console.log('QR code generated');
      });
      window.alert(`Welcome ${name}!`);
    })
    .catch(err => {
      console.log(`Sign in error: ${err.message}`);
      window.alert(`Sign in failed.`);
    });
}

function signOut() {
  firebase
    .auth()
    .signOut()
    .catch(err => {
      console.log(`Sign out error: ${err.message}`);
      window.alert(`Sign out failed.`);
  });
}

function toggle() {
  if (authDisabled()) {
    window.alert('Auth is disabled.');
    return;
  }
  if (!firebase.auth().currentUser) {
    signIn();
  } else {
    signOut();
  }
}

function showConfirmation(name, timestamp) {
  const container = document.getElementById("confirmationContainer");
  container.innerHTML = `
    <span style="font-size: 5rem;">✅</span>
    <h5>Attendance Confirmed</h5>
    <p><strong>${name}</strong> checked in at <em>${timestamp}</em></p>
  `;
  document.getElementById("qrContainer").style.display = "none";
}

async function checkAndConfirmAttendance() {
  if (window.location.pathname === "https://qr-attendance-1043677821736.us-central1.run.app/confirm") {
    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        const name = user.displayName;
        const uid = user.uid;
        const timestamp = await markAttendance(name, uid);
        if (timestamp) {
          showConfirmation(name, timestamp);
        } else {
          document.getElementById("confirmationContainer").innerHTML = `<h5>Failed to mark attendance.</h5>`;
        }
      } else {
        window.alert("You must be signed in to mark attendance.");
      }
    });
  }
}

